/** ----------------------------------
 * GeneratorX
 * @author Constantin Dumitrescu
 * @author Bogdan Matei
 * @company Brandup
 * @version 0.1.0
 * -----------------------------------
 * 
 * The GeneratorX has 8 stages:
 *  1. Parse the PSD exported document 
 *  2. Generate images for bitmap PSD layers
 *  3. From the absolute styles, connections between elements will emerge (e.g. floats, overlay, etc)
 *  4. Establish the logical order of dom elements (based on float, etc)
 *  5. Find patterns in styles through css duplication, hierachy and inheritance to optimise the css creation
 *  7. Export the generated HTML and CSS into files
 *
 *
 * @TODO: If the designer has his Types and Rulers in anything else 
 *     than pixels, all values must be converted before using. 
 *     Defaults: types (points) rulers (in?)
 *     
 * @TODO: Retrieve the GenX PSD Test File as an image for left to right comparison.
 *
 * @TODO: It seems that sometimes when you leave PSD for a long time opened (observed behaviour),
 *       all new bitmap layers that you create are not exported to files. Investigate further.
 *
 * @TODO: In the CFG case study there is a layer which makes the image creation system crash.
 * Generated: /Users/constantin/Sites/generatorx/test/plugins/generatorx/images/CFG_Dropbox_FINAL_psd_global-ClientChallenge-leafs_left_global-ClientChallenge-leafs_left-Layer-7-copy-10.png
 * (the layer after the above layer)
 * Assertion failed: (!ctx->write_in_progress_ && "write already in progress"), function Write, file ../src/node_zlib.cc, line 124.
 * [1]    48523 abort      node app -f test/plugins
 */

