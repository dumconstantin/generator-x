'use strict'
var layer = require('./layer.js')
    , generator = require('./generator.js')
    , PNG = require('pngjs').PNG
    , when = require('when')
    , R = require('ramda')
    , project = require('./project.js')
    , save = require('./save.js')

var streamPixmap = R.curry(function streamPixmapFunc(stream, pixmap) {
    var png = new PNG({
            width: pixmap.width
            , height: pixmap.height
        })
        , location
        , pixel
        , pixels = pixmap.pixels
        , promise = when.promise(function(resolve, reject) {
            stream.on('close', function() {
                resolve(pixmap)
            })
        })


    // Convert from ARGB to RGBA, we do this every 4 pixel values (channelCount)
    for (location = 0; location < pixels.length; location += pixmap.channelCount) {
        pixel = pixels[location];
        pixels[location] = pixels[location + 1];
        pixels[location + 1] = pixels[location + 2];
        pixels[location + 2] = pixels[location + 3];
        pixels[location + 3] = pixel;
    }

    png.data = pixels;

    png.on('error', function(error) {
        throw error
    });

    png.pack().pipe(stream)
    return promise
})

var buildP = R.curry(function buildFunc(document, layer) {
    return when.promise(function(resolve, reject, notify) {
        var filePath = project.file(document, 'images', layer.psdId + '.png')

        generator.pixmapP(document, layer)
            .then(streamPixmap(save.stream(filePath)))
            .then(function(pixmap) {
                resolve({
                    file: filePath
                    , documentId: document.id
                    , layerId: layer.id
                    , width: pixmap.width
                    , height: pixmap.height
                    , bounds: pixmap.bounds
                })
            })
    })
})

function optimiseImage(image) {
    // TODO: Inmplement PNG Crush compression
    // TODO: Implement PNG Quant compression
    // TODO: Implement Opti PNG compression 
}

function needsImage(layer) {
    return true
}

function allP(document) {
    return layer.flatten(layer.all(document)).filter(needsImage).map(buildP(document))
}

module.exports = {
    allP: allP
    , buildP: buildP
}