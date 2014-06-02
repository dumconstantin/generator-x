var Layer = require('./Layer.js');

/**
 * Plugin Super Class
 *
 * All plugins will inherit this plugin functionality and extend it
 *
 * @param layer
 * @constructor
 */
function Plugin(layer) {

    var _this = this;

    /**
     * @type {Layer}
     */
    this.layer = layer;

    this.integration = {
        type: '',
        html: ''
    }

}

Plugin.prototype.getLayerByExtension = function(extension) {

    var result = null

    this.layer.siblings.forEach(function (sibling) {
        if (sibling.convention.extension == extension) {
            result = sibling;
        }
    });

    return result
};

//TODO add content injection and placeholder naming

Plugin.prototype.use = function(query) {

    var layer = this.getLayerByExtension(query);
    if (layer) {
        this.integration.html = layer.getHTML(true);
    }
};

module.exports = Plugin