var
    fs = require('fs'),
    path = require('path'),
    PNG = require('pngjs').PNG,
    events = new require('events'),
    sizeOf = require('image-size'),
    Layer = require('./Layer.js'),
    DefaultPlugin = require('./../plugins/DefaultPlugin.js'),
    Relative = require('./Relative.js');

/**
 * The Structure object will parse the PSD file and generate Layer objects.
 * It is responsible for managing the following processes:
 * - Parsing the PSD file and creating Layers
 * - Linking Layers between them
 * - Generate images for bitmap layers
 * - Refreshing Layer boundries based on hierachy
 * - Generating the CSS and HTML code.
 *
 * @constructor
 * @param {object} config Configuration object that holds:
 *                        - PSD JSON document
 *                        - Generator reference
 *                        - folder paths (images, fonts, etc)
 *                        - file paths for generated content
 * @return {Structure}  The Structure instance for chaining.
 */
function Structure(config) {
    var _this = this;

    Object.keys(config).forEach(function (configKey) {
        _this[configKey] = config[configKey];
    });

    this.html = '';
    this.css = '';
    this.sections = {};
    this.fonts = [];

    this.fontsToTransfer = [];

    /**
     * Integration json structure html/css/js and functionality placeholders
     * @type {object}
     */
    this.integration = {};

    this.psdPath = this.document.file;
    this.psdName = this.psdPath.substr(this.psdPath.lastIndexOf('/') + 1, this.psdPath.length);

    // Store IDs to ensure there is no collision between styles.
    this.cssIds = [];
    this.cssClasses = {};

    // Image generation properties.
    this.imagesQueue = [];
    this.generatingImage = false;
    this.currentGeneratedImage = {};

    // Fonts need to be copied to the project directory
    this.queuedFontsForCopy = [];

    this.uiComponents = {};

    // In Photoshop layers adjust their behaviours by using global settings
    // that can be overwritten by local settings.
    this.globalStyles = {
        globalLight: {
            angle: this.document._get('globalLight.angle', 118),
            altitude: 0
        }
    };

    // This is the top most parent of the document.
    this.parent = new Layer(this, {
        name: 'global',
        cssId: 'global',
        type: 'layerSection',
        bounds: this.document.bounds
    }, false);


    this.header = '<!DOCTYPE html>' +
        '<head>' +
        '<meta charset="utf-8" />' +
        '<link rel="stylesheet" href="' + this.folders.styles + this.files.cssFileName + '">' +
        '</head>' +
        '<body>';

    this.footer = '</body></html>';

    // Instantiate an internal event system.
    this.events = new events.EventEmitter();

    // Events that will eventually trigger the finished structure event.
    this.queuedActions = {};

    ['fontsCopyFinished', 'imagesFinished'].forEach(function (eventName) {
        _this.queuedActions[eventName] = false;
        _this.events.on(eventName, function () {
            var finishedQueues = 0;

            _this.queuedActions[eventName] = true;

            Object.keys(_this.queuedActions).forEach(function (queueName) {
                if (true === _this.queuedActions[queueName]) {
                    finishedQueues += 1;
                }
            });

            if (finishedQueues === Object.keys(_this.queuedActions).length) {
                _this.events.emit('structureFinished');
            }

        });
    });



    return this;
}

/**
 * Generate Layer objects based on the layers received from Photoshop
 * @param  {array} storage An array of Layers that belongs to the parent layer.
 *                         Initially. The first level of layers sit in the Structure
 *                         Global parent. This method will be called from within a layer
 *                         if that layer has siblings.
 * @param  {array} layers  The sibling Layers that need to be created.
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.createLayers = function (storage, layers) {
    var _this = this,
        enteredClippingMask = false;

    layers.forEach(function (layer, index) {
        var clippingMask = false;

        // Ignore masks for now!
        // TODO: Do not ignore masks.
        if (true !== layer._get('mask.removed', false)) {
            if (true === layer._get('mask.extendWithWhite', false)) {
                // Continue, this is partialy supported.
            } else {
                return;
            }
        }

        // Ignore invisible layers for not.
        // TODO: Add a name detection for invisible layers as "hover", "tab", etc
        if (false === layer.visible) {
            return;
        }

        if (true === layer.clipped) {
            enteredClippingMask = true;
            return;
        }

        // This layer is not a clipping mask but the layers before it were.
        // Export this as an image.
        if (true === enteredClippingMask) {
            clippingMask = true;
            enteredClippingMask = false;
        }

        // If the layer does not have a width then it is as if
        // it does not exist and will not be added as an empty
        // layer.
        if ((0 === (layer.bounds.right - layer.bounds.left)) || 
            (0 === (layer.bounds.bottom - layer.bounds.top))
        ) {

            console.log(layer.name);
            return;
        }

        storage.push(new Layer(_this, layer, clippingMask));
    });

    return this;
};

/**
 * Generate CSS IDs for each layer.
 * This is done post Layer creation due to the fact that currently,
 * to be able to create an unique ID, we use the full parent stack which
 * we get after all Layers have been created and then Linked.
 *
 * Example CSS ID: parent1CSSID-parent2CSSID-parent3CSSID-layer.name
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.generateCssIds = function () {
    var _this = this;

    // Recursive function.
    function generateCssIds(layers) {

        layers.forEach(function (layer, index) {
            layer.cssId = layer.parent.cssId + '-'
                + layer.name
                .replace(/&/g, '')
                .replace(/^\//g, 'a')
                .replace(/^[0-9]/g, 'a')
                .replace(/\s/g, '-')
                .replace(/[@\':\.\/,+\[\]]/g, '')
                .replace(/[^A-Za-z 0-9 \.,\?""!@#\$%\^&\*\(\)-_=\+;:<>\/\\\|\}\{\[\]`~]*/g, '');

            if (-1 === _this.cssIds.indexOf(layer.cssId)) {
                // The ID is unique and can be used.
            } else {
                // The index is unique per PSD file an such provides a
                // simple way to ensure the layer is unique.
                layer.cssId += index;
            }

            // Keep cssIds to ensure that the next generated id is unique.
            _this.cssIds.push(layer.cssId);

            generateCssIds(layer.siblings);
        });
    }

    generateCssIds(this.parent.siblings);

    return this;
};

