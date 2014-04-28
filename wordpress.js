
var fs = require('fs'),
    path = require('path'),
    mustache = require('Mustache'),
    events = require('events'),
    exec = require("child_process").exec;

function normalizedName(name) {
    return name.substr(name.lastIndexOf('.') + 1, name.length);
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
        name: normalizedName(this.layer.name),
        post_content: 'No content'
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

    this.findLayersBy('name', /^menu\./gi, this.layer.siblings).forEach(function (menu) {
        var reference = _this.wordpress.getReferenceTo(menu);

        if (undefined !== reference) {
            _this.items.menus.push(reference);
        }
    });
}

Header.prototype = Object.create(WordpressItem.prototype);
Header.prototype.constructor = Header;

Header.prototype.created = function () {

    this.status.created = true;
    this.ready();
};

/**
 * Footer constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Footer(wordpress, config) {
    var _this = this;

    WordpressItem.call(this, wordpress, config);

    this.items = {
        menus: []
    };

    /*
    this.findLayersBy('name', /^menu\./gi, this.layer.siblings).forEach(function (menu) {
        var reference = _this.wordpress.getReferenceTo(menu);

        if (undefined !== reference) {
            _this.items.menus.push(reference);
        }
    });
    */
}

Footer.prototype = Object.create(WordpressItem.prototype);
Footer.prototype.constructor = Footer;

// This is a hack. Don't do it!
Footer.prototype.create = function () {
    this.created();
};

Footer.prototype.created = function () {

    this.status.created = true;
    this.ready();
};

/**
 * Page constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Page(wordpress, config) {
    var _this = this;

    WordpressItem.call(this, wordpress, config);

    this.layerReferences = {
        getHTML: this.layer.getHTML.bind(this.layer),
        getCSS: this.layer.getCSS.bind(this.layer)
    };

    this.properties.post_type = config.post_type;

    this.layer.getHTML = function () {
        return _this.layerReferences.getHTML();
    };

    this.layer.getCSS = function () {
        return _this.layerReferences.getCSS();
    };

    if (null !== this.layer.name.match(/link\./gi)) {
        this.layer.tag = 'a';
        this.layer.href = 'http://temporary';
    }

    this.links = [];

    this.findLayersBy('name', /link\./gi, this.layer.siblings).forEach(function (linkLayer) {
        linkLayer.tag = 'a';
        _this.links.push(linkLayer);
    });

    this.findLayersBy('name', /description\./gi, this.layer.siblings).forEach(function (contentLayer) {
        _this.properties.post_content = contentLayer.text;
    });

    this.images = [];

    this.findLayersBy('name', /image\./gi, this.layer.siblings).forEach(function (imageLayer) {
        _this.images.push(imageLayer);
    });

    this.titles = [];

    this.findLayersBy('name', /title\./gi, this.layer.siblings).forEach(function (titleLayer) {
        _this.titles.push(titleLayer);
    });

    // 
}

Page.prototype = Object.create(WordpressItem.prototype);
Page.prototype.constructor = Page;

Page.prototype.create = function () {
    var prop = {
        post_title: this.properties.name,
        post_type: this.properties.post_type,
        post_content: escape(this.properties.post_content)
    };

    this.parent.create.call(this, prop);
};

Page.prototype.created = function (props) {
    var _this = this;
    this.status.created = true;

    this.layer.href = this.properties.url;

    this.links.forEach(function (link) {
        link.href = _this.properties.url;
    });

    this.finishedImages = 0;

    this.titles.forEach(function (title) {
        title.text = '<?php'
            + ' $post = get_post("' + _this.properties.post_id + '"); '
            + ' echo $post->post_title; '
            + ' ?>';
    });
    
    this.images.forEach(function (image) {
        _this.wordpress.sendCommand({
            action: 'insert_image',
            file_name: image.fileName,
            post_id: _this.properties.post_id
        }, function (answer) {
            image.fileSrc = '<?php '
                + '$attachments = get_posts( array( '
                + ' "post_type" => "attachment", '
                + ' "posts_per_page" => 1, '
                + ' "post_parent" => ' + _this.properties.post_id // $post->ID, '
                + ' ) );'
                + ' echo wp_get_attachment_url($attachments[0]->ID); '
                + '?>';

            _this.finishedImages += 1;
            if (_this.finishedImages === _this.images.length) {
                _this.ready();
            }
        });
    });

    if (0 === this.images.length) {
        this.ready();
    }
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
        post_title: this.properties.name,
        link_id: linkId,
        post_id: this.properties.post_id
    }, function (answer) {
        // console.log('Page ' + _this.properties.post_id + ' was linked to ' + linkType + ' id=' + itemId);
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

    _this.findLayersBy('name', /^page\./gi, this.layer.siblings).forEach(function (page) {
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


/**
 * Banner constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Banner(wordpress, config) {
    WordpressItem.call(this, wordpress, config);
}

Banner.prototype = Object.create(WordpressItem.prototype);
Banner.prototype.constructor = Banner;

Banner.prototype.create = function () {
    this.events.emit('created');
};

Banner.prototype.created = function (props) {
    this.status.created = true;

    this.ready();
};

/**
 * Sidebar constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Sidebar(wordpress, config) {
    WordpressItem.call(this, wordpress, config);

    // <?php get_sidebar(); ?>
}

Sidebar.prototype = Object.create(WordpressItem.prototype);
Sidebar.prototype.constructor = Sidebar;

Sidebar.prototype.create = function () {
    this.events.emit('created');
};

Sidebar.prototype.created = function (props) {
    this.status.created = true;

    this.ready();
};

/**
 * Content constructor.
 * @param {[type]} wordpress [description]
 * @param {[type]} config    [description]
 */
