
var mustache = require('Mustache'),
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

    this.parent = WordpressItem;

    this.wordpress = wordpress;

    this.properties = {
        name: normalizedName(this.layer.name)
    };

    // Normalize siblings.
    if (undefined !== this.siblings) {
        this.siblings.forEach(function (sibling) {
            sibling.properties = {
                name: normalizedName(sibling.name)
            };
        });
    }

    this.events = new events.EventEmitter();

    this.events.on('created', this.created.bind(this));
}

WordpressItem.prototype.create = function () {
    var _this = this;

    this.wordpress.sendCommand({
        action: 'create_' + this.type,
        name: this.properties.name,
        description: 'Generated with GenX'
    }, function (answer) {
        Object.keys(answer).forEach(function (key) {
            
        });
        
        _this.properties.id = undefined !== answer.term_id ? answer.term_id : answer.error_data.term_exists;
        console.log('Menu ' + _this.properties.name + ' with id ' + _this.properties.id + ' was created.');
        _this.events.emit('created');
    });

};

WordpressItem.prototype.created = function () {
    console.log('Method is not implemented by ' + this.type + '.');
};

/**
 * Header constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Header(wordpress, config) {

}

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

    _this.wordpress.sendCommand({
        action: 'register_page',
        title: page.properties.name
    }, function (answer) {
        page.properties.post_id = answer.post_id;
        page.properties.url = answer.url;
        registerPages();
    });
};



/**
 * Menu constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Menu(wordpress, config) {
    WordpressItem.call(this, wordpress, config);
}

Menu.prototype = Object.create(WordpressItem.prototype);
Menu.prototype.constructor = Menu;

Menu.prototype.created = function () {
    console.log('The menu was created');
};


// Rename layer ids to conform to the automatic wordpress standards.

Menu.prototype.registerPages = function () {
    var _this = this,
        pagesQueue = [];

    this.siblings.forEach(function (sibling) {
        pagesQueue.push(sibling);
    });

    function registerPages() {
        var page;

        if (0 !== pagesQueue.length) {
            page = pagesQueue.shift();
            _this.wordpress.sendCommand({
                action: 'register_page',
                title: page.properties.name
            }, function (answer) {
                page.properties.post_id = answer.post_id;
                page.properties.url = answer.url;
                registerPages();
            });
        } else {
            _this.linkPagesToMenu();
        }
    }

    registerPages();
};

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
            _this.wordpress.sendCommand({
                action: 'link_page',
                post_title: link.properties.name,
                menu_id: _this.properties.id,
                post_id: link.properties.post_id
            }, function (answer) {
                linkPages();
            });

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
        menu: [],
        pages: [],
        header: {}
    };

    this.entrypoint = this.folders.wordpress + 'wp_seed.php ';
}

Wordpress.prototype.parseLayers = function () {
    var _this = this;

    this.findLayersBy('name', /^menu\./gi).forEach(function (menuLayer) {
        _this.items.menu.push(_this.createItem('menu', {
            layer: menuLayer,
            siblings: _this.findLayersBy('name', /^page\./gi)
        }));
    });

    this.findLayersBy('name', /^page\./gi).forEach(function (pageLayer) {
        _this.items.pages.push(_this.createItem('page', {
            layer: pageLayer
        }));
    });

    this.items.header = this.createItem('header', {
        layer: this.findLayersBy('name', /^header/gi)[0]
    });

    return this;
};

Wordpress.prototype.createItem = function (type, config) {

    config.type = type;

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

    // this.items.menu 

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

        

function makeOutput() {
     var section = {
        name: xheader.name,
        html: xheader.getHTML(),
        css: xheader.getCSS()
    };

    var headerFile = fs.readFileSync(_this.folders.wordpress + 'templates/header.php',  'utf8');

    var output = mustache.render(headerFile, {
        masthead: section.html
    });
    fs.writeFileSync(_this.folders.wordpress + 'header.php', output);
    fs.writeFileSync(_this.folders.wordpress + 'generator.css', section.css);
}
*/

module.exports = Wordpress;