/**
 * Create linkages between layers to be able to reach a parent
 * from within a layer or navigate through next/prev layers that sit
 * on the same level.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.linkLayers = function () {

    function linkLayers(layers, parent) {

        layers.forEach(function (layer, index) {

            layer.parent = parent;

            if (undefined === layer.initialParent) {
                layer.initialParent = parent;
            }

            if (0 < index) {
                layer.prev = layers[index - 1];
            } else {
                layer.prev = undefined;
            }

            if (layers.length > index + 1) {
                layer.next = layers[index + 1];
            } else {
                layer.next = undefined;
            }

            linkLayers(layer.siblings, layer);
        });
    }

    linkLayers(this.parent.siblings, this.parent);

    return this;
};

/**
 * Generate the output ready full HTML and CSS code by
 * requesting it from each Layer.
 *
 * @return {object} An object that stores the generated HTML and CSS.
 */
Structure.prototype.refreshCode = function () {
    var _this = this;

//    25 septembrie toata suma si apoi urmatoarea suma

    this.html = '';
    this.css = fs.readFileSync(path.resolve(__dirname, 'reset.css'), 'utf8');

    // TODO: Add the case when the parent will receive 
    // properties e.g. the body element.

    /*
    this.parent.siblings.forEach(function (layer) {
        layer.generateCSS();
    }); */

    this.optimisePositioning();

    this.parent.siblings.forEach(function (layer) {
        layer.generateCSS();
    });

    this.optimiseCode();

    this.parent.siblings.forEach(function (layer) {
        _this.html += layer.generateHTML().getHTML();
        _this.css += layer.getCSS();
    });

    Object.keys(this.cssClasses).forEach(function (cssClassName) {
        _this.css += '\n.' + cssClassName + ' {';

        Object.keys(_this.cssClasses[cssClassName]).forEach(function (cssProperty) {
            _this.css += '\n\t' + cssProperty + ': ' + _this.cssClasses[cssClassName][cssProperty] + ';';
        });

        _this.css += '\n}';
    });


    this.html = this.header + this.html + this.footer;

    return this;
};


Structure.prototype.parseUiConventions = function () {

    function parseUiConventions(siblings) {
        siblings.forEach(function (sibling) {


            if (true === /\.centered/.test(sibling.name)) {

                sibling.dimensions.left = sibling.css.left;
                sibling.dimensions.right = sibling.css.right;
                sibling.dimensions.marginLeft = sibling.css.marginLeft;
                sibling.dimensions.marginRight = sibling.css.marginRight;

                sibling.css.position = 'relative';
                sibling.css.marginLeft = 'auto';
                sibling.css.marginRight = 'auto';
                sibling.css.left = 'auto';
                sibling.css.right = 'auto';
            }


            if (0 < sibling.siblings) {
                parseUiConventions(sibling.siblings);
            }
        });
    }


    parseUiConventions(this.parent.siblings);

    return this;
};


/**
 * Recursive generate integration json for each root layer and children's
 * @returns {Structure}
 */
Structure.prototype.getIntegration = function() {
    var _this = this;

    var root = new DefaultPlugin(this.parent);
    var integration = root.getIntegration();

    fs.writeFileSync(
        this.files.integration,
        JSON.stringify(integration,null,"  ")
    );

    console.log('Saved integration to "' + this.files.integration + '"');

    return this;
}

/**
 * Write the HTML and CSS code to files.
 * Needs Structure.refreshCode called before to output the
 * PSD HTML and CSS version.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.outputCode = function () {
    var _this = this;

    this.copyFonts();

    fs.writeFileSync(this.files.html, this.html);
    fs.writeFileSync(this.files.css, this.css);

    console.log(this.files.html + ' was created.');
    console.log(this.files.css + ' was created');

    return this;
};

Structure.prototype.copyFonts = function () {
    var _this = this,
        fontExtensions = ['eot', 'woff', 'ttf', 'svg'];

    this.fonts.forEach(function (fontName) {
        var scheduledFontFiles = [];

        function copiedFontFile(fontFile) {
            scheduledFontFiles.splice(scheduledFontFiles.indexOf(fontFile), 1);
            
            if (0 === scheduledFontFiles.length) {
                _this.finishedFont(fontName);
            }
        }

        fontExtensions.forEach(function (extension) {
            var fontFile = fonts[fontName] + '.' + extension;

            if (true === fs.existsSync(_this.folders.fontSource + '/' + fontFile)) {
                scheduledFontFiles.push(fontFile);
            }
        });

        if (0 !== scheduledFontFiles.length) {
            _this.queuedFontsForCopy.push(fontName);
            _this.css += getCssFontFace(fontName);
        }

        scheduledFontFiles.forEach(function (fontFile) {
            var stream = fs.createWriteStream(_this.folders.fonts + fontFile);

            stream.on('close', function(){
                copiedFontFile(fontFile);
            });

            fs.createReadStream(_this.folders.fontSource + '/' + fontFile).pipe(stream);
        });

    });

    if (0 === this.fontsToTransfer.length) {
        // Move the font files
        this.events.emit('fontsCopyFinished');
    }

};

Structure.prototype.finishedFont = function (fontName) {
    var fontIndex = this.queuedFontsForCopy.indexOf(fontName);

    console.log('Copied ' + fontName + ' files.');
    if (-1 !== fontIndex) {
        this.queuedFontsForCopy.splice(fontIndex, 1);

        if (0 === this.queuedFontsForCopy.length) {
            this.events.emit('fontsCopyFinished');
        }

    } else {
        console.log('The font name was not found in the fonts transfer.');
    }
};

Structure.prototype.outputToWordpress = function () {
    var _this = this;

    this.wordpress = new Wordpress({
        folders: this.folders,
        layers: this.parent.siblings
    });

    this.wordpress
        .resetWordpress()
        .parseLayers()
        .create('menus')
        .create('pages')
        .create('banners')
        .create('contents')
        .create('sidebars')
        .create('footers')
        .output();
    // .register('header');

    /*
     var exec = require("child_process").exec;
     exec('php ' + _this.folders.wordpress + 'addMenu.php', function (error, stdout, stderr) {
     var response = JSON.parse(stdout);
     if (undefined !== response.term_id) {

     } else {
     console.log('Menu was not added');
     }
     });*/



    /*
     console.log('Saving section to ' + _this.folders.wordpress + section.name + '.html');
     section.html += '<link href="' + section.name + '.css" rel="stylesheet" />';
     fs.writeFileSync(_this.folders.wordpress + section.name + '.html', section.html);
     fs.writeFileSync(_this.folders.wordpress + section.name + '.css', section.css); */
};

