
var Plugin = require('../lib/Plugin.js');

function slider(layer) {

    this.layer = layer;

    this.integration = {

        html: ''

    };

    this.process = function() {

//        this.use('.arrowLeft');
//        this.use('.arrowRight');
//        this.use('.bullet');
//        this.use('.activeBullet');
//        this.use('.slide');
//        this.use('.slide[.slide] > .title');
//        this.use('.slide[.slide] > .subtitle');

        console.log(this.layer.getHTML(true))

    };

    return this;
}

slider.prototype = Object.create(Plugin.prototype);
slider.prototype.constructor = Plugin;

module.exports = slider

/**
     * UI Component constructor.

    function UIComponent() {

    }

    // () vs []
    // Functions from conventions

    UIComponent.prototype.setSiblings = function (setType, elements) {
        var _this = this;

        Object.keys(elements).forEach(function (elementName) {

            if (undefined === _this.siblings[elementName] && 'list' === setType) {
                _this.siblings[elementName] = [];
            }

            _this.parent.find('.' + elementName).forEach(function (result) {
                var item = {};

                item.element = result;

                elements[elementName].forEach(function (elementSelector) {
                    item[elementSelector] = result.find('.' + elementSelector)[0];
                });

                if ('list' === setType) {
                    _this.siblings[elementName].push(item);
                } else {
                    _this.siblings[elementName] = item;
                }
            });

        });
    };


    /**
     * Slider constructor.
     * Will register a layer and will modify the layer structure to conform
     * to that of a slider/carusel syntax while maintaining the initial logic.

    function Slider(layer) {

        this.parent = layer;
        this.siblings = {};

        this.setSiblings('elements', {
            arrows: ['left', 'right']
        });

        this.setSiblings('list', {
            slides: ['title', 'caption', 'image'],
            bullets: ['title'],
            thumbnails: ['title', 'image']
        });

        console.log(Object.keys(this.siblings.arrows.left));

        return this;
    }
    Slider.prototype = Object.create(UIComponent.prototype);
    Slider.prototype.constructor = Slider;



*/