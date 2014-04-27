
var fs = require('fs'),
    mustache = require('Mustache'),
    events = require('events'),
    exec = require("child_process").exec;

function normalizedName(name) {
    return name.substr(name.indexOf('.') + 1, name.length);
}



/**
 * WordpressItem constructor
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function WordpressItem(wordpress, config) {
    var _this = this;

    Object.keys(config).forEach(function (key) {
        _this[key] = config[key];
    });

    this.parent = WordpressItem.prototype;

    this.wordpress = wordpress;

    this.properties = {
        name: normalizedName(this.layer.name)
    };

    this.status = {
        created: false,
        ready: false
    };

    this.type = this.constructor.name.toLowerCase();

    this.events = {
        on: function (eventName, method) {
            _this.wordpress.events.on(eventName + '.' + _this.id, method);
        },
        once: function (eventName, method) {
            _this.wordpress.events.once(eventName + '.' + _this.id, method);
        },
        emit: function () {
            arguments[0] = arguments[0] + '.' + _this.id;
            _this.wordpress.events.emit.apply(_this.wordpress.events, arguments);
        },
        removeListener: function (eventName, method) {
            _this.wordpress.events.removeListener(eventName + '.' + _this.id, method);
        }
    };

    this.events.on('created', this.created.bind(this));
}

WordpressItem.prototype.create = function (props) {
    var _this = this;

    props.action = 'create_' + this.type;

    this.wordpress.sendCommand(props, function (answer) {

        Object.keys(answer).forEach(function (key) {
            _this.properties[key] = answer[key];
        });

        _this.events.emit('created');
    });

};

WordpressItem.prototype.ready = function () {
    console.log(this.type + ' with id ' + this.id + ' is ready.');

    this.status.ready = true;
    this.events.emit('ready');
};

WordpressItem.prototype.findLayersBy = function (propertyName, value) {
    return this.wordpress.findLayersBy(propertyName, value, this.layer.siblings);
};

/**
 * Header constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Header(wordpress, config) {
    var _this = this;

    WordpressItem.call(this, wordpress, config);

    this.items = {
        menus: []
    };

    this.findLayersBy('name', /^menu\./gi).forEach(function (menu) {
        var reference = _this.wordpress.getReferenceTo(menu);

        if (undefined !== reference) {
            _this.items.menus.push(reference);
        }
    });
}

Header.prototype = Object.create(WordpressItem.prototype);
Header.prototype.constructor = Header;

Header.prototype.created = function () {
    console.log('The header was created');

    this.status.created = true;
    this.ready();
};


/**
 * Page constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Page(wordpress, config) {
    WordpressItem.call(this, wordpress, config);
}

Page.prototype = Object.create(WordpressItem.prototype);
Page.prototype.constructor = Page;

Page.prototype.create = function () {
    var prop = {
        title: this.properties.name
    };

    this.parent.create.call(this, prop);
};

Page.prototype.created = function (props) {
    console.log('The page was created');
    this.status.created = true;

    this.ready();
};

Page.prototype.linkTo = function (linkType, itemId, linkId) {
    var _this = this;

    if (false === this.status.created) {

        this.events.once('created', function () {
            _this.linkTo(linkType, itemId, linkId);
        });

        return;
    }

    this.wordpress.sendCommand({
        action: 'link_to_' + linkType,
        post_title: this.properties.title,
        link_id: linkId,
        post_id: this.properties.post_id
    }, function (answer) {
        console.log('Page ' + _this.properties.post_id + ' was linked to ' + linkType + ' id=' + itemId);
        _this.properties.link_id = answer.link_id;
        _this.events.emit('linkedTo.' + itemId);
    });
};

// Each header, menu, page instance can have more layers
// that will be selected depending on the parent.
// If a page is in a header, then the layer that sits
// in that header will be used for parsing.
// This means that the getHTML/getCSS will need to take into
// account the parent from which the request was made. 
// The linkTo method needs to also logically link the instances.

/**
 * Menu constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Menu(wordpress, config) {
    var _this = this;

    WordpressItem.call(this, wordpress, config);

    this.items = {
        pages: []
    };

    this.layerReferences = {
        getHTML: this.layer.getHTML.bind(this.layer),
        getCSS: this.layer.getCSS.bind(this.layer)
    };

    this.layer.getHTML = function () {
        return '<?php wp_nav_menu("' + _this.properties.name + '"); ?>';
    };

    this.layer.getCSS = function () {
        _this.layer.cssId = 'menu-' + _this.properties.name.toLowerCase();

        _this.items.pages.forEach(function (page) {
            page.layer.cssId = 'menu-item-' + page.properties.link_id
        });

        return _this.layerReferences.getCSS();
    };

    _this.findLayersBy('name', /^page\./gi).forEach(function (page) {
        var reference = _this.wordpress.getReferenceTo(page);

        if (undefined !== reference) {
            _this.items.pages.push(reference);
        }
    });

}

Menu.prototype = Object.create(WordpressItem.prototype);
Menu.prototype.constructor = Menu;

Menu.prototype.create = function () {
    var prop = {
        name: this.properties.name,
        description: 'Menu generated by GenX'
    };

    this.parent.create.call(this, prop);
};

Menu.prototype.created = function () {
    console.log('The menu was created');
    this.created = true;

    this.linkPages();
};

Menu.prototype.linkPages = function () {
    var _this = this,
        expectedLinks = this.items.pages.length;

    function linked() {
        expectedLinks -= 1;

        if (0 === expectedLinks) {
            _this.ready();
        }
    }

    this.items.pages.forEach(function (page) {
        page.events.once('linkedTo.' + _this.id, linked);

        page.linkTo(_this.type, _this.id, _this.properties.id);
    });
};

// Rename layer ids to conform to the automatic wordpress standards.

Menu.prototype.linkPagesToMenu = function () {
    var _this = this,
        linksQueue = [];

    this.siblings.forEach(function (sibling) {
        linksQueue.push(sibling);
    });

    function linkPages() {
        var link;

        if (0 !== linksQueue.length) {
            link = linksQueue.shift();


        } else {
            _this.finished();
        }
    }

    linkPages();
};

Menu.prototype.finished = function () {
    // this.wordpress.
};

function Wordpress(config) {
    this.layers = config.layers;

    this.files = {
        header: config.folders.wordpress + 'header.php'
    };

    this.folders = {
        wordpress: config.folders.wordpress
    };

    this.templates = {
        header: this.folders.wordpress + 'templates/header.php'
    };

    this.items = {
        menus: [],
        pages: [],
        headers: []
    };

    this.status = {
        ready: false,
        items: {}
    };

    this.events = new events.EventEmitter();

    this.entrypoint = this.folders.wordpress + 'wp_seed.php ';
}

Wordpress.prototype.getReferenceTo = function (obj) {
    var _this = this,
        reference;

    Object.keys(this.items).every(function (itemListName) {
        _this.items[itemListName].forEach(function (item) {
            if (item.layer === obj) {
                reference = item;
                return false;
            } else {
                return true;
            }
        });

        if (undefined !== reference) {
            return false;
        } else {
            return true;
        }
    });

    return reference;
};

Wordpress.prototype.getUniqueId = (function () {
    var uniqueID = 0;

    return function () {
        uniqueID += 1;
        return 'item.' + uniqueID;
    };
}());

Wordpress.prototype.parseLayers = function () {
    var _this = this;

    var pages = {};

    this.findLayersBy('name', /^page\./gi).forEach(function (pageLayer) {

        /* TODO:
        if (true === pages.hasOwnProperty(pageLayer.name)) {
            pages[pageLayer.name].addLayer(pageLayer);
        } */

        _this.items.pages.push(_this.createItem('page', {
            layer: pageLayer
        }));
    });

    this.findLayersBy('name', /^menu\./gi).forEach(function (menuLayer) {
        _this.items.menus.push(_this.createItem('menu', {
            layer: menuLayer
        }));
    });

    this.findLayersBy('name', /^header/gi).forEach(function (headerLayer) {
        _this.items.headers.push(_this.createItem('header', {
            layer: headerLayer
        }));
    });

    return this;
};

