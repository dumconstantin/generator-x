(function () {
    "use strict"

    function start(document) {
        var project = require("./source/project.js")

        document.freeze();

        project.create(document)
        project.build(document)
        
    }

    function error(error) {
        console.error(err)
    }

    exports.init = function init(generator) {
        generator
            .getDocumentInfo()
            .then(start, error)
            .done()
    }

}())