/**
 * Save the received document and the generated structure in JSON
 * files to support the debugging process.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.saveStructureToJSON = function () {

    fs.writeFileSync(this.files.document, stringify(this.document));

    // Generate the structure without the circular objects.
    fs.writeFileSync(
        this.files.structure,
        stringify(this, ['parent', 'prev', 'next', 'document', 'generator', 'structure'])
    );

    console.log('Saved raw document to "' + this.files.document + '"');
    console.log('Saved parsed structure to "' + this.files.structure + '"');

    return this;
};

/**
 * Queue bitmap layers that need to be created into images.
 * The process begings by calling:
 * @see  startImageGeneration
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.queueImagesForGeneration = function () {
    var _this = this;

    // Recursive function.
    function queueImages(layers) {

        layers.forEach(function (layer) {

            if ('img' === layer.tag) {

                // @TODO: Add a layer hashsum at the end of the layer to ensure that
                // if the layer has changed then the image should be regenerated as well.

                layer.fileName = _this.psdName.replace(/\./g, '_') + '_' + layer.parent.cssId + '_' + layer.cssId + '.png';
                layer.filePath = _this.folders.images + layer.fileName;
                layer.fileSrc = _this.folders.src + layer.fileName;

                if (true === fs.existsSync(layer.filePath)) {

                    // The image already exists. No need to regenerate it.

                } else {

                    _this.imagesQueue.push({
                        id: layer.id,
                        filePath: layer.filePath,
                        layer: layer
                    });

                }
            }

            if (0 !== layer.siblings.length) {
                queueImages(layer.siblings);
            } else {
                // There are no further siblings must be checked for images.
            }

        });

    }

    queueImages(this.parent.siblings);

    return this;
};

/**
 * Start generating images based on the image queue.
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.startImageGeneration = function () {

    this.nextImage();

    return this;
};

/**
 * Trigger the next image for generation.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
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
 */
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
        _this.finishedImage();
    });

    // Encode the pixmap to the PNG format and stream it to the file.
    png.pack().pipe(stream);

    return this;
};


/**
 * The currentGeneratedImage has finished generating.
 *
 * The following process happened:
 * - A layer with layer.type = 'img' has been added to a queue
 * - When the layer was triggered for generation, Photoshop was requested to
 *     transfer its pixmap
 * - The pixmap was converted to RGBA from ARGB
 * - The converted pixmap was encoded into a PNG format
 * - The encoded version was streamed into a file
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.finishedImage = function () {

    console.log('Generated: ' + this.currentGeneratedImage.filePath);

    this.generatingImage = false;

    this.nextImage();

    return this;
};


/**
 * Adjust the top, left, bottom, right width, height values
 * for bitmap Layers after the Images have been generated. This will ensure
 * correlated values to the real image that takes into consideration
 * the FX boundries from the Photoshop image generation.
 *
 * Important point:
 * FX layers do not necessary have an even spread of effects on both sides of the
 * initial image/shape. This means that the left side effect might have a smaller
 * width than the right side effect. When Photoshop gives the boundsWithFX it gives
 * an estimation of what those widths might be. When exporting the image we sometimes
 * get difference values than the boundsWithFX and also, we don't know were exactly
 * in the generated image is the initial image/shape without the FX.
 * This leads to a difficult problem of finding the exact FX widths of the exported
 * image.
 *
 * There are 3 options:
 * 1) Augment the Photoshop file export through the Generator to give the real
 * widths of the FX once they have been transformed to bitmap and the image
 * was cropped.
 * 2) Create a image recognition system that will take the image/shape version
 * without the FX and the image/shape version with FX and try to find the initial
 * boundries within the FX version.
 * 3) Calculate a procentage of the estimated differences and apply it to the
 * exported image width E.g. If boundsWithFX give a 200px width and 20px left FX
 * then on an exported 190px width we can assume the left FX will be
 * 20 * 100 / 200 = 10%. We apply 10% on 190px and we get an estimated left FX
 * of 18px. This will work most of the time but might have some misses from
 * time to time.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.refreshImageBoundries = function () {

    // Recursive function.
    function refreshImageBoundries(layers) {

        layers.forEach(function (layer) {
            var realImageSize,
                minusLeft = 0,
                minusTop = 0;

            if ('img' === layer.tag) {
                try {
                    realImageSize = sizeOf(layer.filePath);
                } catch (error) {
                    console.log('Dimensions could not be read on ' + layer.filePath);
                }

                if (undefined !== realImageSize) {

                    if (undefined !== layer.boundsWithFX) {

                        // The bellow is an implementation of option 3).
                        (function () {
                            var topFXDifference = layer.css.top - layer.boundsWithFX.top,
                                leftFXDifference = layer.css.left - layer.boundsWithFX.left,
                                widthFXDifference = (layer.boundsWithFX.right - layer.boundsWithFX.left) - layer.css.width,
                                heightFXDifference = (layer.boundsWithFX.bottom - layer.boundsWithFX.top) - layer.css.height,
                                leftProcent = leftFXDifference / widthFXDifference,
                                topProcent = topFXDifference / heightFXDifference,
                                noImageFX_RealImageWidthDifference = realImageSize.width - layer.css.width,
                                noImageFX_RealImageHeightDifference = realImageSize.height - layer.css.height;

                            minusLeft = noImageFX_RealImageWidthDifference * leftProcent;
                            minusTop = noImageFX_RealImageHeightDifference * topProcent;

                            // NaN tests
                            if (minusLeft !== minusLeft) {
                                minusLeft = 0;
                            }
                            if (minusTop !== minusTop) {
                                minusTop = 0;
                            }

                            // It seems that Photoshop is usually down a pixel or so.
                            if (0 !== minusLeft) {
                                minusLeft = Math.ceil(minusLeft - 1);
                            }
                            if (0 !== minusTop) {
                                minusTop = Math.ceil(minusTop - 1);
                            }

                        }());
                    } else {
                        //console.log('The ' + layer.name + ' image does not have the property bounds with FX.');
                    }

                    layer.css.left -= minusLeft / 2;
                    layer.css.top -= minusTop / 2;

                    layer.css.width = realImageSize.width;
                    layer.css.height = realImageSize.height;

                    layer.css.right = layer.css.left + layer.css.width;
                    layer.css.bottom = layer.css.top + layer.css.height;

                } else {
                   // console.log ('The ' + layer.name + ' image does not have the realImageSize read properly.');
                }
            } else {
                // The layer is not an image and does not require adjustments.
            }

            refreshImageBoundries(layer.siblings);
        });

    }

    refreshImageBoundries(this.parent.siblings);

    return this;
};

/**
 * After all (sibling) layers have real boundries, parent containers can
 * refresh their own boundries.
 *
 * The recalculation is done bottom up to ensure that changes from the lowest
 * hierarchical container influence the top most container.
 *
 * Each container searches for the lowest top, left and the highest right, bottom
 * among all sibling values. Once the extreme are found, these become the boundries
 * for the container.
 *
 * The calculated boundries do not take into consideration FX as these will be
 * CSS styles that will not influence the positioning of elements.
 *
 * @return {Structure}  The Structure instance for chaining.
 */
