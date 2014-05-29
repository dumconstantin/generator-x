var fs = require('fs'), path = require('path');
/**
 * Parse name convention
 *
 * e.g. layer name.slider(param1,param2).animation(...)...
 * @param str
 * @constructor
 */
ConventionParser = function(str) {

    var arg = str.split(".").map(function (arg) {
        var arg = arg.split("(").map(function (str) {
            var arg = str.split(",").map(function (str) {
                return str.replace(')','');
            });
            return arg;
        });
        return [arg[0][0],arg[1]];
    });

    this.name = str.indexOf('.') == -1 ? str : arg[0][0];
    this.functions = [];

    for (var i=1; i<arg.length; i++)
        this.functions.push(arg[i]);

    var firstFunction = this.functions[0] ? this.functions[0][0] : null;
    this.plugin = null;

    var filePath = path.resolve(__dirname, '../plugins/'+firstFunction+'.js');
    if (fs.existsSync(filePath))
        this.plugin = {name:firstFunction,path:filePath}

};

module.exports = ConventionParser
