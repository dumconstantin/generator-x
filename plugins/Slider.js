
var DefaultPlugin = require('./DefaultPlugin.js');

function Slider(layer) {

    DefaultPlugin.call(this,layer);

    this.elements = {
        arrowLeft: {
            text: 'text',
            background: 'image'
        },
        bullets: {

        },
        bullet: {
            title: 'text',
            background: 'image'
        }
    };

}

Slider.prototype = Object.create(DefaultPlugin.prototype);
Slider.prototype.constructor = Slider;

module.exports = Slider;