Structure.prototype.refreshParentBoundries = function () {


    // Recursive function.
    function refreshParentBoundries(section) {
        var topMost,
            bottomMost,
            leftMost,
            rightMost;

        section.siblings.forEach(function (sibling, index) {

            if ('layerSection' === sibling.type && 0 !== sibling.siblings.length) {
                refreshParentBoundries(sibling);
            }

            if (0 === index) {

                topMost = sibling.css.top;
                bottomMost = sibling.css.bottom;
                leftMost = sibling.css.left;
                rightMost = sibling.css.right;

            } else {

                if (topMost > sibling.css.top) {
                    topMost = sibling.css.top
                }

                if (leftMost > sibling.css.left) {
                    leftMost = sibling.css.left;
                }

                if (bottomMost < sibling.css.bottom) {
                    bottomMost = sibling.css.bottom
                }

                if (rightMost < sibling.css.right) {
                    rightMost = sibling.css.right;
                }

            }
        });

        section.css.top = undefined !== topMost ? topMost : section.css.top;
        section.css.left = undefined !== leftMost ? leftMost : section.css.left;
        section.css.bottom = undefined !== bottomMost ? bottomMost : section.css.bottom;
        section.css.right = undefined !== rightMost ? rightMost : section.css.right;

        section.css.width = section.css.right - section.css.left;
        section.css.height = section.css.bottom - section.css.top;         
    }

    this.parent.siblings.forEach(function (layer) {

        if ('layerSection' === layer.type && 0 !== layer.siblings.length) {
            refreshParentBoundries(layer);
        }

    });

    return this;
};

/**
 * Register an UI component.
 * Should also set listeners.
 * @param  {[type]} uiComponent [description]
 * @return {[type]}             [description]
 */
Structure.prototype.registerUiComponent = function (uiComponent) {
    this.uiComponents[uiComponent.name] = {
        instances: [],
        query: uiComponent.name.toLowerCase(),
        obj: uiComponent
    };
};

Structure.prototype.generateLogicStructure = function () {
    var _this = this;

    Object.keys(this.uiComponents).forEach(function (uiComponentName) {
        var component = _this.uiComponents[uiComponentName];

        _this.parent.find(component.query).forEach(function (layer) {
            component.instances.push(new component.obj(layer));
        });
    });

    // THERE IS NO NEED FOR UI COMPONENTS Augmentation!
    // The structure of the components will be given by the
    // Photoshop conventions.

    // Once an UI component has actioned on a layer it should create a template
    // element for the inner component that will be used dynamically in the CMS
    // integration. If the output is plain then the generate UIComponent will be used
    // if it is dynamic then the CMS integration will remove all boilerplate and
    // use the templates instead.

    /*
     var logic = {
     header: {},
     content: {},
     footer: {},
     slider: {
     slide: {
     title: {

     },
     caption: {

     },

     },
     bullets: {
     bullet: {
     selected: {},

     }
     }

     }
     }
     }; */

    // - slide
    // - bullets
    // - thumbnails
    // - image
    // - caption
    // - title
    // - selected state
    // - arrows
    // - tabs
    // -- each component can have a selected state
    // -- for when the slide will be visible

    // Convention
    // All generator logic is delimited through a left full stop.
    // The string to the right of the full stop will be the instruction
    // Example:
    // fooBar.order[asc] -> the article string is not considered, only id[10] is
    // .article.id[10] - the article is considered and also the id
    //
    // The modifiers are separated through square brackets []
    //

    // Logic components
    // ----------------
    //
    // semantic template components
    // - header
    // - sidebar
    // - footer
    //
    // article
    // - title
    // - banner image
    // - date
    // - content
    // - comments
    // - comment form
    // - custom elements
    // - summary (can either be a .content[100 characters])
    // - related posts (also with modifiers to define how relation is made)
    //
    // forms - login, comment, search, contact
    // - select
    // - input
    // - date/calendar
    // - checkbox / radio
    // - textarea
    // - error elements
    //
    // video
    // - central play button
    // - video element
    // - video element controls (pause, play, etc)
    //
    // social
    // - social links
    // - share button
    //
    // menu
    // - links/pages
    // - titles
    // - category items (to get all the pages from a category)
    //
    // links
    // - page link
    // - href link
    // - action link / back | forward | cancel
    //
    //
    // dynamic actions
    // -- Trigger an event/action that can be captured by javascript
    // -- Expose an API for programmers to use. The JS API will be exposed
    // -- and will trigger defined interactions from within Photoshop
    // -- that should have a custom logic attached.
    // -- Sliders, tabs, drop down elements should work using this system
    // -- where they subscribe to certain events
    //
    //
    // breadcrumbs
    // - breadcrumb link
    // - breadcrumb title
    //
    // category
    // - title
    // - parent
    //
    // settings/custom fields - phone number, email, address, etc
    // newsletter
    // banners (slider, carousel)
    //
    // google map
    // - gps coordinates
    //
    // - title

    // By having the slider logic defined from Photoshop the HTML construction
    // of the slider can happen on the backend insdead of having a Slider configuring
    // on the fly. This is one of the most complex parts from a JS slider code to dynamically
    // create new elements, reorder old elements and then use the dynamic elements created.
    // By generating everything on the backend we keep the code boilerplate for all
    // interactions to the minimum - precompilation of interaction code.

    //

    // Modifiers for logic components
    // ---------
    // order - string / asc | desc
    // orderBy - string / title | date
    // limit - integer / 10 | 1
    // id - integer / 10 | 2315
    // hidden -
    //
    // example:
    // container[articles].order[asc].orderBy[title]
    // Are containers implicit? The parent group of a type of entities?
    // will be a container for the first type of encountered entity.
    // If a group contains an article, then that group will hold articles.
    // The linkage is implicit.
    // Also, if a container group has modifiers that suggest the fact that
    // there will be dynamically added entities then the entity group inside
    // becomes a template for other entities.
    // OR
    // Any entity defined in Photoshop is a template that is populated by a list
    // of entities extracted from the CMS. If there is only one entity that will
    // occupy that area then the list will contain only one element.

    // Create a definition list the any developer can add their custom
    // keywords and the behaviour for that custom keyword.

    // Define what will be a template for what container similar to how
    // Fireworks templating system was used.


    // UI Components
    // ---------
    // hover
    // - normal state
    // - hover state
    // - click state
    //
    // slider
    // - slide
    // - bullets
    // - thumbnails
    // - image
    // - caption
    // - title
    // - selected state
    // - arrows
    // - tabs
    // -- each component can have a selected state
    // -- for when the slide will be visible
    //
    // dropDown
    // - drop down element
    // - action element
    //
    // tabs
    // - tab
    // - tab content
    // - selected state
    //
    // scroll bar
    // - scroll handle
    // - scroll container
    // - scroll linked to another container
    //
    // background - the layer will be used as a backround for the group/parent
    // image - the layer is an image that belongs to an entity

    // UI Modifiers
    // ------------
    // Modifiers should sit at the top level where the action is made on
    // the sibling of a group. Ex. for a hover effect the modifiers should be on the
    // group that contains both the hover state and the normal state
    // ----
    // effect - string / fade | slide
    // duration - integer / 100 (ms)
    // property - string / the CSS property
    // properties - string separated by comma / the CSS properties
    //

    // The difference between the hover and the normal state is calculated as a
    // difference of all the CSS properties both inherited and defined. The animations
    // will be added by default on all the differences. Custom animations will

    // Modifiers for UI components

    // Permission based through hierarchies e.g. top group named [users:admin]
    //

    // Linkages can be created thourgh using group hierarchies. Groups
    // do not necessarily have an impact on the design itself and thus
    // can be added to increase the logical relations.

    // UI components will be separate from plugins so that a Wordpress Integration
    // will use the UI component for Sliders, etc.
    //
    // There should be an API for replacing the HTML to a new HTML while ensuring
    // the semantic structure is kept.
    // UI components should be applied before the Integration with other frameworks.
    // The UI components should be detected and applied automatically. All transformations
    // should keep the initial logic structure that will be used by the Integration.

    // Incremental construction of logic VS Parsing all PSD files to generate a
    // single logic structure onto which the Integration is then performed.
    //
    // Incremental construction seems superior because it allows the site/application
    // to be designed/deployed incrementally and also focuses on individual units of logic
    // that are relationed to other units of logic to create the big picture inside the
    //



    // -----------
    // Photoshop selector language
    // -----------
    // Similar to CSS that will search in the layer structure and find the
    // layers that match the given selector.
    // Example:
    // var layer = getLayers('.header > .title');
    // Now the layer can be manipulated in any way.
    //
    // There will not be a getLayer method as this adds confusion on how
    // the layer will be selected if there are multiple layers that
    // match that selector, instead developers will have to add
    // getLayers('selector')[0] to get the first element from the query.
    //
    // The query selector language can also use:
    // - layer types 'text|image|container'
    // - layer graphical properteis 'container[top=20]'
    // - children selector to get all relevant layers for a certain layer
    // -- '.header[children]'
    //
    // -----
    // The search can be applied also on an element:
    // var layer = getLayers('.content')[0];
    // layer.getLayers('.title');
    // -----
    //
    //
    //


    return this;
};


