(function () {
    "use strict";

    var _generator = null,
        MENU_ID = "core-version-test",
        fs = require('fs');

    function init(generator) {
        _generator = generator;

        var menuText = "Error: version property not present";

        if (_generator.version) {
            menuText = "Generator Core version: " + _generator.version;
        }

        _generator.addMenuItem(
            MENU_ID,
            menuText,
            true, // enabled
            false // not checked
        );

        _generator.getDocumentInfo().then(
            function (document) {
                console.log("Received complete document:");
                handle(document);
            },
            function (err) {
                console.error("[Tutorial] Error in getDocumentInfo:", err);
            }
        ).done();    
    }

    function stringify(object) {
        try {
            return JSON.stringify(object, null, "    ");
        } catch (e) {
            console.error(e);
        }
        return String(object);
    }

    function handle(document) {

        fs.writeFile("test/plugins/generatorx/sample.json", stringify(document), function (err) {
            if(err) {
                console.log(err);
            } else {
                console.log("The file was saved!");
            }
        });
    }

    exports.init = init;

}());