Wordpress.prototype.updateItemStatus = function (status, value, itemId) {
    this.status.items[itemId][status] = value;

    this.checkReady();
};

Wordpress.prototype.checkReady = function () {
    var _this = this,
        ready = 0;

    Object.keys(this.status.items).forEach(function (item) {
        if (true === _this.status.items[item].ready) {
            ready += 1;
        }
    });

    if (ready === Object.keys(this.status.items).length - 1) {
        this.ready();
    }
};

Wordpress.prototype.ready = function () {
    this.status.ready = true;

    console.log('Wordpress setup is ready for output.');
    this.events.emit('ready');
};

Wordpress.prototype.createItem = function (type, config) {
    var _this = this;

    config.type = type;
    config.id = this.getUniqueId();

    this.status.items[config.id] = {
        created: false
    };

    this.events.on('created.' + config.id, function () {
        _this.updateItemStatus('created', true, config.id);
    });

    this.events.on('ready.' + config.id, function () {
        _this.updateItemStatus('ready', true, config.id);
    });

    switch (type) {
        case 'menu':
            return new Menu(this, config);
        break;

        case 'header':
            return new Header(this, config);
        break;

        case 'page':
            return new Page(this, config);
        break;

        default:
            console.error('The "' + type + '" item type is not recognized.');
        break;
    }

};