Structure.prototype.optimiseCode = function () {
    var _this = this;

    var inheritableProperties = ['azimuth', 'border-collapse', 'border-spacing', 
    'caption-side', 'color', 'cursor', 'direction', 'elevation', 'empty-cells',
    'font-family', 'font-style', 'font-variant', 'font-weight', 'font',
    'letter-spacing', 'line-height', 'list-style-image', 'list-style-position', 'list-style-type', 
    'list-style', 'orphans', 'pitch-range', 'pitch', 'quotes', 'richness', 'speak-header', 
    'speak-numeral', 'speak-punctuation', 'speak', 'speak-rate', 'stress', 'text-align',
    'text-indent', 'text-transform', 'visibility', 'voice-family', 'volume', 'white-space', 'widows',
    'word-spacing'];

    // Commented font-size

    var defaultValues = {
        'box-sizing': 'content-box',
        'top': 'auto',
        'bottom': 'auto',
        'left': 'auto',
        'right': 'auto',
        'opacity': '1',
        'background': 'transparent',
        'padding-left': '0px',
        'padding-right': '0px',
        'padding-top': '0px',
        'padding-bottom': '0px',
        'margin-left': '0px',
        'margin-right': '0px',
        'margin-top': '0px',
        'margin-bottom': '0px'
    };

    var customDefaults = [
        function (element) {
            if (element.parsedCss.position === 'relative' && element.parsedCss.left === '0px' && element.parsedCss.top === '0px') {
                delete element.parsedCss.position;
                delete element.parsedCss.left;
                delete element.parsedCss.top;
            } 
        }
    ];



    var cssPatterns = {};

    var ignoredPatterns = ['top', 'left', 'bottom', 'right'];

    // Remove inheritable properties, or try to move them up the chain.

    function removeInheritable(element) {

        Object.keys(element.parsedCss).forEach(function (cssProperty) {
            var inheritable = 0;

            if (-1 !== inheritableProperties.indexOf(cssProperty)) {
                if ('inherit' === element.parsedCss[cssProperty]) {
                    delete element.parsedCss[cssProperty];
                } else {

                    if (undefined !== element.parent) {

                        // TODO: Make the property available for other two siblings through inheritance 
                        // if only one sibling has a differnt value.

                        element.parent.siblings.forEach(function (sibling) {
                            if (sibling.parsedCss[cssProperty] == element.parsedCss[cssProperty]) {
                                inheritable += 1;
                            }
                        });

                        if (inheritable === element.parent.siblings.length) {
                            element.parent.parsedCss[cssProperty] = element.parsedCss[cssProperty];

                            element.parent.siblings.forEach(function (sibling) {
                                delete sibling.parsedCss[cssProperty];
                            });

                        }
                    }
                }
            }
        });
    }

    function removeDefaultValues(element) {

        Object.keys(element.parsedCss).forEach(function (cssProperty) {

            if (
                true === defaultValues.hasOwnProperty(cssProperty)
                && defaultValues[cssProperty] === element.parsedCss[cssProperty]
            ) {
                delete element.parsedCss[cssProperty];
            }

        });

        customDefaults.forEach(function (customFn) {
            customFn(element);
        });

    }

    function extractCssPatterns(element) {

        Object.keys(element.parsedCss).forEach(function (cssProperty) {

            var value = element.parsedCss[cssProperty];

            if (-1 !== ignoredPatterns.indexOf(cssProperty)) {
                return;
            }

            if (false === cssPatterns.hasOwnProperty(cssProperty)) {
                cssPatterns[cssProperty] = {};
            }

            if (false === cssPatterns[cssProperty].hasOwnProperty(value)) {
                cssPatterns[cssProperty][value] = [];
            }

            cssPatterns[cssProperty][value].push(element);

        });

    }
 
    function parseCssPatterns() {
        var inc = 0;

        Object.keys(cssPatterns).forEach(function (cssProperty) {

            Object.keys(cssPatterns[cssProperty]).forEach(function (cssValue) {
                var className;

                // Ignore properties that have only one element.
                if (1 !== cssPatterns[cssProperty][cssValue].length) {
                    inc += 1;
                    className = cssProperty.replace('-', '_') + inc;
                    _this.cssClasses[className] = {};
                    _this.cssClasses[className][cssProperty] = cssValue;

                    cssPatterns[cssProperty][cssValue].forEach(function (layer) {
                        layer.cssClasses.push(className);
                        delete layer.parsedCss[cssProperty]; 
                    });

                } else {
                    delete cssPatterns[cssProperty][cssValue];
                }

            });

        });

    }

    // Group elements into css classes.
    function groupCssPatterns() {

        var orderdPatterns = [];

        Object.keys(cssPatterns).forEach(function (cssProperty) {
            Object.keys(cssPatterns[cssProperty]).forEach(function (cssValue) {

                // Ignore patterns that have only one element.
                if (1 === cssPatterns[cssProperty][cssValue].length) {
                    return;
                }

                orderdPatterns.push({
                    property: cssProperty,
                    value: cssValue,
                    elements: cssPatterns[cssProperty][cssValue]
                });
            });
        });

        orderdPatterns.sort(function (left, right) { 
            return right.elements.length - left.elements.length;
        });

        var order = '';
        orderdPatterns.forEach(function (pattern, index) {
            order += '[' + index + ':' + pattern.property + '-' + pattern.value + ' - ' + pattern.elements.length + '] ';
        });

        console.log(order);

        var i, j, mostCommonElements, commonElements;
        var relations = {};

        for (i = 0; i < orderdPatterns.length; i += 1) {

            relations[i] = [];

            for (j = 0; j < orderdPatterns.length; j += 1) {
                
                if (i === j) {
                    continue;
                }

                // Avoid unnecessary computation if the parsing has already been done.
                if (undefined !== relations[j] && undefined !== relations[j][i]) {
                    relations[i][j] = relations[j][i];
                    continue;
                }

                commonElements = 0;

                orderdPatterns[j].elements.forEach(function (element) {
                    orderdPatterns[i].elements.forEach(function (iElement) {
                        if (element.cssId === iElement.cssId) {
                            commonElements += 1;
                        }
                    });
                });

                relations[i].push({
                    sharedElements: commonElements,
                    withIndex: j
                });

            }
        }

        console.log(relations);
    }


    function walkLayerTree(node, process) {

        node.siblings.forEach(function (sibling) {
            walkLayerTree(sibling, process);
        });

        process(node);

    }

    walkLayerTree(this.parent, removeInheritable);
    walkLayerTree(this.parent, removeDefaultValues);
    walkLayerTree(this.parent, extractCssPatterns);

    parseCssPatterns();

    console.log('Optmised css.');

    return this;
};

