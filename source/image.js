'use strict'

var savePixmap = R.curry(function streamPixmapFunc(stream, pixmap) {
    var pixmapData = {
            width: pixmap.width,
            height: pixmap.height
        },
        png = new PNG(pixmapData),
        location, pixel, pixels = pixmap.pixels,
        promise = when.promise(function(resolve, reject) {
            stream.on('close', function() {
                resolve(pixmapData)
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

var imageData = R.curry(function imageDataFunc(document, layer, pixmapData) {
    return {
        filePath: project.file(document, 'images', layer.psdId + '.png'),
        documentId: document.id,
        layerId: layer.id,
        pixmap: pixmapData
    }
})

var saveImage = R.curry(function buildFunc(document, layer) {
    var filePath = project.file(document, 'images', layer.psdId + '.png')
    return generator
        .pixmapP(document, layer)
        .then(savePixmap(save.stream(filePath)))
})

function optimiseImage(image) {
    // TODO: Inmplement PNG Crush compression
    // TODO: Implement PNG Quant compression
    // TODO: Implement Opti PNG compression 
}

function needsImage(layer) {
    return true
}

function all(document, layers) {
    var imageDataCalled = R.map(imageData(document), layers.map(R.nthArg(0)))
    return when
        .all(layers.map(saveImage(document)))
        .then(U.listCall(imageDataCalled))
}

module.exports = {
    all: all,
    needsImage: needsImage
}