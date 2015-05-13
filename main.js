'use strict'
require('./globals.js')

// Starts the system using the exported document from Generator Core
function start(document) {
    var source = project.file(document, 'source')
        , imageLayers 

    save.json(source('document.json'), document)
    save.json(source('layers.json'), layer.all(document))

    image
        .all(document, layer.flatten(document).filter(image.needsImage))
        .done(function () { console.log(arguments) })
}

generator.documentP().done(start)
