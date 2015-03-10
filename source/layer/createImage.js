'use strict'



  
function createImage(layer) {
  var imageName = require('node-uuid').v1()

  require('generator-core')(function (generator) {
    generator.getPixmap(layer.documentId, imageName, {}).then(
            function(pixmap){

                _this.saveImage(pixmap);

            },
            function(err){
                console.error("Pixmap error:", err);
            }
        ).done();  
  })
    
  return imageName + '.png'
}

module.exports = createImage


/*
Structure.prototype.nextImage = function () {
    var _this = this,
        imageData;

    if (true === this.generatingImage) {
        console.log('Image is currently generating. The image generation is '
            + ' recursive and the next image will beging generating once '
            + ' the current one finishes.');

        return;
    }

    if (0 === this.imagesQueue.length) {

        console.log('All images have been generated.');
        this.events.emit('imagesFinished');

    } else {

        this.generatingImage = true;

        // FIFO
        this.currentGeneratedImage = this.imagesQueue.shift();

        this.generator.getPixmap(this.document.id, this.currentGeneratedImage.id, {}).then(
            function(pixmap){

                _this.saveImage(pixmap);

            },
            function(err){
                console.error("Pixmap error:", err);
            }
        ).done();
    }

    return this;
};

/**
 * Save the image using the pixmap received from Photoshop.
 * Will require a ARGB to RGBA bits conversion.
 *
 * @param  {object} pixmap The bitmap representaton from Photoshop.
 * @return {Structure}  The Structure instance for chaining.

Structure.prototype.saveImage = function(pixmap) {
    var _this = this,
        pixel,
        location,
        pixels = pixmap.pixels,
        png = new PNG({
            width: pixmap.width,
            height: pixmap.height
        }),
        stream = fs.createWriteStream(this.currentGeneratedImage.filePath);

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

        _this.finishedImage();
    });

    // Encode the pixmap to the PNG format and stream it to the file.
    png.pack().pipe(stream);

    return this;
};

*/
