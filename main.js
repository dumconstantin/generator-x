'use strict'
require('./globals.js')

// Starts the system using the exported document from Generator Core
function start(document) {
    var source = project.file(document, 'source')
        , imageLayers

    save.json(source('document.json'), document)
    save.json(source('layers.json'), layer.all(document))

    image
        .all(document, U.flattenBy('children', layer.all(document)).filter(image.needsImage))
        .done(save.json(source('images.json')))
}

generator.documentP().done(start)