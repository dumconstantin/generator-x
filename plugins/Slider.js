
var DefaultPlugin = require('./DefaultPlugin.js');

function Slider(layer) {

    DefaultPlugin.call(this,layer);

}

Slider.prototype = Object.create(DefaultPlugin.prototype);
Slider.prototype.constructor = Slider;

module.exports = Slider;