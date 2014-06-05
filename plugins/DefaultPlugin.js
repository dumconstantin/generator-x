function DefaultPlugin(layer) {
    this.layer = layer;
    var _this = this;

    this.elements = {};
    this.integration = {
        html: '',
        elements: {},
        plugins: {},
        contents: {}
    }
}

DefaultPlugin.prototype.getIntegration = function() {

    var _this = this;

    var integration = this.layer.getIntegration(this);

    this.integration.html = integration.html;
    this.integration.elements = integration.elements;

    this.integration.contents.merge(integration.contents);

    Object.keys(integration.plugins).forEach(function(pluginName){

        var layer = integration.plugins[pluginName];

        eval('var '+layer.convention.plugin.name+' = require("'+layer.convention.plugin.path+'");');
        eval('layer.plugin = new '+layer.convention.plugin.name+'(layer);');

        _this.integration.plugins[pluginName] = layer.plugin.getIntegration();

    });

    return this.integration;

};

module.exports = DefaultPlugin;