Wordpress.prototype.create = function (itemName) {

    this.items[itemName].forEach(function (item) {
        item.create();
    });

    return this;
};

Wordpress.prototype.sendCommand = function (params, done) {
    var args = '';

    Object.keys(params).forEach(function (key) {
        args += ' ' + key + '="' + params[key] + '" ';
    });

    exec('php -f ' + this.entrypoint + args, function (error, stdout, stderr) {
        console.log('Stdout' + stdout);
        var response = JSON.parse(stdout);
        done(response);
    });

    return this;
};

/**
 * Find a layer by a certain property.
 * @param  {string} propertyName The property name to which elements are verified.
 * @param  {object} value        The value used for comparison.
 * @param  {array} siblings     The list of layers in which to look in.
 * @return {array}              An array with the found layers.
 */
Wordpress.prototype.findLayersBy = function (propertyName, value, siblings) {
    var _this = this,
        layers = [],
        search = new RegExp(value);

    if (undefined === siblings) {
        siblings = this.layers;
    }

    function findLayers(siblings) {
        siblings.forEach(function (sibling) {

            if (undefined !== sibling._get(propertyName) && null !== sibling._get(propertyName).match(search)) {
                layers.push(sibling);
            }

            if (0 !== sibling.siblings.length) {
                findLayers(sibling.siblings);
            }
        });
    }

    findLayers(siblings);

    return layers;
};

Wordpress.prototype.output = function () {
    var _this = this;

    if (false === this.status.ready) {

        this.events.once('ready', function () {
            _this.output();
        });

        return;
    }

    console.log('Creating output for wordpress.');

    var headerFile = fs.readFileSync(this.folders.wordpress + 'templates/header.php',  'utf8');

    var header = this.items.headers[0];
    var css = header.layer.getCSS();

    var outputHTML = mustache.render(headerFile, {
        masthead: header.layer.getHTML()
    });

    var outputCSS = header.layer.getCSS();

    fs.writeFileSync(_this.folders.wordpress + 'header.php', outputHTML);
    fs.writeFileSync(_this.folders.wordpress + 'styles/header.css', outputCSS);
    
};


/*





        var pagesQueue = [],
            linksQueue = [],
            menu_id;

        sendCommand({
            action: 'get_settings'
        }, function (answer) {
            _this.wordpress = answer;
            addMenu();
        });

        var xheader = findElement(this.parent.siblings, 'xheader');
        var xmenu = findElement(xheader.siblings, 'xmenu');

        xmenu.siblings.forEach(function (sibling) {
            sibling.wordpress = {};
            pagesQueue.push(sibling);
        });

        

*/

module.exports = Wordpress;