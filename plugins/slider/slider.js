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


    // .slider {
        html: '<div id="slider">' +
                    '<div id="slides">{{slider_collection}}</div>' +
                    '<div id="bullets">{{bullet_collection}}></div>' +
                '</div>',
        collections: {
            slider: {
                html: '<div class="slide"><h2>{{title}}</h2><img src="{{image}}" /></div>',
                content: [
                    { title: 'foo bar', image: 'foo.png'},
                    { title: 'baz bar', image: 'baz.png'}
                ],
                params: {
                    orderBy: 'date',
                    order: 'asc',
                    limit: 5
                }
            },
            bullet: {
                html: '<div class="bullet"><span>{{index}}</span></div>'
            }
        }
    }
    .slides.orderBy(date).order(asc).limit(5)
*/