function Content(wordpress, config) {
    WordpressItem.call(this, wordpress, config);
}

Content.prototype = Object.create(WordpressItem.prototype);
Content.prototype.constructor = Content;

Content.prototype.create = function () {
    this.events.emit('created');
};

Content.prototype.created = function (props) {
    this.status.created = true;

    this.ready();
};


/**
 * Wordpress constructor.
 * @param {[type]} config [description]
 */
function Wordpress(config) {
    this.layers = config.layers;

    this.files = {
        header: config.folders.wordpress + 'header.php'
    };

    this.folders = config.folders;

    // Overwrite also the structure folder due to config.folders comming through
    // reference.
    this.folders.wordpress = path.resolve(__dirname, 'wordpress/') + '/';
    this.folders.images = this.folders.wordpress + 'images/';
    this.folders.src = 'http://generator/wp-content/themes/generator/images/';

    this.templates = {
        header: this.folders.wordpress + 'templates/header.php'
    };

    this.items = {
        menus: [],
        pages: [],
        headers: [],
        banners: [],
        contents: [],
        sidebars: [],
        footers: []
    };

    this.status = {
        ready: false,
        wordpressReset: false, 
        items: {}
    };

    this.events = new events.EventEmitter();

    this.entrypoint = this.folders.wordpress + 'wp_seed.php ';
}

Wordpress.prototype.resetWordpress = function () {
    var _this = this;

    this.sendCommand({
        action: 'reset'
    }, function () {
        _this.status.wordpressReset = true;
        _this.events.emit('wordpressReset');
    });

    return this;
};

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

    // TODO: optimise the logic for item creation.

    this.findLayersBy('name', /^page\./gi).forEach(function (pageLayer) {

        /* TODO:
        if (true === pages.hasOwnProperty(pageLayer.name)) {
            pages[pageLayer.name].addLayer(pageLayer);
        } */

        _this.items.pages.push(_this.createItem('page', {
            layer: pageLayer,
            post_type: 'page'
        }));
    });

    this.findLayersBy('name', /^post\./gi).forEach(function (postLayer) {
        _this.items.pages.push(_this.createItem('page', {
            layer: postLayer,
            post_type: 'post'
        }));
    });

    // --- 

    this.findLayersBy('name', /^menu\./gi).forEach(function (menuLayer) {
        _this.items.menus.push(_this.createItem('menu', {
            layer: menuLayer
        }));
    });

    this.findLayersBy('name', /^header\./gi).forEach(function (headerLayer) {
        _this.items.headers.push(_this.createItem('header', {
            layer: headerLayer
        }));
    });

    this.findLayersBy('name', /^banner\./gi).forEach(function (bannerLayer) {
        _this.items.banners.push(_this.createItem('banner', {
            layer: bannerLayer
        }));
    });

    this.findLayersBy('name', /^content\./gi).forEach(function (contentLayer) {
        _this.items.contents.push(_this.createItem('content', {
            layer: contentLayer
        }));
    });

    this.findLayersBy('name', /^sidebar\./gi).forEach(function (sidebarLayer) {
        _this.items.sidebars.push(_this.createItem('sidebar', {
            layer: sidebarLayer
        }));
    });

    this.findLayersBy('name', /^footer\./gi).forEach(function (footerLayer) {
        _this.items.footers.push(_this.createItem('footer', {
            layer: footerLayer
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

    // console.log(ready + ' vs ' + (Object.keys(this.status.items).length - 1));
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

        case 'banner':
            return new Banner(this, config);
        break;

        case 'content':
            return new Content(this, config);
        break;

        case 'sidebar':
            return new Sidebar(this, config);
        break;

        case 'footer':
            return new Footer(this, config);
        break;

        default:
            console.error('The "' + type + '" item type is not recognized.');
        break;
    }

};

Wordpress.prototype.create = function (itemName) {
    var _this = this;

    if (false === this.status.wordpressReset) {
        this.events.once('wordpressReset', function () {
            _this.create(itemName);
        });
        return this;
    }

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

    console.log(args);
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

        return this;
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

    // Construct the homepage.
    var homeFile = fs.readFileSync(this.folders.wordpress + 'templates/home.php',  'utf8');

    var banner = this.items.banners[0];

    var content = this.items.contents[0];

    var sidebar = this.items.sidebars[0];

    var rawHTML = content.layer.getHTML();

    var footerFile = fs.readFileSync(this.folders.wordpress + 'templates/footer.php',  'utf8');

    var footer = this.items.footers[0];

    var footerOutputHTML = mustache.render(footerFile, {
        footer: footer.layer.getHTML()
    });

    fs.writeFileSync(_this.folders.wordpress + 'footer.php', footerOutputHTML);
    fs.writeFileSync(_this.folders.wordpress + 'styles/footer.css', footer.layer.getCSS());


    var homeOutputCSS = banner.layer.getCSS();
    homeOutputCSS += content.layer.getCSS();

    // TOOD: Create a getCSS/getHTML interface on the object
    // sidebar.getCSS() / sidebar.getHTML()

    homeOutputCSS += sidebar.layer.getCSS();

    // Construct the content.
    var homeOutputHTML = mustache.render(homeFile, {
        banner: banner.layer.getHTML(),
        content: rawHTML,
        sidebar: sidebar.layer.getHTML()
    });

    fs.writeFileSync(_this.folders.wordpress + 'home.php', homeOutputHTML);
    fs.writeFileSync(_this.folders.wordpress + 'styles/home.css', homeOutputCSS);
    console.log('Output finished.');

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