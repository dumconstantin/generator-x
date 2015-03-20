'use strict'
var fs = require('fs')
	, path = require('path')
	, mkdirSync = require('node-fs').mkdirSync
    , PNG = require('pngjs').PNG
    , when = require('when')
    , R = require('ramda')

function writeFile(filePath, data) {
	fs.writeFileSync(mkdir(filePath), data)
    return filePath
}

function mkdir(filePath) {
    mkdirSync(path.dirname(filePath), '0777', true)
    return filePath
}

function saveJSON(filePath, data) {
	writeFile(filePath, JSON.stringify(data, null, 4))
}

var saveTempImageP = R.curry(function saveTempImagePFunc(filePath, pixmap) { 
    var d = when.defer()
        , png = new PNG({ 
            width: pixmap.width
            , height: pixmap.height
        })
        , location
        , pixel
        , pixels = pixmap.pixels
        , stream = fs.createWriteStream(mkdir(filePath))


    // @TODO: The pixamp contains the end image width/height. Currently,
    // after generation, all images are parsed to read to real width and height.
    // Ideally we should save these in a JSON for future references to avoid IO.

    // @TODO: The ARGB to RGBA is processor intensive and blocking. This will require
    // a worker to handle pixmap saving.

    // Convert from ARGB to RGBA, we do this every 4 pixel values (channelCount)
    for(location = 0; location < pixels.length; location += pixmap.channelCount) {
        pixel = pixels[location];
        pixels[location]   = pixels[location + 1];
        pixels[location + 1] = pixels[location + 2];
        pixels[location + 2] = pixels[location + 3];
        pixels[location + 3] = pixel;
    }
    
        console.log('made')
    png.data = pixels;

    png.on('error', function (error) {
        console.log(error);
        console.log('There as an error');
    });

    png.on('parsed', function (obj) {
        // PNG pack has finished packing.
        // Waiting for the PNG pipe to finish.
    });

    png.on('end', function () {
        // PNG pipe has finished sending data.
        // Waiting for the Write Stream to finish.
    });

    stream.on('finish', function(){
        // The stream has finished pipe-ing the bits.
        // Waiting for the stream to close.
    });

    stream.on('close', function(){
        // The stream has savfely closed.
        // Everything is finished.

        // TODO: Inmplement PNG Crush compression
        // TODO: Implement PNG Quant compression
        // TODO: Implement Opti PNG compression 
        d.resolve(filePath)
    });
    
    png.pack().pipe(stream);

    // Encode the pixmap to the PNG format and stream it to the file.
    return d.promise
})

module.exports.json = saveJSON 

module.exports.font = function () {}
module.exports.tempImageP = saveTempImageP
