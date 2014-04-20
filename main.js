// ----------------------------------
// GeneratorX
// @author Constantin Dumitrescu
// @author Bogdan Matei
// @company Brandup
// @version 0.1.0  
// ----------------------------------


(function () {
    "use strict";

    var 

        fs = require('fs'),
        path = require('path'),
        PNG = require('pngjs').PNG,
        events = new require('events');

    // GLOBAL TODOs
    // 
    // TODO: If the designer has his Types and Rulers in anything else 
    // than pixels, all values must be converted before using. 
    // Defaults: types (points) rulers (in?)
    // 
    //


    /**
     * Has method
     * Will provide a response for a chain of Object properties
     * e.g: x.has('one.of.these.properties');
     */
    Object.defineProperty(Object.prototype, '_has', {
        enumerable : false,
        value : function(params) {
            var tester;
            if ('function' !== typeof params && 'string' === typeof params) {
                try {
                    eval('tester = this.' + params);
                    // This eval is not evil , as long is completely secured
                    if (undefined === tester) {
                        throw new Error('The property ' + params + ' is not available');
                    }
                } catch (e) {
                    return false;
                }
            } else {
                return false;
            }
            return true;
        }
    });

    /**
     * getValueOf
     * Retrieves the value of a chained Object properties
     */
    Object.defineProperty(Object.prototype, '_get', {
        enumerable : false,
        value : function(params, fallback) {
            var value;
            if ('function' !== typeof params && 'string' === typeof params) {

                try {
                    eval('value = this.' + params.toString());
                    if (undefined === value) {
                        throw new Error('not available');
                    }
                } catch (e) {
                    if (undefined !== fallback) {
                        return fallback;
                    }
                    return undefined;
                }
            } else {
                return false;
            }
            return value;
        }
    });

    // TODO: Create a test suite generator to get the GenX File and generate also images
    // Which will be shown on the same page as a left and right comparison.

    function init(generator) {
        
        generator.getDocumentInfo().then(

            function (document) {
                runGenerator(document, generator);
            },
            
            function (err) {
                console.error(" Error in getDocumentInfo:", err);
            }

        ).done();    
    }

    function stringify(obj, circularProperties) {
        var stringified,
            circularProperties = circularProperties ? circularProperties : [];

        function removeCircular(name, value) {
            if (-1 === circularProperties.indexOf(name)) {
                return value;
            } else {
                //Undefined properties will be removed from JSON.
                return undefined; 
            }
        }

        try {
            if (0 === circularProperties.length) {
                stringified = JSON.stringify(obj, null, 4);
            } else {
                stringified = JSON.stringify(obj, removeCircular, 4);
            }
        } catch (e) {
            console.error('Stringify error:', e);
            stringified = String(obj);
        }

        return stringified;
    }


    // TODO: Spawn a worker to handle the saving of the pixmap.
    function savePixmap(pixmap, filePath, emitter){
        var pixels = pixmap.pixels,
            len = pixels.length,
            pixel,
            location,
            png,
            stream,
            channelNo = pixmap.channelCount;

        // Convert from ARGB to RGBA, we do this every 4 pixel values (channelCount)
        for(location = 0; location < len; location += channelNo){
            pixel = pixels[location];
            pixels[location]   = pixels[location + 1];
            pixels[location + 1] = pixels[location + 2];
            pixels[location + 2] = pixels[location + 3];
            pixels[location + 3] = pixel;
        }

        var png = new PNG({
            width: pixmap.width,
            height: pixmap.height
        });
     
        png.data = pixels;

        png.on('end', function () {
            stream.end();
            emitter.emit('finishedImage');
        });

        console.log('calling savePixmap for ' + filePath);
        stream = fs.createWriteStream(filePath);
        png
            .pack()
            .pipe(stream);
    }

    function generateFontFace(font, fontName) {
        var fontFace = '';

        Object.keys(font).forEach(function (variant) {
            fontFace += "@font-face {"
                + "font-family: '" + font[variant] + "'; "
                + " src: url('fonts/roboto-" + variant + ".eot'); "
                + " src: url('fonts/roboto-" + variant + ".eot?#iefix') format('embedded-opentype')," 
                + "     url('fonts/roboto-" + variant + ".woff') format('woff'),"
                + "    url('fonts/roboto-" + variant + ".ttf') format('truetype'),"
                + "    url('fonts/roboto-" + variant + ".svg#" + fontName + variant + "') format('svg');"
                + "font-weight: normal;"
                + "font-style: normal;"
                + "}";
        });

        return fontFace;
    }

    function getCSSFontFamily(fontName) {
        var font = "";
        
        switch (fontName) {
            case 'Oswald':
                font += generateFontFace({
                    regular: 'oswaldbook'
                }, 'oswald');
            break;

            case 'IcoMoon':
                font += generateFontFace({
                    regular: 'icomoon'
                }, 'icomoon');
            break;

            case 'Futura':

            break;

            case 'Helvetica':

            break;

            case 'Helvetica Neue':

            break;

            case 'Arial':

            break;

            case 'OpenSans':
                
                font += generateFontFace({
                    bold: 'open_sansbold',
                    blackitalic: 'open_sansbold_italic',
                    extrabold: 'open_sansextrabold',
                    extrabolditalic: 'open_sansextrabold_italic',
                    italic: 'open_sansitalic',
                    light: 'open_sanslight',
                    lightitalic: 'open_sanslight_italic',
                    semibold: 'open_sanssemibold',
                    regular: 'open_sansregular',
                    semibolditalic: 'open_sanssemibold_italic',
                }, 'open_sans');

            break;

            case 'Myriad':

            break;

            case 'Tipogram':

            break;

            case 'Roboto':

                font += generateFontFace({
                    black: 'robotoblack',
                    blackitalic: 'robotoblack_italic',
                    bold: 'robotobold',
                    bolditalic: 'robotobold_italic',
                    italic: 'robotoitalic',
                    light: 'robotolight',
                    medium: 'robotomedium',
                    mediumitalic: 'robotomedium_italic',
                    regular: 'robotoregular',
                    thin: 'robotothin',
                    thinitalic: 'robotothin_italic'
                }, 'roboto');

            break;

            default:
                // console.log('The font name "' + fontName + '" is not supported.');
            break;
        }

        return font;
    }

    function createBoxShadow(shadowStyles, shadowType, elementType) {
        var property = "",
            shadow = shadowStyles[shadowType],
            angle = 0 < shadow.angle ? shadow.angle : 360 + shadow.angle,
            // 91 is so that the substraction does not result in 0;
            normalisedAngle = angle - 90 * Math.floor(angle / 91),
            x,
            y,
            percent; 

        if (-1 === ['outerGlow', 'innerGlow'].indexOf(shadowType)) {
            
            // TODO: Accomodate for the chokeMatte property
            percent = normalisedAngle / 90;
            if (angle <= 90) {
                x = - (shadow.distance - shadow.distance * percent);
                y = shadow.distance * percent;
            } else if (angle <= 180) {
                x = shadow.distance * percent;
                y = shadow.distance - shadow.distance * percent;
            } else if (angle <= 270) {
                x = shadow.distance - shadow.distance * percent;
                y = - shadow.distance * percent;
            } else if (angle <= 360) {
                x = - (shadow.distance * percent);
                y = - (shadow.distance - shadow.distance * percent);
            }

        } else {
            x = 0;
            y = 0;
        }

        if (true === shadowStyles.outer.active && 'inset' === shadowType) {
            property += ', ';
        }

        if (true === shadowStyles.outerGlow.active && 'innerGlow' === shadowType) {
            property += ', ';
        }

        // TODO: For outer glows, create the use case for gradient usage instead
        // of solid color.

        property += Math.round(x) + 'px ' + Math.round(y) + 'px ';
    
        // TOOD: Establish the relation between innerGlow parameters (chokeMatte and size) and
        // omolog values in CSS.
        // It seems that a Choke: 90%, Size: 10px is the same as box-shadow: 0 0 0 10px
        
        if ('innerGlow' === shadowType) { 
            if (0 !== shadow.spread) {
                property += (shadow.blur - (shadow.blur * shadow.spread / 100)) + 'px ';
            }

            // If this is a text layer then a pseudo element will be generated for the glow.
            // The text-shadow does not have an additional parameter.
            if ('textLayer' !== elementType) {
                property += shadow.blur + 'px ';
            }
        } else if ('outerGlow' === shadowType) {
            property += shadow.blur + 'px ';

            // Same as above.
            if ('textLayer' !== elementType) {
                property += shadow.spread + 'px ';
            }
        } else {
            property += shadow.blur + 'px ';
        }



        property += ' rgba(' + Math.round(shadow.color.red) + ', '
            + Math.round(shadow.color.green) + ', '
            + Math.round(shadow.color.blue) + ', '
            + (shadow.opacity / 100) + ')';

        if (('inset' === shadowType || 'innerGlow' === shadowType) 
            && 'textLayer' !== elementType) {
            property += ' inset';
        }

        return property;
    }

    // All sections are still layers.
    // The semantic is given by the way the interaction with the dom will occur
    // A layer must have: 
    // - tag: div, p, span, etc
    // - class
    // - id
    // - text
    // - parent/nextSibling/prevSibling for traversing
    // - css all the css properties that will eventually end in the stylesheet

    // Parsing will be made in 3 stages:
    // 1. The parsing of the PSD document with absolute styles - Done
    // 2. From the absolute styles connections between elements will emerge (e.g. floats, overlay, etc)
    // 3. Establish the logical order of dom elements (based on float, etc)
    // 4. Find patterns in styles through css duplication, hierachy and inheritance to optimise the css creation
    // 5. Create the HTML version of the structure
    // 6. Create the CSS version of the layers
    // 7. Create a file with the HTML and CSS code


    // TODO: For layers that have the same name regardless of their position
    // in the structure tree, allocate different cssNames to avoid id collision


    function parseCSS(style, globalStyles, cssOverwrites) {

        // TODO: Add default styles for all the bellow properties.

        var css = {
                top: style._get('bounds.top', 0),
                right: style._get('bounds.right', 0),
                bottom: style._get('bounds.bottom', 0),
                left: style._get('bounds.left', 0),
                position: 'static',
                background: {
                    masterActive: style._get('layerEffects.masterFXSwitch', true),
                    active: style._has('fill'),
                    color: {
                        red: style._get('fill.color.red', 255),
                        green: style._get('fill.color.green', 255),
                        blue: style._get('fill.color.blue', 255)
                    },
                    gradient: {
                        colors: [],
                        locations: [],
                        reverse: style._get('layerEffects.gradientFill.reverse', false),
                        type: 'linear',
                        opacity: style._get('layerEffects.gradientFill.opacity.value', 100),
                        angle: style._get('layerEffects.gradientFill.angle.value', -90)
                    },
                    // Background type (linear, radial, angle)
                    type: style._get('layerEffects.gradientFill.type', 'linear')
                },
                opacity: style._get('blendOptions.opacity.value', 100) / 100,
                border: {
                    masterActive: style._get('layerEffects.masterFXSwitch', true),
                    active: style._has('layerEffects.frameFX'),
                    color: {
                        red: style._get('layerEffects.frameFX.color.red', 255),
                        green: style._get('layerEffects.frameFX.color.green', 255),
                        blue: style._get('layerEffects.frameFX.color.blue', 255)
                    },
                    opacity: style._get('layerEffects.frameFX.opacity.value', 100),
                    size: style._get('layerEffects.frameFX.size', 3)
                },
                boxSizing: style._get('layerEffects.frameFX.style', 'outsetFrame'),
                boxShadow: {
                    masterActive: style._get('layerEffects.masterFXSwitch', true),
                    active: style._has('layerEffects.dropShadow')  
                        || style._has('layerEffects.innerShadow')
                        || style._has('layerEffects.outerGlow')
                        || style._has('layerEffects.innerGlow'),
                    outer: {
                        active: style._has('layerEffects.dropShadow'),
                        color: {
                            red: style._get('layerEffects.dropShadow.color.red', 0),
                            green: style._get('layerEffects.dropShadow.color.green', 0),
                            blue: style._get('layerEffects.dropShadow.color.blue', 0)
                        },
                        opacity: style._get('layerEffects.dropShadow.opacity.value', 75),
                        distance: style._get('layerEffects.dropShadow.distance', 5),
                        blur: style._get('layerEffects.dropShadow.blur', 5),
                        angle: style._get('layerEffects.dropShadow.localLightingAngle.value', 120),
                        spread: style._get('layerEffects.dropShadow.chokeMatte', 0) 
                    },
                    inset: {
                        active: style._has('layerEffects.innerShadow'),
                        color: {
                            red: style._get('layerEffects.innerShadow.color.red', 0),
                            green: style._get('layerEffects.innerShadow.color.green', 0),
                            blue: style._get('layerEffects.innerShadow.color.blue', 0)
                        },
                        opacity: style._get('layerEffects.innerShadow.opacity.value', 75),
                        distance: style._get('layerEffects.innerShadow.distance', 5),
                        blur: style._get('layerEffects.innerShadow.blur', 5),
                        // TODO: Add global lighting angle
                        angle: style._get('layerEffects.innerShadow.localLightingAngle.value', 120),
                        spread: style._get('layerEffects.innerShadow.chokeMatte', 0) 
                    },
                    outerGlow: {
                        active: style._has('layerEffects.outerGlow'),
                        color: {
                            red: style._get('layerEffects.outerGlow.color.red', 255),
                            green: style._get('layerEffects.outerGlow.color.green', 255),
                            blue: style._get('layerEffects.outerGlow.color.blue', 190),
                        },
                        blur: style._get('layerEffects.outerGlow.blur', 5),
                        opacity: style._get('layerEffects.outerGlow.opacity.value', 75),
                        spread: style._get('layerEffects.outerGlow.chokeMatte', 0)
                    },
                    innerGlow: {
                        active: style._has('layerEffects.innerGlow'),
                        color: {
                            red: style._get('layerEffects.innerGlow.color.red', 255),
                            green: style._get('layerEffects.innerGlow.color.green', 255),
                            blue: style._get('layerEffects.innerGlow.color.blue', 190),
                        },
                        blur: style._get('layerEffects.innerGlow.blur', 5),
                        opacity: style._get('layerEffects.innerGlow.opacity.value', 75),
                        spread: style._get('layerEffects.innerGlow.chokeMatte', 0)
                    }
                },
                borderRadius: [],
                zIndex: style.index,
                color: { 
                    red: style._get('text.textStyleRange[0].textStyle.color.red', 0),
                    green: style._get('text.textStyleRange[0].textStyle.color.green', 0),
                    blue: style._get('text.textStyleRange[0].textStyle.color.blue', 0)
                },
                fontSize: style._get('text.textStyleRange[0].textStyle.size', 16),
                textAlign: style._get('text.paragraphStyleRange[0].paragraphStyle.align', 'inherit'),
                fontFamily: {
                    family: style._get('text.textStyleRange[0].textStyle.fontName', 'Arial'),
                    variant: style._get('text.textStyleRange[0].textStyle.fontStyleName', 'Regular')
                }
            },
            textColor;

        Object.keys(cssOverwrites).forEach(function (property) {
            css[property] = cssOverwrites[property];
        });

        // -----------------
        // Background styles

        // Fill color overwritted by the blend options
        css.background.color = {
            red: style._get('layerEffects.solidFill.color.red', css.background.color.red),
            green: style._get('layerEffects.solidFill.color.green', css.background.color.green),
            blue: style._get('layerEffects.solidFill.color.blue', css.background.color.blue)
        };


        // Inner and outer shadows can opt to not use globalAngles and have 
        // the default angle.
        if (true === style._get('layerEffects.innerShadow.useGlobalAngle', true)) {
            css.boxShadow.inset.angle = globalStyles.globalLight.angle;
        }

        if (true === style._get('layerEffects.dropShadow.useGlobalAngle', true)) {
            css.boxShadow.outer.angle = globalStyles.globalLight.angle;
        }

        // TODO: It seems that for shadows the 100% opacity is not 100% CSS opacity
        // but somewhere around 80%. Experiment with this and try to find a 
        // good approximation.
        
        // TODO: Account for different blend modes for each style. This would be an 
        // advanced feature and would require a canvas to plot individual features
        // and an implementation of blend mode algorithms to obtain accurate CSS
        // values.

        // TODO: Depending on the degree of accuracy the user requires, the layer can be
        // exported as an image to ensure that all FX styles are 100% accurate.

        // TODO: Implement Radial Gradient
        
        // TODO: Implement Angle Gradient

        // TODO: Implement Drop shadow countour settings on layersEffects.dropShadow.transferSpec

        // Gradient Colors
        style._get('layerEffects.gradientFill.gradient.colors', []).forEach(function (color) {
            css.background.gradient.colors.push({
                red: color.color.red,
                green: color.color.green,
                blue: color.color.blue,
                location: color.location,
                type: color.type,
                midpoint: color.midpoint
            });
            css.background.gradient.locations.push(color.location);
        });

        // The color array is in reverse order due to the way is added
        css.background.gradient.colors.reverse();

        // TODO: Implement border

        // Border Radius
        switch (style._get('path.pathComponents[0].origin.type', '')) {
            case 'roundedRect':
                css.borderRadius = style._get('path.pathComponents[0].origin.radii', []);
            break;

            case 'ellipse':
                // this actually requires to be transffered to an SVG
                // ellipse implementation
                (function () {
                    var bounds = style._get('path.pathComponents[0].origin.bounds', {}),
                        width = bounds.bottom - bounds.top,
                        height = bounds.right - bounds.left;
                    css.borderRadius[0] = height / 2;
                }());
            break;

            default:
                // There is no border radius.
            break;
        }

        if (true === style._has('strokeStyle', false)) {
            // TODO: Implement strokeStyles for shape layers.
            // This can either be a new ::before / ::after element with
            // a transparent background and a border.
            // OR in some cases it might be an SVG.
        }

        if (false === style._get('strokeStyle.fillEnabled', true)) {
            css.background.active = false;
        }


        // [TEMP] Default dimensions.
        css.width = css.right - css.left;
        css.height = css.bottom - css.top;


        if ('textLayer' === style.type) {


            // TODO: Revisit lineHeight / leading styles. There might be
            // a better way to parse lineHeight.

            // 30 seems to be the default leading/line height. 
            // In CSS the line height is set on the line on which the text sits
            // while leading seems to be the distance between lines.
            
            // 7. However, if leading is set to "auto", the actual leading number is 120% of the font size.

            // css.lineHeight = (css.fontSize + style._get('text.textStyleRange[0].textStyle.leading', 30) / 2) - 1;
            css.lineHeight = (css.fontSize + css.fontSize / 2) - 1;

            /*
            (function () { 
                var baseLineShift = Math.abs(style._get('text.textStyleRange[0].textStyle.baselineShift', 1));
                
                // 1px baseLineShift = 2.40566

                if (2.40566 > baseLineShift) {
                    css.fontSize = Math.floor(css.fontSize / 2);
                    css.lineHeight = Math.floor(css.lineHeight / 2);
                }
            }());
            */

            (function () {
                var textStyleRanges = style._get('text.textStyleRange', []);

                if (1 === textStyleRanges.length)  {
                    css.fontWeight = style._get('text.textStyleRange[0].textStyle.syntheticBold', false),
                    css.fontStyle = style._get('text.textStyleRange[0].textStyle.syntheticItalic', false)
                } else {
                    css.fontWeight = false;
                    css.fontStyle = false;
                }

            }());

            // TODO: Implement the WebKit algorithm to detect the real width of the 
            // text with all the styles attached. 
            // This should do the following:
            // 1. Parse the .ttf file
            // 2. Create the sequence of text vectors dictated by the .ttf rules
            // of binding characters
            // 3. Add the text transformation on the created sequence of vectors
            // 4. Extract the width pixel value from the vector implementation in 
            // bitmap environment.

            // TODO: Adjust the estimated px value bellow that seems to accomodate
            // the difference between PSD and Browser text rendering.
            css.width = css.width + 10;
            css.height = 'auto';

            // Definitions:
            // boundingBox: the coordinates that wrap the text
            // bounds: the coordinates that wrap the user defined area for the text or 
            //      if the area wasn't defined by the user, the total area occupied 
            //      by the text which might be different than the boundingBox coordinates
            
            // It seems that the bounding box for text content is given by the
            // layer.text.textShape.char = "box" | "paint"
            // and
            // layer.text.textShape.bounds = { top | left | bottom | right }

            (function () {
                var bounds = style._get('text.bounds'),
                    boxBounds = style._get('text.boundingBox'),
                    boundsWidth = bounds.right - bounds.left,
                    boundsHeight = bounds.bottom - bounds.top,
                    boxBoundsWidth = boxBounds.right - boxBounds.left,
                    boxWidthDifference = boxBoundsWidth - boundsWidth;

                // From inital experimentation the difference between the bounds
                // when not having a user defined area is within a 10 px range.
                // Of course, this is empiric evidence and needs further research.
                // Also, an area that is less than 10 px from the area occupied
                // by the text leaves little room for alignment (which is in fact
                // the goal of this). If the desiner did create a less than 10 px
                // container for the text then this might be a bad practice to do
                // so.

                if (6 > Math.abs(boxWidthDifference)) {
                    // The text does not have a defined area and an be left 
                    // to be arranged through the alignment styles of the parent
                    // element.
                    css.textAlign = 'left';

                    // TODO: This is a sub optimal solution to compensate for the difference between
                    // line height and leading.
                    css.top -= 7;
                } else {
                    // The text has a defined area and needs to be further
                    // wrapped in a parent container element.

                    css.width = boundsWidth;
                    css.height = boundsHeight;
                    css.left -= Math.ceil(boxBounds.left);
                }

            }());
        }

        // [TEMP] Overwrite positioning for now
        css.position = 'absolute';

        // TODO: Implement outer glow

        // TODO: Implement inner shadow/inner glow

        // ---------
        // Text styles


        // For some reason font size comes in a different format that is 

        // TODO: Line height
        // leading / font size
        // css.lineHeight = ((style._get('text.textStyleRange[0].textStyle.leading', 16) / css.fontSize) * 1000 ) / 1000;

        //
        // Overwrites
        //

        // Border requires adjustments to top, left and widht, height
        if (true === css.border.active) {
            // TODO: Figure out how to keep the box-sizing: border-box. Currently
            // inside photoshop you set the content
            css.backgroundClip = 'content-box';
            if ('insetFrame' === css.boxSizing) {
                css.borderRadius.forEach(function (bound, index) {
                    css.borderRadius[index] = bound + css.border.size;
                });
            } else if ('outsetFrame' === css.boxSizing) {
                css.top -= css.border.size;
                css.left -= css.border.size;
                css.borderRadius.forEach(function (bound, index) {
                    css.borderRadius[index] = bound + css.border.size;
                });
            } else if ('centeredFrame' === css.boxSizing) {
                css.top -= css.border.size / 2;
                css.left -= css.border.size / 2;
                css.width -= css.border.size;
                css.height -= css.border.size;
                css.borderRadius.forEach(function (bound, index) {
                    css.borderRadius[index] = bound + css.border.size;
                });
            } else {
                console.log('The box sizing "' + css.boxSizing + '" is not recognised.');
            }
        }

        return css;
    }

    function parseText(layer) {
        var text = layer._get('text.textKey', ''),
            transformedText = '',
            textRanges = layer._get('text.textStyleRange', []),
            lastParsedIndex = 0;

        if (1 === textRanges.length) {
            // If there is just one text range that means the text
            // is uniform.
        } else {
            textRanges.forEach(function (range) {
                var extractedText = text.substr(range.from, range.to - range.from),
                    styles = "",
                    fontFamily = range.textStyle.fontName.toLowerCase(),
                    fontVariant = range.textStyle.fontStyleName.replace(' ', '_').toLowerCase();

                // For some reason Photoshop sometimes returns a duplicated
                // text range.
                if (lastParsedIndex === range.to) {
                    return;
                }

                lastParsedIndex = range.to;

                styles += 'font-family: ' + fontFamily.toLowerCase();

                if ('regular' !== fontVariant) {
                    styles += fontVariant + ';';
                }

                // TODO: Add the ability to combine bold, italic or 
                // other styles on a single text. This might require
                // 1. a single wrapper with clases:
                // <span class="bold italic fontSize20px">Text</span>
                // 2. or a custom id
                // <span id="custom-styling-113">Text</span>
                // I think I would prefer option No. 1

                if (true === range.textStyle.syntheticBold) {
                    extractedText = '<strong style="' + styles + '">' + extractedText + '</strong>';
                } else if (true === range.textStyle.syntheticItalic) {
                    extractedText = '<em style="' + styles + '">' + extractedText + '</em>';
                } else {
                    extractedText = '<span style="' + styles + '">' + extractedText + '</span>';
                }

                transformedText += extractedText;
            });
        }

        if ('' !== transformedText) {
            text = transformedText;
        }

        return text;
    }

    var getUnique = (function () {
        var id = 0;
        return function () {
            id += 1;
            return id;
        };
    }());

    function Layer(structure, layer, cssOverwrites, clippingMask) {
        var _this = this,
            parsedCSS;

        this.id = layer.id;
        this.siblings = [];
        this.visible = layer.visible;
        this.name = layer.name;
        this.index = layer.index;
        this.type = layer.type;
        this.text = '';
        this.structure = structure;

        // Raw css styles. 
        // This are similar to a "computed" style. Will include
        // all element styles which then can be further optimised.
        this.css = parseCSS(layer, structure.styles, cssOverwrites);

        // Layer type specific configuration
        switch (layer.type) {
            case 'layerSection':
                this.tag = 'div';
            break;

            case 'shapeLayer':
                this.tag = 'div';

                // TODO: This means the path might require to be produced in SVG somehow
                if ('unknown' === layer._get('path.pathComponents[0].origin.type', 'shapeLayer')) {
                    this.tag = 'img';
                }

                if (true !== layer._get('mask.removed', false)) {
                    this.tag = 'img';
                }

                if (false === layer._get('strokeStyle.fillEnabled', true)) {
                    this.tag = 'img';
                }

                if (1 < layer._get('path.pathComponents', []).length) {
                    this.tag = 'img';
                }

            break;

            case 'textLayer':
                this.tag = 'span';
                this.text = parseText(layer);
            break;

            case 'layer':
                this.tag = 'img';
            break;

            default: 
                console.log('The layer type "' + layer.type + '" is no recognised.');
            break;
        }

        if (true === clippingMask) {
            this.tag = 'img';
        }
        
        // Image layers should be exported also with layer FX.
        // Layer FX can be disabled.
        if ('img' === this.tag) {
            this.css.boxShadow.active = false;
            this.css.background.active = false;
            this.css.border.active = false;

            if (undefined !== layer.boundsWithFX) {
                this.css.top = layer.boundsWithFX.top;
                this.css.left = layer.boundsWithFX.left;
                this.css.bottom = layer.boundsWithFX.bottom;
                this.css.right = layer.boundsWithFX.right;
                this.css.width = this.css.right - this.css.left;
                this.css.height = this.css.bottom - this.css.top;
            }
        }

        // Parse children layers.
        if (undefined !== layer.layers) {
            structure.createLayers(this.siblings, layer.layers);
        }

        // The boundries are given by the topmost layer boundries (without FX)
        // and bottomost layer boundries.
        // Calculate the container boundries.
        if ('layerSection' === layer.type && 0 !== this.siblings.length) {
            (function () {
                var topmost = _this.siblings[0].css.top,
                    rightmost = _this.siblings[0].css.right,
                    leftmost = _this.siblings[0].css.left,
                    bottomost = _this.siblings[0].css.bottom;

                _this.siblings.forEach(function (sibling) {
                    if (topmost > sibling.css.top) {
                        topmost = sibling.css.top
                    }
                    if (bottomost < sibling.css.bottom) {
                        bottomost = sibling.css.bottom
                    }
                    if (leftmost > sibling.css.left) {
                        leftmost = sibling.css.left;
                    }
                    if (rightmost < sibling.css.right) {
                        rightmost = sibling.css.right;
                    }
                });

                _this.css.top = topmost;
                _this.css.left = leftmost;
                _this.css.bottom = bottomost;
                _this.css.right = rightmost;
                _this.css.width = rightmost - leftmost;
                _this.css.height = bottomost - topmost;
            }());
            
        }
    }

    Layer.prototype.getCSSName = function (name) {
        return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
    };

    Layer.prototype.getCSSProperty = function (name) {
        var property = this.getCSSName(name) + ': ',
            after = "",
            value = this.css[name],
            _this = this;

        // TODO: Add if statement for dealing with Master Active switch
        switch (name) {
            case 'top':
                property += Math.round(value) - Math.round(this.parent.css.top) + 'px';
            break;
            
            case 'right':
                property += 'auto'; // Math.round(value) + 'px';
            break;
            
            case 'bottom':
                property += 'auto'; // Math.round(value) + 'px';
            break;

            case 'left':
                property += Math.round(value) - Math.round(this.parent.css.left) + 'px';
            break;

            case 'position':
                property += value;
            break;

            case 'width':
                property += value;
                
                if ('auto' !== value) {
                    property += 'px';
                }

            break;

            case 'height':
                property += value;
                
                if ('auto' !== value) {
                    property += 'px';
                }

            break;

            case 'background':

                if (true === value.active && true === value.masterActive) {

                    // In photohop there is the case where bitmap layers have background styles applied
                    // but still keep a large portion transparent. This leads to images that cover everything 
                    // behind them.
                    if ('img' !== this.tag) {
                        if (0 < value.gradient.colors.length) {

                            property += 'linear-gradient(';

                            if (true === value.gradient.reverse) {
                                value.gradient.colors.reverse();
                            }

                            property += Math.abs(value.gradient.angle + 90) + 'deg, ';

                            value.gradient.colors.forEach(function (color, index, colors) {
                                property += 'rgba(' 
                                    + Math.round(color.red) + ','
                                    + Math.round(color.green) + ',' 
                                    + Math.round(color.blue) + ', '
                                    + (value.gradient.opacity / 100).toFixed(2)
                                    + ') ' + Math.round((value.gradient.locations[index] * 100) / 4096) + '%';

                                if (index < colors.length - 1) {
                                    property += ', ';
                                }
                            });

                            property += ')';

                        } else if (null !== value.color.red) {
                            property += 'rgb('
                                + Math.round(value.color.red) + ', '
                                + Math.round(value.color.green) + ', '
                                + Math.round(value.color.blue)
                                + ')';
                        } else {
                            property += 'transparent';
                        }
                    } else {
                        property += 'transparent';
                    }
                } else {
                    // The background is not active.
                }

            break;

            case 'zIndex':
                property += value;
            break;
            
            case 'border':
                if (true === value.active) {
                    property += Math.round(value.size) + 'px solid rgba(' 
                        + Math.round(value.color.red) + ', '
                        + Math.round(value.color.green) + ', '
                        + Math.round(value.color.blue) + ', ' 
                        + (value.opacity / 100).toFixed(2) + ')';
                }
            break;

            case 'boxSizing':

                if ('outsetFrame' === value) {
                    property += 'content-box;'
                } else if ('insetFrame' === value) {
                    property += 'border-box;'
                } else if ('centeredFrame' === value) {
                    property += 'padding-box';
                } else {
                    console.log('Border sizing property ' + value + ' was not found.');
                }
            break;

            case 'borderRadius':
                if (0 < value.length) {
                    value.forEach(function (bound) {
                        property += Math.ceil(bound) + 'px ';
                        after += Math.ceil(bound) + 'px ';
                    });
                }

                // Type: roundedRect, ellipse

            break;

            case 'opacity':
                property += value;
            break;

            case 'color':

                if (0 !== Object.keys(value).length) {
                    property += 'rgb('
                        + Math.round(value.red) + ', '
                        + Math.round(value.green) + ', '
                        + Math.round(value.blue) + ')';
                } else {
                    property += 'inherit';
                }

            break;

            case 'fontSize':

                property += Math.round(value) + 'px';

            break;

            case 'textAlign':

                property += value;

            break;

            case 'fontWeight':

                if (true === value) {
                    property += 'bold';
                } else {
                    property += 'normal';
                }

            break;

            case 'fontStyle':

                if (true === value) {
                    property += 'italic';
                } else {
                    property += 'normal';
                }

            break;

            case 'boxShadow':

                if (true === value.active) {
                        
                        if ('textLayer' === _this.type) {
                            property = 'text-shadow: ';
                        }

                        ['outerGlow', 'innerGlow'].forEach(function (glowType) {
                            if (true === value[glowType].active) {
                                after += createBoxShadow(value, glowType, _this.type);
                            }
                        });


                        ['outer', 'inset'].forEach(function (shadowType) {
                            if (true === value[shadowType].active) {
                                property += createBoxShadow(value, shadowType, _this.type);
                            }
                        });

                } else {
                    // Not active 
                }
            break;

            case 'backgroundClip':
                property += value;
            break;

            case 'lineHeight':
                property += Math.round(value) + 'px';
            break;
            
            case 'fontFamily':

                property += value.family.toLowerCase();

                if ('Regular' !== value.variant) {
                    property += value.variant.replace(' ', '_').toLowerCase()
                }
               
            break;

            default: 
                console.log('CSS property "' + name + '" is not regonized.');
            break;
        }

        return {
            property: property,
            after: after
        };
    };

    Layer.prototype.getCSS = function () {
        var _this = this,
            css = '',
            addFont = '',
            before = '';

        if (false === this.visible) {
            return '';
        }

        css += '\n#' + this.cssId + ' {\n';

        Object.keys(this.css).forEach(function (property) {
            var parsedCSS = _this.getCSSProperty(property);
            // TODO: Add outer glow as an after element.


            // TODO: Add _this.css[property].active testing before trying to create a method.

            css += '\t' + parsedCSS.property + ';\n';

            if ('' !== parsedCSS.after) {
                if ('boxShadow' === property && 'textLayer' === _this.type) {
                    before += '\ttext-shadow: ' + parsedCSS.after + ';\n';
                } else {
                    before += '\t' + _this.getCSSName(property) + ': ' + parsedCSS.after + ';\n';
                }
            }
            
            // Implementing certain styles require additional rules based
            // on the type of the element and the property being styled
            if ('textLayer' === _this.type && 'background' === property) {
                // TODO: Fix gradient opacity on for text layers.
                css += '\t' + '-webkit-background-clip: text;\n';
                // css += '\t' + '-webkit-text-fill-color: transparent;\n';
            }

            if ('textLayer' === _this.type && 'fontFamily' === property) {
                addFont = _this.css[property].family;
            }

            // console.log(getCSSFontFamily(_this[property]));

        });

        css += '}';

        // TODO: If the font was already added do not add it again.

        css += getCSSFontFamily(addFont);

        if ("" !== before) {
            css += '\n#' + this.cssId + '::before {\n';
            
            if ('' !== this.text) {
                css += '\tcontent: "' 
                    + this.text
                        .replace('\r', ' \\A ')
                        .replace(/[\s]+/g, ' ')
                    + '";\n';
            } else {
                css += '\tcontent: "";\n';
            }

            css += '\tdisplay: block;\n';
            css += '\twidth: 100%;\n';
            css += '\theight: 100%;\n';
            css += '\tposition: absolute;\n';
            css += '\ttop: 0;\n';
            css += '\tleft: 0;\n';
            css += 'white-space: pre;';
            css += 'color: transparent;';
            css += before;
            css += '}\n';
        }

        this.siblings.forEach(function (sibling) {
            css += sibling.getCSS();
        });

        return css;
    };

    Layer.prototype.getHTML = function () {
        var html = '',
            content = '',
            attributes = '';

        if (false === this.visible) {
            return '';
        }

        content += this.text
            .replace("\r", "<br />");

        this.siblings.forEach(function (sibling) {
            content += sibling.getHTML();
        });

        switch (this.tag) {
            case 'img':
                html += '\n<' + this.tag + ' id="' + this.cssId + '" src="' + this.structure.folders.images + this.fileName + '" />';
            break;

            case 'div':
                html += '\n<' + this.tag + ' id="' + this.cssId + '">' + content + '</' + this.tag + '>';
            break;

            case 'span':
                html += '\n<' + this.tag + ' id="' + this.cssId + '">' + content + '</' + this.tag + '>';

            break;
        }

        return html;
    };

    // Config should contain:
    // folder Obj
    // files Obj
    // document Obj - reference to the document
    // generator Obj - reference to the generator

    function Structure(config) {
        var _this = this;


        Object.keys(config).forEach(function (configKey) {
            _this[configKey] = config[configKey];
        })

        this.layers = [];
        this.html = '';
        this.css = '';
        this.psdPath = this.document.file;
        this.psdName = this.psdPath.substr(this.psdPath.lastIndexOf('/') + 1, this.psdPath.length);

        // Store IDs to ensure there is no collision between styles.
        this.cssIds = [];

        this.imagesQueue = [];

        this.styles = {
            globalLight: {
                angle: this.document._get('globalLight.angle', 118),
                altitude: 0
            }
        };

        // This is the top most parent of the document. 
        // Catch all traversal that arrive here.
        this.parent = {
            css: parseCSS({}, this.styles, {}),
            cssId: 'global',
        };

        this.header = '<!DOCTYPE html>' +
            '<head>' +
            '<link rel="stylesheet" href="style.css">' +
            '</head>' +
            '<body>';
        
        this.footer = '</body></html>';

        // Set listeners.
        this.events = new events.EventEmitter();
        this.events.on('finishedImage', function (event) {
            _this.finishedImage();
        });
    }

    Structure.prototype.finishedImage = function () {
        console.log('Finished an image');
        this.nextImage();
    };

    Structure.prototype.createLayers = function (storage, layers) {
        var _this = this,
            enteredClippingMask = false;

        layers.forEach(function (layer, index) {
            var cssOverwrites = {},
                clippingMask = false;

            // Ignore masks for now!
            // TODO: Do not ignore masks.
            if (true !== layer._get('mask.removed', false)) {
                if (true === layer._get('mask.extendWithWhite', false)) {
                    // Continue, this is partialy supported.
                } else {
                    return;
                }
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

            storage.push(new Layer(_this, layer, cssOverwrites, clippingMask));
        });
    };

    Structure.prototype.linkLayers = function () {

        function linkLayers(layers, parent) {

            layers.forEach(function (layer, index) {

                layer.parent = parent;

                if (0 < index) {
                    layer.prev = layers[index - 1];
                }

                if (layers.length > index + 1) {
                    layer.next = layers[index + 1];
                }
     
                linkLayers(layer.siblings, layer);
            });
        }

        linkLayers(this.layers, this.parent);
    };

    Structure.prototype.refreshCode = function () {
        var _this = this;

        // Reset html and css
        this.html = "";
        this.css = "";

        this.layers.forEach(function (layer) {
            _this.html += layer.getHTML();
            _this.css += layer.getCSS();
        });

        this.html = this.header + this.html + this.footer;
    };

    Structure.prototype.saveToJSON = function () {

        fs.writeFileSync(this.files.document, stringify(this.document));
        fs.writeFileSync(
            this.files.structure, 
            stringify(this, ['parent', 'prev', 'next', 'document', 'generator', 'structure'])
        );

        console.log('Saved raw document to "' + this.files.document + '"');
        console.log('Saved parsed structure to "' + this.files.structure + '"');
    };

    Structure.prototype.output = function () {
        fs.writeFileSync(this.files.html, this.html);
        fs.writeFileSync(this.files.css, this.css);
        console.log('Index.html and style.css were created.');
    };

    Structure.prototype.generateImages = function () {
        var _this = this;

        function generateImages(layers) {

            layers.forEach(function (layer) {
                
                if ('img' === layer.tag) {
                    
                    // TODO: Add a layer hashsum at the end of the layer to ensure that
                    // if the layer has changed then the image should be regenerated as well.
                    
                    layer.fileName = _this.psdName + '_' + layer.parent.cssId + '_' + layer.cssId + '.png';
                    layer.filePath = _this.folders.images + layer.fileName;

                    if (true === fs.existsSync(layer.filePath)) {

                        // The image already exists. No need to regenerate it.

                    } else {

                        _this.imagesQueue.push({ 
                            id: layer.id, 
                            filePath: layer.filePath
                        });

                    }
                }

                if (0 !== layer.siblings.length) {
                    generateImages(layer.siblings);
                } else {
                    // The no further siblings must be checked for images.
                }
            });
        
        }

        generateImages(this.layers);

        // Being exporting images.
        this.nextImage();
    };

    Structure.prototype.nextImage = function () {
        var _this = this,
            imageData;

        if (0 === this.imagesQueue.length) {

            console.log('All images have been generated.');

        } else {

            // FIFO
            imageData = this.imagesQueue.shift();

            this.generator.getPixmap(this.document.id, imageData.id, {}).then(
                function(pixmap){
                    savePixmap(pixmap, imageData.filePath, _this.events);
                },
                function(err){
                    console.error("Pixmap error:", err);
                }
            ).done();
        }
    };

    Structure.prototype.generateCssIds = function () {
        var _this = this;

        function generateCssIds(layers) {

            layers.forEach(function (layer, index) {

                layer.cssId = layer.parent.cssId + '-'
                    + layer.name
                        .replace(/&/, '')
                        .replace(/^\//, 'a')
                        .replace(/^[0-9]/g, 'a')
                        .replace(/\s/g, '-')
                        .replace(',', '-')
                        .replace('/', '');

                if (-1 === _this.cssIds.indexOf(layer.cssId)) {
                    // The ID is unique and can be used.
                } else {
                    layer.cssId += index;
                }

                _this.cssIds.push(layer.cssId);

                if (0 < layer.siblings.length) {
                    generateCssIds(layer.siblings);
                }
            });
        }

        generateCssIds(this.layers);
    };

    function runGenerator(document, generator) {
        var structure = new Structure({
            folders: {
                images: path.resolve(__dirname, 'images/') + '/'
            },
            files: {
                html: path.resolve(__dirname, 'index.html'),
                css: path.resolve(__dirname, 'style.css'),
                document: path.resolve(__dirname, 'document.json'),
                structure: path.resolve(__dirname, 'structure.json')
            },
            document: document,
            generator: generator
        });        

        structure.createLayers(structure.layers, structure.document.layers);
        structure.linkLayers();

        structure.generateCssIds();
        structure.generateImages();

        structure.saveToJSON();

        structure.refreshCode();

        structure.output();
    }

    // Verificarea de float este simpla:
    // - Daca un element incepe de la marginea unui container
    // - Daca un element nu incepe de la marginea unui container dar are acceasi distanta
    // de sus ca unul care incepe de la marginea unui container
    // - Daca un element este intre alte elemente care au aceeasi distanta intre ele
    // si unul dintre elemente incepe de la marginea unui container
    // - 

    /*
    function findFloatables(layers, type) {
        var flotables = [],
            firstElementsInRow = [],
            disposeFloatables = false,
            marginColumn,
            marginRow;

        if (1 < layers.length) {

            // Order layers by left alignment
            layers.sort(function (left, right) {
                return left.properties.parsedCSS.left > right.properties.parsedCSS.left;
            });

            // Order layers by top down alignment
            layers.sort(function (left, right) {
                return left.properties.parsedCSS.top > right.properties.parsedCSS.top;
            });

            // Clone array
            layers.forEach(function (layer) {
                flotables.push(layer);
            });

            /*
            // Find the layers that have the same top
            flotables = flotables.filter(function (layer) {
                if (flotables[0].properties.parsedCSS.top === layer.properties.parsedCSS.top) {
                    return true;
                }
            });
           

            // Calculate the necessary margin for all floated layers
            marginColumn =  flotables[1].properties.parsedCSS.left - 
                    (flotables[0].properties.parsedCSS.left +
                    parseInt(flotables[0].properties.parsedCSS.width));

            console.log("MarginColumn: " + marginColumn);
            // The first element of each row must not have margins
            firstElementsInRow.push(flotables[0].id);
            console.log(firstElementsInRow);

            // Find the margin between other layers
            flotables = flotables.filter(function (layer, index) {
                var prev = flotables[index - 1],
                    value;

                // If a flotable candidate did not conform with the margin
                // then all following canditates are also not floated.
                if (true === disposeFloatables) {
                    return false;
                }

                if (undefined !== prev) {
                    // If floated cantidate is on a different row.
                    if (prev.properties.parsedCSS.top !== layer.properties.parsedCSS.top) {
                        firstElementsInRow.push(layer.id);

                        // Calculate the bottom margin of the above row
                        marginRow = layer.properties.parsedCSS.top -
                            (parseInt(flotables[0].properties.parsedCSS.height) +
                            flotables[0].properties.parsedCSS.top);

                        return true;
                    }

                    value = 
                        layer.properties.parsedCSS.left - 
                        (prev.properties.parsedCSS.left +
                        parseInt(prev.properties.parsedCSS.width));

                    console.log(layer.properties.parsedCSS.left + " vs " + prev.properties.parsedCSS.left + " vs " + prev.properties.parsedCSS.width);
                    console.log("Value: " + value);
                    if (value === marginColumn) {
                        return true;
                    } else {
                        disposeFloatables = true;
                        return false;
                    }
                } else {
                    return true; // The first floated element which is also reference.
                }
            });

            console.log('Found ' + flotables.length + ' ' + type + ' floatable elements.');
        }

        return {
            elements: flotables,
            marginColumn: marginColumn,
            marginRow: marginRow,
            firstElementsInRow: firstElementsInRow
        };
    }*/

    exports.init = init;

}());