Structure.prototype.optimisePositioning = function () {
    var _this = this;


    // TODO: when a background layer has opacity set and it has children
    // make the transparency on the background property not on the layer itself.
    function isInner(container, innerTest) {
        if (
            container.css.top <= innerTest.css.top
                && container.css.left <= innerTest.css.left
                && container.css.right >= innerTest.css.right
                && container.css.bottom >= innerTest.css.bottom
            ) {
            return true;
        } else {
            return false;
        }
    }

    function isOuter(container, outerTest) {
        if (
            container.css.top > outerTest.css.top
                || container.css.left > outerTest.css.left
                || container.css.right < outerTest.css.right
                || container.css.bottom < outerTest.css.bottom
            ) {
            return true;
        } else {
            return false;
        }
    }

    function isOverlay(container, overlayTest) {

        if (container.css.top < overlayTest.css.bottom
            && container.css.bottom > overlayTest.css.top
            && container.css.left < overlayTest.css.right
            && container.css.right > overlayTest.css.left
            ) {
            return true;
        } else {
            return false;
        }
    }


    function findElements(layer, isPosition, layers) {
        var elements = [];


        function findPosition(node) {

            node.siblings.forEach(function (sibling) {

                if (layer.id === sibling.id) {
                    return;
                }

                if (isPosition(layer, sibling)) {
                    if (isChildOf(layer, sibling)) {
                        findPosition(sibling);
                    } else {
                        elements.push(sibling);
                    }
                } else {
                    findPosition(sibling);
                }
            });

        }

        findPosition(_this.parent);

        // console.log(layer.id, elements.map(function (element) { return element.id }));

        return elements;
    }

    function isChildOf(layer, parent) {

        if (undefined === layer.parent) {
            return false;
        }

        if (layer.parent.id === parent.id) {
            return true;
        } else {
            return isChildOf(layer.parent, parent);
        }

    }

    // Redo the hierachies based on the actual location of elements
    // and not on the PSD order (Just as a Developer would do)

    // The slice is create a copy to ensure that the moving
    // of layers will not affect the loop.
    function moveLayers(node) {
        var moved = {};

        function move(layers) {
            layers.slice().forEach(function (layer) {
                var innerElements,
                    outerElements;

                innerElements = findElements(layer, isInner);

                innerElements = innerElements.filter(function (element) {
                    var parent,
                        levelMoved = 0,
                        levelToMove = 0;

                    if (undefined !== moved[element.id]) {
                        
                        if (layer.index > moved[element.id].index) {
                            moved[element.id] = layer;
                            return true;
                        } else {
                            return false;
                        }
                        
                    } else {
                        moved[element.id] = layer;
                        return true;
                    }

                });


                // outerElements = findElements(layer, isOuter);

                if ('div' !== layer.tag && 0 < innerElements.length) {
                    if ('img' === layer.tag) {
                        layer.css.background.fileSrc = layer.fileSrc;
                    }
                    layer.tag = 'div';

                }

                innerElements.forEach(function (element) {
                    var removeIndex;

                    // Search for the element index.
                    element.parent.siblings.every(function (sibling, index) {
                        if (sibling.id === element.id) {
                            removeIndex = index;
                            return false;
                        } else {
                            return true;
                        }
                    });

                    element.parent.siblings.splice(removeIndex, 1);

                    /*
                    if (0 !== layer._get('css.border.size', 0)) {
                        element.css.top -= layer.css.border.size;
                        element.css.left -= layer.css.border.size;
                    }

                    if (undefined !== layer.siblings[0]) {
                        element.css.zIndex = layer.siblings[0].css.index - 1;
                    }
                    */

                    layer.siblings.push(element);

                    // Modify the position of the element in the new parent to 
                    // keep it the same as before.

                });
                
                _this.linkLayers();
                
                move(layer.siblings);
            });
        }

        move(node.siblings);
    }

   

    function getValues(element, sibling) {
        return {
            top: sibling.css.top - element.css.top,
            left: sibling.css.left - element.css.left,
            bottom: element.css.bottom - (sibling.css.top + sibling.css.height),
            right: element.css.right - (sibling.css.left + sibling.css.width)
        };
    }

    function setPaddings(element) {
        var paddings;

        if (0 < element.siblings.length) {

            paddings = getValues(element, element.siblings[0]);

            element.siblings.forEach(function (sibling) {
                var values = getValues(element, sibling);

                Object.keys(values).forEach(function (property) {
                    if (paddings[property] > values[property]) {
                        paddings[property] = values[property];
                    }
                });

            });

            Object.keys(paddings).forEach(function (position) {
                var paddingName = 'padding' + position.charAt(0).toUpperCase() + position.slice(1);
                element.css[paddingName] = paddings[position];
            });

            element.css.width -= paddings.left + paddings.right;
            element.css.height -= paddings.top + paddings.bottom;

            element.siblings.forEach(function (sibling) {
                setPaddings(sibling);
            });
        } else {
            // The element does not have any siblings.
        }
    }

    function removeSimpleAbsolute(siblings) {

        siblings.forEach(function (sibling) {

            var top = sibling.css.top - sibling.parent.css.top,
                left = sibling.css.left - sibling.parent.css.left;

            if (0 === top && 0 === left
                && 0 === sibling.parent.css.paddingTop
                && 0 === sibling.parent.css.paddingLeft
            ) {
                sibling.siblings.forEach(function (subSibling) {
                    subSibling.css.left -= sibling.css.left;
                    subSibling.css.top -= sibling.css.top;
                });

                sibling.css.position = 'relative';
                sibling.css.left = 0;
                sibling.css.top = 0;
            
            }

            removeSimpleAbsolute(sibling.siblings);
        });

    }

    moveLayers(this.parent);

    var inc = 0;
    function showStructure(node) {

        inc += 1;
        var i = 0;
            var str = '';
        for (i = 0; i < inc; i += 1) {
            str += ' ';
        }
        

        node.siblings.forEach(function (sibling) {
            console.log(str + ' ' + node.id + ' - ' + sibling.id + ' -> ' + sibling.cssId);
            showStructure(sibling);
        });

    }

    // TODO: create a recurrency framework!!!!!!!!!!!

    //showStructure(this.parent);
    
    this.linkLayers();
    

    function showTree(tree) {
        var str = '\n';

        tree.forEach(function (node) {
            if (undefined !== node.relativeType) {
                str += '\nRELATIVE: ' + node.relativeType + '-' + node.id;
                str += '\nchildren: ' + node.children.length;
                if (0 < node.children.length) {
                    str += showTree(node.children);
                }
            } else {
                str += 'ELEMENT: ' + node.name + '\n'; 
                if (undefined !== node.rows) {
                    str += '\n' + showTree(node.rows);
                }
            }

            if (undefined !== node.relativeParent) {
                str += 'parent: ' + node.relativeParent.relativeType + ' - ' + node.relativeParent.id
                str += '\n';
            }

        });

        return str;
    }

    var nameInc = 0;

    function createNewNodes(nodes) {

        nodes.forEach(function (node, index) {
            var newNode;

            if (true === node.newElement) {
                nameInc += 1;
                newNode = new Layer(_this, {
                    name: 'newElement-' + nameInc + '-' + node.relativeType,
                    cssId: 'newElement-' + nameInc,
                    type: 'layerSection',
                    bounds: {
                        top: node.top,
                        left: node.left,
                        right: node.right,
                        bottom: node.bottom
                    }
                }, false);

                newNode.siblings = node.children;
                
                nodes.splice(index, 1, newNode);

                node = newNode;
            }

            if (undefined === node.children) {
                node.children = node.siblings;
            }

            if (0 !== node.children.length) {
                node.siblings = createNewNodes(node.children);
            } else {
                node.siblings = node.children;
            }

        });

        return nodes;
    }


    function setBefore(currentElement, nextElement) {
        var currentIndex,
            nextIndex;

        currentElement.parent.siblings.forEach(function (element, index) {
            if (currentElement.id === element.id) {
                currentIndex = index;
            } else if (nextElement.id === element.id) {
                nextIndex = index;
            }
        });

        if (currentIndex > nextIndex) {
            currentElement.parent.siblings.splice(currentIndex, 1, nextElement);
            currentElement.parent.siblings.splice(nextIndex, 1, currentElement);
        }

    }

    function moveElement(element, newParent) {
        var elementIndex;

        element.parent.siblings.forEach(function (sibling, index) {
            if (element.id === sibling.id) {
                elementIndex = index;
            }
        });

        element.parent.siblings.splice(elementIndex, 1);
        newParent.siblings.push(element);
        element.parent = newParent;
    }

    function removeFromList(elements, list) {
        var removed = 0,
            ids = [];

        elements.forEach(function (element) {
            ids.push(element.id);
        })

        while (elements.length !== removed) {

            list.every(function (element, index) {
                if (-1 !== ids.indexOf(element.id)) {
                    removed += 1;
                    var elem = list.splice(index, 1);
                    console.log('Removed ' + elem[0].id);
                    return false;
                } else {
                    return true;
                }
            });

        }

        return list;

    }

    var composedId = 1000000;

    function parseElements(elements) {

        // Create a composed element

        var composedElements = {};

        elements.forEach(function (element) {
            if (undefined !== element.composed && true !== element.composedParsed) {
                if (undefined === composedElements[element.composed.id]) {
                    composedElements[element.composed.id] = [];
                }

                composedElements[element.composed.id].push(element);
            }
        });

        Object.keys(composedElements).forEach(function (composedId) {
            var composed = composedElements[composedId][0].composed,
                newElement = new Layer(_this, {
                    id: ++composedId,
                    name: 'composed-' + composedId,
                    cssId: 'composed-' + composedId,
                    type: 'layerSection',
                    bounds: {
                        top: composed.top,
                        left: composed.left,
                        right: composed.right,
                        bottom: composed.bottom
                    }
                }, false);


            newElement.left = newElement.css.left;
            newElement.right = newElement.css.right;
            newElement.top = newElement.css.top;
            newElement.bottom = newElement.css.bottom;
            newElement.width = newElement.css.width;
            newElement.height = newElement.css.height;

            composed.children[0].parent.siblings.push(newElement);
            newElement.parent = composed.children[0].parent;

            // Set the next and prev elements to the next and prev of
            // the furthest elements that the composed elements are linked 
            // to.

            elements = removeFromList(composed.children, elements);

            composed.children.forEach(function (element) {
                element.composedParsed = true;
                moveElement(element, newElement);
            });

            parseElements(composed.children);

            newElement.next = composed.next;
            newElement.prev = composed.prev;
            newElement.row = composed.row;

            elements.push(newElement);
        });


        elements.forEach(function (element) {
            console.log('Using ' + element.id);
            element.css.position = 'relative';
            element.css.left = 'auto';
            element.css.top = 'auto';
            element.css.display = 'inline-block';
            element.css.verticalAlign = 'top';

            element.parent.css.fontSize = 0;

            if (undefined !== element.row.prev) {
                element.css.marginTop = element.row.top - element.row.prev.bottom;
            }

            if (undefined !== element.next) {

               element.css.marginRight = element.next.left - element.right;
                setBefore(element, element.next);
            } else {
                element.css.marginRight = element.parent.right - element.right;
                if (undefined !== element.parent.css.paddingRight) {
                    element.css.marginRight -= element.parent.css.paddingRight;
                }
            }

            if (undefined !== element.rows && 0 < element.rows.length) {
                parseRows(element.rows);
            }

        });
    }

    function parseRows(rows) {

        rows.forEach(function (row) {
            console.log('Parsing a new row');
            parseElements(row.children);

        });

    }


   var result = new Relative(this.parent);

    result.generate();

    result.parseTree();

    this.linkLayers();



// logStructure(result);

    // @TODO: If no children elements rely on the parent element for any kind of
    // absolute positioning then we can remove the relative positioning and return
    // to a static positioning.


    // Define the rows! Only then will you be able to further optimise.

    // Order all layers

    // Find static elements.
    /*
     this.parent.siblings.forEach(function (sibling) {

     // Find the first element
     sibling.siblings.every(function (innerSibling) {
     if (
     innerSibling.css.left )
     });
     })
     */

    // Make all elements that are aligned to one and the other inline-blocK



    /*
     // If an element overlaps it needs to remain positioned absolute.

     bg.siblings.forEach(function (sibling) {
     var overlays = findElements(sibling, isOverlay),
     names = "";


     overlays.forEach(function (overlay) {
     names += overlay.name + ' ';
     });
     console.log(sibling.name + ' has overlays: ' + names);
     // decide if elements overlap
     // Order them by index and then extract the ones that are at the bottom.
     });

     var referenceDistance = bg.siblings[1].css.left - bg.siblings[0].css.right;

     console.log(referenceDistance);
     */
    /*
     // Get the margins for the parent.
     bg.css.paddingLeft = bg.siblings[0].css.left - bg.css.left;
     bg.css.paddingTop = bg.siblings[0].css.top - bg.css.top;

     bg.css.width -= bg.css.paddingLeft;
     bg.css.height -= bg.css.paddingTop;

     // Find elements that do not touch one and odder to have a gap
     // between them

     bg.siblings.forEach(function (sibling) {
     if (undefined !== sibling.prev) {
     sibling.css.marginLeft = sibling.css.left - sibling.prev.css.right;
     }
     });
     */



    /*
     bg.siblings.forEach(function (sibling) {
     sibling.css.display = 'inline-block';
     sibling.css.verticalAlign = 'top';
     sibling.css.position = 'static';
     sibling.css.left = 'auto';
     console.log('Element ' + sibling.name);
     }); */

    /*
     bg.siblings.forEach(function (sibling) {
     if ()

     if (sibling.css.right < sibling.next.css.left) {
     sibling.css.display = "inline-block";
     } else {

     }
     });
     */

    // @TODO 1)
    // Based on the width/height and positioning decide if
    // an element is floated or static positioned.

    // For elements that are outside the bottomMost layer we can keep
    // an absolute positioning.
    // Based on the location where these elements cross the boundries of the
    // bottomMost layer we can obtain the position (bottom) for example to
    // keep the layer always at the bottom of the parent element regadrless
    // how much it will be expanding.

    // Need to establish padding and margin consideration for layers.
    // This can be initially calculated as the difference between
    // the boounds without FX and the sibling boundries without FX.
    // Because containers do not currenly have any backgrounds we need
    // to rely on stacking detection do decide if the sibling of Folder 1
    // is the background of the sibling Folder 2 of Folder 1, Layer 1.
    //
    // @TODO Create a stacking map of all layers based on which patterns
    // will emerge.
    //
    // Get all the sibling layers that are not sections and check their boundries.
    // Also siblings on the same level are guided by the zIndex property for stacking
    // but still require intersection detection.

    // @TODO 2)
    // Take inheritable styles and move the up the chain to the parent.
    // Remove the properties from the children.

    // @TODO 2)
    // Find patterns in the CSS styles and create classes
    // Remove all styles where the CSS clases are applied
    // Do not add in classes absolute position or boundries

    // @TODO 3)
    // When IDS do not have styles remaining then they can be safely removed
    // from the HTML and just DOM structure inheritance and classes can sustain
    // the element styling.

    // @TODO 4)
    // Parse the three again and remove all layerSections that do not have any containing
    // elements.

    // @TODO 5)
    // Make sure that the layers that become parents can be parents e.g. an element
    // that is text cannot contain other child positioned elements.

    // @TODO 6)
    // Detect images wrapped around text. Create a test case for such scenario.




    return this;
};

module.exports = Structure