(function () {
    "use strict";

    var 
        fs = require('fs'),
        path = require('path'),
        PNG = require('pngjs').PNG,
        events = new require('events'),
        sizeOf = require('image-size'),
        jsdom = require("jsdom"),
        Wordpress = require('./wordpress');

    //
    // Has method
    // Will provide a response for a chain of Object properties
    // e.g: x.has('one.of.these.properties');
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

    //
    // getValueOf
    // Retrieves the value of a chained Object properties
    //
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

    function isNumber(value) {
        if ((undefined === value) || (null === value)) {
            return false;
        }
        if (typeof value == 'number') {
            return true;
        }
        return !isNaN(value - 0);
    }

    /**
     * Convert camelCase strings to hyphen separated words.
     *
     * @param  {string} name The camelCase words.
     * @return {string}      The hyphen separated words
     */
    function convertFromCamelCase(camelCaseWords) {
        return camelCaseWords.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
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

    /**
     * Creates an instance of Layer.
     * 
     * A Layer instance is the representation of a parsed PSD layer. It will generate
     * the CSS and HTML code necessary to display the PSD layer. Also will provide 
     * information to other Layers or Parent Layers for proper boundry detection and
     * optimal CSS output.
     *
     * @constructor
     * @this {Layer}
     * @param {Structure} structure The Structure instance that stores this layer
     * @param {JSON} layer The exported JSON data from PSD that comprises a layer
     * @param {clippingMask} clippingMask True if the current layer has other clipping
     *                                    layers before it and needs to be exported 
     *                                    as an image.
     *                                                                   
     * @return {Layer} The Layer instance for chaining.
     */
    function Layer(structure, layer, clippingMask) {
        var _this = this,
            parsedCSS;

        this.layer = layer;
        this.id = layer.id;

        // Internal layers (@see Structure constructor) can have this property.
        if (undefined !== layer.cssId) {
            this.cssId = layer.cssId;
        }

        // Sibling Layers follow the PSD folder hierachy. Sibling Layers will
        // be nested HTML elements and the current Layer will be their parent.
        this.siblings = [];

        // Hidden layers don't need to be shown/included in the output HTML/CSS.
        // An exception will be when Semantic Tagging will enable interactive 
        // elements like hover, tab, etc.
        this.visible = layer.visible;

        this.name = layer.name;
        this.index = layer.index;
        this.type = layer.type;
        this.text = '';
        this.structure = structure;
        this.bounds = layer.bounds;

        // Will get all possible CSS styles. This is similar to viewing
        // the "computed" Inspector tab.
        this.parseCSS();

        switch (layer.type) {

            // layer.type = "layerSection" means the layer is a Group in PSD
            case 'layerSection':

                this.tag = 'div';

            break;

            case 'shapeLayer':

                this.tag = 'div';

                // origin.type = 'unknown' means the shape does not have enough information
                // to represent it in CSS.
                if ('unknown' === layer._get('path.pathComponents[0].origin.type', 'shapeLayer')) {
                    this.tag = 'img';
                }

                // mask.removed = false means that it is a clipping or another
                // type of mask. Until support is made for such layers, it will be treated as an
                // image.
                if (true !== layer._get('mask.removed', false)) {
                    this.tag = 'img';
                }

                // fillEnabled = false means that the shape has a transparent
                // background but also might contain additional styles specific to
                // shapeLayers that are not yet supported.
                // 
                // @TODO: Add support for shapeLayer strokeStyles.
                if (false === layer._get('strokeStyle.fillEnabled', true)) {
                    this.tag = 'img';
                }

                // pathComponents > 1 means the shapeLayer is composite and will require
                // additional HTML elements to produce it OR be resolved through SVG.
                // 
                // @TODO: Generate the shapeLayer by parsing the pathComponents and creating
                // for each pathComponent a new layer.
                if (1 < layer._get('path.pathComponents', []).length) {
                    this.tag = 'img';
                }

            break;

            case 'textLayer':
                // @TODO: Decide if the text element should be a <span> or a <p>
                this.tag = 'span';
                this.parseText();
            break;

            // layer.type = 'layer' means the layer is a bitmap in PSD
            case 'layer':
                this.tag = 'img';
            break;

            default: 
                console.log('The layer type "' + layer.type + '" is no recognised.');
            break;
        }

        // @TODO: Make clipping mask layers work as overflow:hidden and have
        // all other layers be generated as siblings of the current layer. 
        if (true === clippingMask) {
            this.tag = 'img';
        }
        
        if ('img' === this.tag) {

            // Disactivate all FX from the element. 
            // These will be exported as a bitmap from PSD anyway.
            this.css.boxShadow.active = false;
            this.css.background.active = false;
            this.css.border.active = false;

            // Used for estimated the real boundries of the element 
            // inside the generated FX image.
            // @see Structure.refreshImageBoundries
            if (undefined !== layer.boundsWithFX) {
                this.boundsWithFX = layer.boundsWithFX
            }
        }

        // Create the nested Layers.
        if (undefined !== layer.layers) {
            structure.createLayers(this.siblings, layer.layers);
        }

        return this;
    };

    Layer.prototype.createBoxShadow = function(shadowStyles, shadowType, elementType) {
        var property = "",
            shadow = shadowStyles[shadowType],
            angle = 0 < shadow.angle ? shadow.angle : 360 + shadow.angle,
            // 91 is so that the substraction does not result in 0;
            normalisedAngle = angle - 90 * Math.floor(angle / 91),
            x,
            y,
            percent; 

        if (-1 === ['outerGlow', 'innerGlow'].indexOf(shadowType)) {
            
            // @TODO: Accomodate for the chokeMatte property
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

        // @TODO: For outer glows, create the use case for gradient usage instead
        // of solid color.

        property += Math.round(x) + 'px ' + Math.round(y) + 'px ';
    
        // @TOOD: Establish the relation between innerGlow parameters (chokeMatte and size) and
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
    };

    /**
     * Creates the output ready text from the exported PSD text including
     * inline elements that describe styles applied on ranges.
     * 
     * PSD defines ranges of chars [x -> y] that can have distinct
     * styles. These are inserted into span, strong, em as needed.
     * 
     * @return {Layer} The Layer instance for chaining.
     */
    Layer.prototype.parseText = function() {
        var text = this.layer._get('text.textKey', ''),
            transformedText = '',
            textRanges = this.layer._get('text.textStyleRange', []),
            lastParsedIndex = 0;

        if (1 === textRanges.length) {
            // If there is just one text range that means the text
            // is uniform.
        } else {

            // @TODO: First select distinct textRanges and then begin to parse them.
            // This is due to the fact that some textRanges are comprised from
            // redundant textRanges.

            textRanges.forEach(function (range) {
                var extractedText = text.substr(range.from, range.to - range.from),
                    styles = "",
                    fontFamily = range.textStyle.fontName.toLowerCase(),
                    fontVariant = range.textStyle.fontStyleName.replace(/\s/g, '_').toLowerCase();

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

                // @TODO: Add the ability to combine bold, italic or 
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

        this.text = text;

        return this;
    };

    /**
     * Parse the raw data from Photoshop that describe the Layer
     * and formulate the CSS styles.
     * 
     * @return {Layer} The Layer instance for chaining.
     */
    Layer.prototype.parseCSS = function () {
        var style = this.layer,
            globalStyles = this.structure.globalStyles,
            css = {
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

        // @TODO: It seems that for shadows the 100% opacity is not 100% CSS opacity
        // but somewhere around 80%. Experiment with this and try to find a 
        // good approximation.
        
        // @TODO: Account for different blend modes for each style. This would be an 
        // advanced feature and would require a canvas to plot individual features
        // and an implementation of blend mode algorithms to obtain accurate CSS
        // values.

        // @TODO: Depending on the degree of accuracy the user requires, the layer can be
        // exported as an image to ensure that all FX styles are 100% accurate.

        // @TODO: Implement Radial Gradient
        
        // @TODO: Implement Angle Gradient

        // @TODO: Implement Drop shadow countour settings on layersEffects.dropShadow.transferSpec

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

        // The color array is in reverse order due to the way it is parsed added.
        css.background.gradient.colors.reverse();

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
            // @TODO: Implement strokeStyles for shape layers.
            // This can either be a new ::before / ::after element with
            // a transparent background and a border.
            // OR in some cases it might be an SVG.
        }

        if (false === style._get('strokeStyle.fillEnabled', true)) {
            css.background.active = false;
        }

        css.width = css.right - css.left;
        css.height = css.bottom - css.top;


        if ('textLayer' === style.type) {

            (function () { 
                var leading = style._get('text.textStyleRange[0].textStyle.leading', css.fontSize);

                if (leading < css.fontSize) {
                    leading = css.fontSize;
                }

                css.lineHeight = leading; 

                if (css.lineHeight > css.fontSize) {
                    css.top -= leading / 4;
                }

                // This will always be an approximation due to the different way Photoshop
                // and Web Browsers understand text. In short, there is a value called
                // sTypoAscender that gives the space above the basline text to accomodate
                // for the tallest character. Browsers add this value as inherent to line-height
                // while Photoshop dissregards this value. This means that if a text begins at
                // top: 50px in Photoshop it will actually begin at top: 53px in a Browser, the
                // 3px being the sTypeAscender the browser reserves for the laster glyph in that
                // font family. 
                // Although if you select a text in Photoshop, it will select it with the
                // sTypeAscender, just the bounding box does not accomodate it.
                // 
                // @TODO: find a way to read the sTypoAscender value from the font (or the OS if
                // it requires the text rendering engine) and add it as a negative top margin.

                // Estimated sTypeAscender calculation based on experimentation with different
                // font sizes.
                if (48 > css.fontSize) {
                    css.top -= (48 - css.fontSize) * 0.166;
                } else {
                    css.top -= (72 - css.fontSize) * 0.291;
                }

            }());

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

            // @TODO: Implement the WebKit algorithm to detect the real width of the 
            // text with all the layer styles. 
            // This should do the following:
            // 1. Parse the .ttf file
            // 2. Create the sequence of text vectors dictated by the .ttf rules
            // of binding characters
            // 3. Add the text transformation on the created sequence of vectors
            // 4. Extract the width pixel value from the vector implementation in 
            // bitmap environment.

            // @TODO: Adjust the estimated px value bellow that seems to accomodate
            // the difference between PSD and Browser text rendering.
            css.width = css.width + 10;
            css.height = 'auto';

            (function () {

                // Definitions:
                // boundingBox: the coordinates that wrap the text
                // bounds: the coordinates that wrap the user defined area for the text or 
                //      if the area wasn't defined by the user, the total area occupied 
                //      by the text which might be different than the boundingBox coordinates
                
                // It seems that the bounding box for text content is given by the
                // layer.text.textShape.char = "box" | "paint"
                // and
                // layer.text.textShape.bounds = { top | left | bottom | right }

                var bounds = style._get('text.bounds'),
                    boxBounds = style._get('text.boundingBox'),
                    boundsWidth = bounds.right - bounds.left,
                    boundsHeight = bounds.bottom - bounds.top,
                    boxBoundsWidth = boxBounds.right - boxBounds.left,
                    boxWidthDifference = boxBoundsWidth - boundsWidth;

                // From inital experimentation the difference between the bounds
                // when not having a user defined area is within a 10 px range.
                // Of course, this is empiric evidence and needs further research.
                // Also, an area that is less than 10 px from the text occupied
                // area, leaves little room for alignment (which is in fact
                // the goal of this function). If the desiner did create a less than 10 px
                // container for the text then this might be a bad practice to do
                // so.

                if (6 > Math.abs(boxWidthDifference)) {
                    // The text does not have a defined area and can be align to the left (default)
                    css.textAlign = 'left';

                } else {

                    // The text has a defined area and needs to be further
                    // wrapped in a parent container element.
                    css.width = boundsWidth;
                    css.height = boundsHeight;
                    css.left -= Math.ceil(boxBounds.left);
                }

            }());
        }

        css.position = 'absolute';

        // Borders require adjustments to top, left, width and height depending on the
        // selected boxSizing.
        if (true === css.border.active) {
            
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

        this.css = css;

        return this;
    };

    /**
     * Create a CSS property that will be added to the style list
     * of a CSS selector
     * 
     * @param  {string} name The name of the CSS property of that belongs to
     *                       the Layer instance.
     * @return {object}      The fully generated CSS property for the element and the
     *                           necessary before pseudo-element supplimentary property.
     */
    Layer.prototype.getCSSProperty = function (name) {
        var _this = this,
            property = convertFromCamelCase(name) + ': ',
            value = this.css[name],
            // The CSS property pseudo-element ::before 
            before = '';

        switch (name) {
            case 'top':
                if (isNumber(value)) {
                    // Convert from absolute top to relative to parent top.
                    property += Math.round(value) - Math.round(this.parent.css.top) + 'px';
                } else {
                    property += value;
                }
            break;
            
            case 'right':
                property += 'auto';
            break;
            
            case 'bottom':
                property += 'auto';
            break;

            case 'left':
                if (isNumber(value)) {
                    // Convert from absolute top to relative to parent left.
                    property += Math.round(value) - Math.round(this.parent.css.left) + 'px';
                } else {
                    property += value;
                }
            break;

            case 'position':
                property += value;
            break;

            case 'marginTop':
                property += Math.round(value) + 'px';
            break;

            case 'marginLeft':
                property += Math.round(value) + 'px';
            break;

            case 'marginRight':
                property += Math.round(value) + 'px';
            break;

            case 'marginBottom':
                property += Math.round(value) + 'px';
            break;

            case 'paddingTop':
                property += Math.round(value) + 'px';
            break;

            case 'paddingLeft':
                property += Math.round(value) + 'px';
            break;

            case 'paddingRight':
                property += Math.round(value) + 'px';
            break;

            case 'paddingBottom':
                property += Math.round(value) + 'px';
            break;

            case 'verticalAlign':
                property += value;
            break;

            case 'width':
                
                if ('auto' !== value) {
                    if (0 < value && 1 > value) {
                        value = 1;
                    }

                    property += Math.round(value) + 'px';
                } else {
                    property += value;
                }

            break;

            case 'height':
                
                if ('auto' !== value) {
                    if (0 < value && 1 > value) {
                        value = 1;
                    }

                    property += Math.round(value) + 'px';
                } else {
                    property += value;
                }

            break;

            case 'background':

                if (true === value.active && true === value.masterActive) {

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

                    } else if (undefined !== value.color.red) {
                        property += 'rgb('
                            + Math.round(value.color.red) + ', '
                            + Math.round(value.color.green) + ', '
                            + Math.round(value.color.blue)
                            + ')';
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

            // BoxSizing is used for properly showing Stroke accoring to PSD settings.
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
                        before += Math.ceil(bound) + 'px ';
                    });
                }

                // @TODO: Differentiate between shapeLayer types roundedRect, ellipse.

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
                        
                        // Overwrite the property name to text-shadow.
                        if ('textLayer' === _this.type) {
                            property = 'text-shadow: ';
                        }

                        ['outerGlow', 'innerGlow'].forEach(function (glowType) {
                            if (true === value[glowType].active) {
                                before += _this.createBoxShadow(value, glowType, _this.type);
                            }
                        });


                        ['outer', 'inset'].forEach(function (shadowType) {
                            if (true === value[shadowType].active) {
                                property += _this.createBoxShadow(value, shadowType, _this.type);
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
                    property += value.variant.replace(/\s/g, '_').toLowerCase();
                }
               
            break;

            case 'display':

                property += value;

            break;

            default: 
                console.log('CSS property "' + name + '" is not regonized.');
            break;
        }

        return {
            property: property,
            before: before
        };
    };

    /**
     * Generates the Layer CSS code.
     * 
     * @return {string} The full style with Layer Selector and style body.
     */
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

            css += '\t' + parsedCSS.property + ';\n';

            if ('' !== parsedCSS.before) {
                if ('boxShadow' === property && 'textLayer' === _this.type) {
                    before += '\ttext-shadow: ' + parsedCSS.before + ';\n';
                } else {
                    before += '\t' + convertFromCamelCase(property) + ': ' + parsedCSS.before + ';\n';
                }
            }
            
            // Implementing certain styles require additional rules based
            // on the type of the element and the property being styled
            if ('textLayer' === _this.type && 'background' === property) {
                // @TODO: Fix gradient opacity on for text layers.
                // css += '\t' + '-webkit-background-clip: text;\n';
                // css += '\t' + '-webkit-text-fill-color: transparent;\n';
            }

            if ('textLayer' === _this.type && 'fontFamily' === property) {
                addFont = _this.css[property].family;
            }

        });

        css += '}';

        // @TODO: If the font was already added do not add it again.

        css += getCSSFontFamily(addFont);

        if ('' !== before) {
            css += '\n#' + this.cssId + '::before {\n';
            
            if ('' !== this.text) {
                css += '\tcontent: "' 
                    + this.text
                        .replace(/\r/g, ' \\A ')
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

    /**
     * Generates the Layer HTML code.
     * 
     * @return {string} The fully generated HTML code.
     */
    Layer.prototype.getHTML = function () {
        var _this = this,
            html = '',
            content = '',
            attributes = '',
            src = '';

        if (false === this.visible) {
            return '';
        }


        // If the section (Group PSD folder) is empty there is no reason to add
        // the html element.
        if ('layerSection' === this.type && 0 === this.siblings.length) {
            return '';
        }

        content += this.text.replace(/\r/g, '<br />');

        this.siblings.forEach(function (sibling) {
            content += sibling.getHTML();
        });

        if (undefined !== this._get('wordpress.url')) {
            content = '<a href="' + this._get('wordpress.url') + '">' + content + '</a>';
        }

        src = this._get('structure.wordpress.folders.images', this.structure.folders.images) + this.fileName;

        switch (this.tag) {
            case 'img':
                html += '\n<' + this.tag + ' id="' + this.cssId + '" src="' + src + '" />';
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

        this.psdPath = this.document.file;
        this.psdName = this.psdPath.substr(this.psdPath.lastIndexOf('/') + 1, this.psdPath.length);

        // Store IDs to ensure there is no collision between styles.
        this.cssIds = [];

        // Image generation properties.
        this.imagesQueue = [];
        this.generatingImage = false;
        this.currentGeneratedImage = {};

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
            type: 'layerSection'
        }, false);

        this.header = '<!DOCTYPE html>' +
            '<head>' +
            '<link rel="stylesheet" href="style.css">' +
            '</head>' +
            '<body>';
        
        this.footer = '</body></html>';

        // Instantiate an internal event system.
        this.events = new events.EventEmitter();

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
                        .replace(/,/g, '-')
                        .replace(/\//g, '')
                        .replace(/\./g, '-');

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

        // Recursive function.
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

        this.html = '';
        this.css = '';

        this.parent.siblings.forEach(function (layer) {
            _this.html += layer.getHTML();
            _this.css += layer.getCSS();
        });

        this.html = this.header + this.html + this.footer;

        return this;
    };

    /**
     * Write the HTML and CSS code to files.
     * Needs Structure.refreshCode called before to output the
     * PSD HTML and CSS version.
     *
     * @return {Structure}  The Structure instance for chaining.
     */
    Structure.prototype.outputCode = function () {
        var _this = this;

        fs.writeFileSync(this.files.html, this.html);
        fs.writeFileSync(this.files.css, this.css);

        console.log('Index.html and style.css were created.');

        return this;
    };

    Structure.prototype.outputToWordpress = function () {
        var _this = this;

        this.wordpress = new Wordpress({
            folders: this.folders,
            layers: this.parent.siblings
        });

        this.wordpress
            .parseLayers()
            // .create('menu')
            // .create('pages')
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
                        }

                        layer.css.left -= minusLeft;
                        layer.css.top -= minusTop;

                        layer.css.width = realImageSize.width;
                        layer.css.height = realImageSize.height;

                        layer.css.right = layer.css.left + layer.css.width;
                        layer.css.bottom = layer.css.top + layer.css.height;
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

    Structure.prototype.optimiseCode = function () {

        function isInner(container, innerTest) {
            if (
                container.css.top < innerTest.css.top
                && container.css.left < innerTest.css.left
                && container.css.right > innerTest.css.right
                && container.css.bottom > innerTest.css.bottom
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
            var nextLayer,
                prevLayer,
                elements = [];

            if (undefined === layers) {
                layers = [];

                nextLayer = layer.next;
                prevLayer = layer.prev;

                while (undefined !== nextLayer) {
                    layers.push(nextLayer);
                    nextLayer = nextLayer.next;
                }

                while (undefined !== prevLayer) {
                    layers.push(prevLayer);
                    prevLayer = prevLayer.prev;
                }
            }

            layers.forEach(function (verifyLayer) {
                var innerElements = [];
                if ('layerSection' === verifyLayer.type) {
                    // Search inside the section.
                    innerElements = findElements(layer, isPosition, verifyLayer.siblings);
                    elements = elements.concat(innerElements);
                    return;
                }

                if(isPosition(layer, verifyLayer)) {
                    elements.push(verifyLayer);
                }
            });

            return elements;
        }

        // Redo the hierachies based on the actual location of elements
        // and not on the PSD order (Just as a Developer would do)

        // The slice is create a copy to ensure that the moving
        // of layers will not affect the loop.

        function moveLayers(layers) {
            layers.slice().forEach(function (layer) {
                var innerElements,
                    outerElements;
                
                if ('layerSection' === layer.type) {
                    moveLayers(layer.siblings);
                    return;
                }

                innerElements = findElements(layer, isInner);
                // outerElements = findElements(layer, isOuter);

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

                    layer.siblings.push(element);
                });
            });
        }

        moveLayers(this.parent.siblings);

        // @TODO Find floats.

        // Consider margin collapsation.

        // We cannot use the clearfix attribute because we might need sometime to 
        // use the before, after for styling.
        
        // Use inline-block instead of floats.

        // Order elements based on their left to right order.


        function orderByRow(siblings) {

            log(siblings, 'row started');

            siblings.sort(function (left, right) {
                if (left.css.top > right.css.top) {
                    return true;
                } else {
                    return false;
                }
            });

            siblings.forEach(function (sibling) {
                if (0 < sibling.siblings.length) {
                    orderByRow(sibling.siblings);
                }
            });

            log(siblings, 'row finished');
        }

        function log(siblings, logName) {
            var order = '[';
            siblings.forEach(function (sibling) {
                order += sibling.name + ' ';
            });
            order += ']';

            console.log (logName + ' the order is ' + order);
        }

        function orderByColumn(siblings) {
            var sibling,
                tempSibling,
                currentSibling,
                lastTop,
                index = 0,
                counter,
                rowIndex;

            log(siblings, 'column started');

            while (index !== siblings.length) {
                
                if (1000 < counter) {
                    break;
                }
                counter += 1;
                
                if (undefined !== siblings[index - 1] && lastTop === siblings[index - 1].css.top &&
                    lastTop === siblings[index].css.top) {
                    if (siblings[index - 1].css.left > siblings[index].css.left) {
                        tempSibling = siblings[index - 1];
                        siblings[index - 1] = siblings[index];
                        siblings[index] = tempSibling;
                        index -= 2;
                    }
                } else if (rowIndex !== index) {
                    // We record as a new row and wait for the next element.
                    lastTop = siblings[index].css.top;
                    rowIndex = index;
                }

                index += 1;
            }


            log(siblings, 'column finished');

        }

        orderByRow(this.parent.siblings[0].siblings);
        orderByColumn(this.parent.siblings[0].siblings);

        this.linkLayers();


        // The first element is now the top most left most element from which we can extract 
        // the paddings.
        var bg = this.parent.siblings[0];
        bg.css.paddingLeft = bg.siblings[0].css.left - bg.css.left;
        bg.css.paddingTop = bg.siblings[0].css.top - bg.css.top;

        this.parent.siblings[0].siblings.forEach(function (sibling) {
            if (undefined !== sibling.prev) {

                if (sibling.prev.css.top === sibling.css.top) {
                    sibling.css.marginLeft = sibling.css.left - sibling.prev.right;
                } else {

                }

            }

            sibling.css.top = 'auto';
            sibling.css.left = 'auto';
            sibling.css.position = 'static';
            sibling.css.display = 'inline-block';
        });

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

    /**
     * Call GeneratorX to parse the document and output the HTML and CSS files.
     * @param  {JSON} document  The PSD exported data
     * @param  {Generator} generator The reference to the Adobe Generator
     * @return {undefined}
     */
    function runGenerator(document, generator) {
        var structure = new Structure({
            folders: {
                images: path.resolve(__dirname, 'wordpress/images/') + '/',
                wordpress: path.resolve(__dirname, 'wordpress/') + '/'
            },
            files: {
                html: path.resolve(__dirname, 'index.html'),
                css: path.resolve(__dirname, 'style.css'),
                document: path.resolve(__dirname, 'document.json'),
                structure: path.resolve(__dirname, 'structure.json')
            },
            wordpress: {},
            document: document,
            generator: generator
        });

        structure.events.on('imagesFinished', function () {

            structure
                .refreshImageBoundries()
                .refreshParentBoundries()
                // .optimiseCode()
                .saveStructureToJSON()
                .refreshCode()
                // .outputCode();
                .outputToWordpress();

            // All work is done and can safely exit.
            // process.exit(0);
        });     

        structure
            .createLayers(structure.parent.siblings, structure.document.layers)
            .linkLayers()
            .generateCssIds()
            .queueImagesForGeneration()
            .startImageGeneration();
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


    // Init
    exports.init = function (generator) {
        
        generator.getDocumentInfo().then(

            function (document) {
                runGenerator(document, generator);
            },
            
            function (err) {
                console.error(" Error in getDocumentInfo:", err);
            }

        ).done();    
    };

}());