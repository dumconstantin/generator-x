var ConventionParser = require('./ConventionParser.js');
var fs = require('fs');
var path = require('path');

/*
console.filter = function (obj) {
    if ('xText' === obj.name) {
        return true;
    } else {
        return false;
    }
};
*/

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
    var _this = this;

    this.layer = layer;
    this.id = layer.id;

    // Internal layers (@see Structure constructor) can have this property.
    if (undefined !== layer.cssId) {
        this.cssId = layer.cssId;
    }

    // Sibling Layers follow the PSD folder hierachy. Sibling Layers will
    // be nested HTML elements and the current Layer will be their parent.
    this.siblings = [];

    // Will hold the modifiable css for the element used for its own rendering
    this.css = {};

    // Dimensions will be used by children elements to figure out where they are 
    // and if they exceed the parent's boundries.
    this.dimensions = {};

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


    // To store the resulted CSS.
    this.cssClasses = [];
    this.parsedCss = {};
    this.initialCss = {};
    this.beforeElement = {};
    this.afterElement = {};
    this.html = '';

    //for integration process
    this.convention = new ConventionParser(this.name);
    this.integrationUsed = false;

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
            console.log('The layer type "' + layer.type + '" is no recognised for layer name ' + layer.name + '.');
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

        this.folder = structure.folders.images;
    }

    /*
     if (true === /^link/.test(this.name)) {
     this.tag = 'a';
     this.href = this.name.substr(this.name.indexOf('.') + 1, this.name.length);
     }
     */

    // Create the nested Layers.
    if (undefined !== layer.layers) {
        structure.createLayers(this.siblings, layer.layers);
    }

    return this;
};


Layer.prototype.getLayerId = (function () {
    var inc = 0;

    return function () {
        inc += 1;
        return inc;
    };
}());

/**
 * Find a layer by its layer name.
 * @param  {string | regexp} searchTerm The search term
 * @return {array}            The results array
 */
Layer.prototype.find = function (searchTerm) {
    var query = new RegExp(searchTerm),
        result = [];

    function searchIn(siblings) {
        siblings.forEach(function (sibling) {
            if (true === query.test(sibling.name)) {
                result.push(sibling);
            }

            searchIn(sibling.siblings);
        });
    }

    searchIn(this.siblings);

    return result;
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
                fontFamily = range.textStyle.fontName.replace(' ', ''),
                fontVariant = range.textStyle.fontStyleName;

            // For some reason Photoshop sometimes returns a duplicated
            // text range.
            if (lastParsedIndex === range.to) {
                return;
            }

            lastParsedIndex = range.to;

            styles += 'font-family: ' + fontFamily + '-' + fontVariant + ';';
            styles += 'font-size: ' + range.textStyle.size + 'px;';

            if (undefined !== range.textStyle.underline) {
                styles += 'text-decoration: underline;';
            }

            if (undefined !== range.textStyle.color) {
                var color = {
                    red: Math.round(range._get('textStyle.color.red', 0)),
                    green: Math.round(range._get('textStyle.color.green', 0)),
                    blue: Math.round(range._get('textStyle.color.blue', 0))
                };

                styles += 'color: rgb(' + color.red + ', ' + color.green + ', ' + color.blue + ');';
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
    var _this = this,
        style = this.layer,
        globalStyles = this.structure.globalStyles,
        css = {
            top: style._get('bounds.top', 0),
            right: style._get('bounds.right', 0),
            bottom: style._get('bounds.bottom', 0),
            left: style._get('bounds.left', 0),
            position: 'static',
            background: {
                masterActive: style._get('layerEffects.masterFXSwitch', true),
                fillActive: style._has('fill'),
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
                colorOverlay: {
                    active: style._get('layerEffects.solidFill.enabled', false),
                    opacity: style._get('layerEffects.solidFill.opacity.value', 100),
                    red: style._get('layerEffects.solidFill.color.red', 255),
                    green: style._get('layerEffects.solidFill.color.green', 255),
                    blue: style._get('layerEffects.solidFill.color.blue', 255)
                },
                // Background type (linear, radial, angle)
                type: style._get('layerEffects.gradientFill.type', 'linear'),
                fileSrc: null
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
            textAlign: style._get('text.paragraphStyleRange[0].paragraphStyle.align', 'left'),
            fontFamily: {
                family: style._get('text.textStyleRange[0].textStyle.fontName', 'Arial'),
                variant: style._get('text.textStyleRange[0].textStyle.fontStyleName', 'Regular')
            }
        },
        textColor;

    // Inner and outer shadows can opt to not use globalAngles and have
    // the default angle.
    if (true === style._get('layerEffects.innerShadow.useGlobalAngle', true)) {
        css.boxShadow.inset.angle = globalStyles.globalLight.angle;
    }

    if (true === style._get('layerEffects.dropShadow.useGlobalAngle', true)) {
        css.boxShadow.outer.angle = globalStyles.globalLight.angle;
    }


    // Add the font name
    css.fontFamily.fontName = css.fontFamily.family.replace(' ', '');

    // Trim native families
    if (-1 === ['Arial'].indexOf(css.fontFamily.family)) {
        css.fontFamily.fontName += '-' + css.fontFamily.variant;
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

    // Setting default values for padding to ensure positioning 
    // operations for siblings can be handled properly.
    css.paddingTop = 0;
    css.paddingBottom = 0;
    css.paddingLeft = 0;
    css.paddingRight = 0;

    // Setting default values for margin to ensure positioning 
    // operations for the element can be handled properly.
    css.marginTop = 0;
    css.marginBottom = 0;
    css.marginLeft = 0;
    css.marginRight = 0;

    if ('textLayer' === style.type) {

        (function () {
            var leading = style._get('text.textStyleRange[0].textStyle.leading', css.fontSize),
                bounds = style._get('text.bounds');

            if (leading < css.fontSize) {
                leading = css.fontSize;
            }


            /*
            if (css.lineHeight > css.fontSize) {
                css.top -= leading / 4;
            } */

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
                //css.top -= (48 - css.fontSize) * 0.166;
            } else {
                //css.top -= (72 - css.fontSize) * 0.291;
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
        css.width += 11;
        css.right += 11;
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
                textBounds = style._get('text.textShape[0].bounds', {}),
                textHeight = textBounds.bottom - textBounds.top,

                // Leading is the distance between the top edge of two consecutive rows.
                leading = style._get('text.textStyleRange[0].textStyle.leading', css.fontSize),

                boundsWidth = bounds.right - bounds.left,
                boundsHeight = bounds.bottom - bounds.top,
                boxBoundsWidth = boxBounds.right - boxBounds.left,
                boxBoundsHeight = boxBounds.bottom - boxBounds.top,
                boxWidthDifference = Math.floor(Math.abs(boxBoundsWidth - boundsWidth)),
                boxHeight = bounds.bottom + Math.abs(bounds.top),

                rowsNo = Math.round(((boxBoundsHeight + (leading - css.fontSize)) / (leading))); //style._get('text.paragraphStyleRange').length;


            // Logic for determining the line height and negative top 
            if (undefined !== textBounds.bottom) {
                boxHeight = (boundsHeight - textHeight) * 2 + boxBoundsHeight;
            } 

            var fontGutter = boxHeight - leading * (rowsNo - 1) - css.fontSize,
                lineHeight = css.fontSize + fontGutter,
                rowGutterNo = rowsNo === 1 ? rowsNo : rowsNo - 1,
                rowGutter = (boxHeight - (lineHeight * rowsNo)) / rowGutterNo,
                cssLineHeight = rowGutter + lineHeight,
                cssTop = css.top - rowGutter / 2 - fontGutter;

            css.top = cssTop;
            css.lineHeight = cssLineHeight;

            /*
            if ('zText' === _this.name) {
                console.log(_this.name);

                console.log('New rows ' + Math.round(((boxBoundsHeight + (leading - css.fontSize)) / (leading))));
                console.log('rowsNo ' + rowsNo);
                console.log('fontSize ' + css.fontSize);
                console.log('text bounds ' + JSON.stringify(textBounds));
                console.log('textHeight ' + textHeight);
                console.log('boundsHeight ' + boundsHeight);
                console.log('boxBoundsHeight ' + boxBoundsHeight);
                console.log('result ' + (boundsHeight - textHeight));
                console.log('boxHeight ' + boxHeight);
                console.log('leading ' + leading);
                console.log('fontGutter ' + fontGutter);
                console.log('lineHeight ' + lineHeight);
                console.log('rowGutterNo ' + rowGutterNo);
                console.log('cssLineHeight ' + cssLineHeight);
                console.log('cssTop ' + cssTop);
            }
            */


            var averageDifference = (css.fontSize / 12) * 2;

            // The boxWidthDifference comes with a minimum 3px difference.
            if (averageDifference < 3) {
                averageDifference = 3;
            }

            // The text does not have a box.
            // This means that the point where the user first clicked
            // will be used to manage the text's position.
            if (averageDifference >= boxWidthDifference) {

                if ('left' === css.textAlign) {
                    // css.left += boundsWidth / 2;
                } else if ('center' === css.textAlign) {
                    // css.left -= Math.round(Math.abs(bounds.left));

                    // There is a small difference between how text width is calculated
                    // when centering and the calculated left bounds.
                    // css.left -= (bounds.right - bounds.left) - (style._get('bounds').right - style._get('bounds').left);
    
                } else if ('right' === css.textAlign) {
                    // css.left -= Math.round(Math.abs(bounds.left));
                    // css.left -= (bounds.right - bounds.left) - (style._get('bounds').right - style._get('bounds').left);
                }
                
                css.textAlign = 'left';

            } else {

                // The text has a defined area and needs to be further
                // wrapped in a parent container element.
                // css.width = boundsWidth;
                //css.height = boundsHeight;
                
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
    this.initialCss = cloneObject(css);

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
        propertyName = convertFromCamelCase(name),
        property = '',
        parentValue = 0,
        value = this.css[name],
    // The CSS property pseudo-element ::before
        before = '';

    switch (name) {
        case 'top':
            if (isNumber(value)) {
                // Convert from absolute top to relative to parent top.

                if ('absolute' !== this.css.position) {
                    property += value + 'px';
                } else {

                    if (undefined !== this.parent.dimensions.top) {
                        parentValue = this.parent.dimensions.top;
                    } else {
                        parentValue = this.parent.css.top;
                    }

                    property += Math.round(value) - Math.round(parentValue) + 'px';
                }

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

                
                if ('absolute' !== this.css.position) {
                    property += value + 'px';
                } else {

                    if (undefined !== this.parent.dimensions.left) {
                        parentValue = this.parent.dimensions.left;
                    } else {
                        parentValue = this.parent.css.left;
                    }

                    property += Math.round(value) - Math.round(parentValue) + 'px';
                
                }
            } else {
                property += value;
            }
            break;

        case 'position':
            property += value;
            break;

        case 'marginTop':
            if (isNumber(value)) {
                property += Math.round(value) + 'px';
            } else {
                property += value;
            }
            break;

        case 'marginLeft':
            if (isNumber(value)) {
                property += Math.round(value) + 'px';
            } else {
                property += value;
            }
            break;

        case 'marginRight':
            if (isNumber(value)) {
                property += Math.round(value) + 'px';
            } else {
                property += value;
            }
            break;

        case 'marginBottom':
            if (isNumber(value)) {
                property += Math.round(value) + 'px';
            } else {
                property += value;
            }
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

            // @TODO: solidFill, colorFill and gradientFill are stacked on top of each other.
            // The order is gradient - topmost, colorFill - second and solidFill - last.
            // Based on the colors and opacity we need to compute the actual image being shown
            // and reproduce it in CSS.
            // If the solidFill is 100% opacity, that means, even though gradientFill and colorFill
            // are transparent, the end image will have 100% opacity. 
            // 
            // We need to:
            // 1) Order layers topmost, second and base
            // 2) Decide where the blending ends e.g. if the topmost layer is 100% opacity then
            // --- we discard the other layers
            // 3) If there is a blend require then use the gradient colors to decide how it will
            // be modified according to the bottom layer.
            // 4) Based on the blend create the styles.

            if ('img' === this.tag) {
                property += 'transparent';
            } else if (null !== value.fileSrc) {
                property += 'url(../' + value.fileSrc + ')';
            } else if (true === value.masterActive) {

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

                } else if (true === value.colorOverlay.active) {
                    property += 'rgba('
                        + Math.round(value.colorOverlay.red) + ', '
                        + Math.round(value.colorOverlay.green) + ', '
                        + Math.round(value.colorOverlay.blue) +', '
                        + (value.colorOverlay.opacity / 100).toFixed(2)
                        + ')';

                    if ('textLayer' === _this.type) {
                        propertyName = 'color';
                        console.log(propertyName + property);
                    }
                } else if (true === value.fillActive) {
                  property += 'rgb('
                        + Math.round(value.color.red) + ', '
                        + Math.round(value.color.green) + ', '
                        + Math.round(value.color.blue)
                        + ')';
                }

            } else {
                property += 'transparent';
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
                property += 'content-box'
            } else if ('insetFrame' === value) {
                property += 'border-box'
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

            if ('textLayer' === this.type && true === this.css.background.colorOverlay.active) {
                // Do not add a color value because this needs to be overwritten by the colorOverlay
                // property.
            } else if (0 !== Object.keys(value).length) {
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
                    propertyName = 'text-shadow';
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

            property += value.fontName;

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
        propertyName: propertyName,
        before: before
    };
};

/**
 * Generates the Layer CSS code.
 *
 * @return {string} The full style with Layer Selector and style body.
 */
Layer.prototype.generateCSS = function () {
    var _this = this,
        css = '',
        addFont = '',
        before = '';

    if (false === this.visible) {
        return '';
    }

    Object.keys(this.css).forEach(function (property) {
        var parsedCSS = _this.getCSSProperty(property);

        if ('' !== parsedCSS.property) {
            _this.parsedCss[parsedCSS.propertyName] = parsedCSS.property;
        }


        if ('' !== parsedCSS.before) {
            if ('boxShadow' === property && 'textLayer' === _this.type) {
                _this.beforeElement['text-shadow'] = parsedCSS.before;
            } else {
                _this.beforeElement[convertFromCamelCase(property)] = parsedCSS.before;
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
            addFont = _this.css[property].fontName;
        }

    });

    if ('' !== addFont && -1 === this.structure.fonts.indexOf(addFont) && undefined !== fonts[addFont]) {
        this.structure.fonts.push(addFont);
    }

    if (0 !== Object.keys(_this.beforeElement).length) {
 
        this.beforeElement.content = this.text
            .replace(/\r/g, ' \\A ')
            .replace(/[\s]+/g, ' ');

        this.beforeElement.display = 'block';
        this.beforeElement.width = '100%';
        this.beforeElement.height = '100%';
        this.beforeElement.position = 'absolute';
        this.beforeElement.top = 0;
        this.beforeElement.left = 0;
        this.beforeElement['white-space'] = 'pre';
        this.beforeElement.color = 'transparent';

    }

    if (0 !== this.siblings.length) {
        this.siblings.forEach(function (sibling) {
            sibling.generateCSS();
        });
    }

    return this;
};


/**
 * Get the concatenated version of the html with the siblings.
 * @return {[type]} [description]
 */
Layer.prototype.getHTML = function () {
    return this.html;
};

/**
 * Get the concatenated version of the css with the siblings.
 * @return {[type]} [description]
 */
Layer.prototype.getCSS = function () {
    var css = '',
        _this = this;

    css += '\n#' + this.cssId + ' {';
    
    Object.keys(this.parsedCss).forEach(function (cssProperty) {
        css += '\n\t' + cssProperty + ': ' + _this.parsedCss[cssProperty] + ';';
    });

    css += '\n}';

    if (0 !== Object.keys(this.beforeElement).length) {
        css += '\n#' + this.cssId + '::before {';

        Object.keys(this.beforeElement).forEach(function (cssProperty) {
            var value = _this.beforeElement[cssProperty];

            if ('content' === cssProperty) {
                value = '"' + value + '"';
            }

            css += '\n\t' + cssProperty + ': ' + value + ';';
        });

        css += '}';
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
Layer.prototype.generateHTML = function (local) {
    var _this = this,
        html = '',
        content = '',
        attributes = '',
        src = '',
        local = local || false,
        classes = this.cssClasses.join(' ');

    if (false === this.visible) {
        return this;
    }

    // If the section (Group PSD folder) is empty there is no reason to add
    // the html element.
    if ('layerSection' === this.type && 0 === this.siblings.length) {
        return this;
    }

    content += this.text.replace(/\r/g, '<br />');

    content.replace('–', '-');

    if (local)
    content = '{{ content }}';
    else
        this.siblings.forEach(function (sibling) {
            sibling.generateHTML();
            content += sibling.getHTML();
        });

    if (undefined !== this._get('wordpress.url')) {
        this.href = this._get('wordpress.url');
        // content = '<a href="' + this._get('wordpress.url') + '">' + content + '</a>';
    }


    // TODO: Implement Base64 encoding for smaller images.

    switch (this.tag) {
        case 'img':
            html += '\n<' + this.tag + ' id="' + this.cssId + '" class="' + classes + '" src="' + this.fileSrc + '" />';
            break;

        case 'div':
            html += '\n<' + this.tag + ' id="' + this.cssId + '" class="' + classes + '">' + content + '</' + this.tag + '>';
            break;

        case 'span':
            html += '\n<' + this.tag + ' id="' + this.cssId + '" class="' + classes + '">' + content + '</' + this.tag + '>';

            break;
        case 'a':
            html += '\n<a id="' + this.cssId + '" href="' + this.href + '.html" class="' + classes + '">' + content + '</a>';
            break;
    }

    this.html = html;

    return this;
};


Layer.prototype.getIntegration = function (plugin, element) {
    var _this = this,
        html = '',
        content = '',
        src = '',
        elements = plugin.elements,
        pluginLayer = plugin.layer;

    var result = {
        html: '',
        elements: {},
        plugins: {},
        contents: {}
    };

    if (false === this.layer.visible) {
        return result;
    }

    // If the section (Group PSD folder) is empty there is no reason to add
    // the html element.
    if ('layerSection' === this.type && 0 === this.siblings.length) {
        return result;
    }

    content += this.text.replace(/\r/g, '<br />');
    content.replace('–', '-');

    var elementTypes = Object.keys(elements);

    this.siblings.forEach(function (sibling) {

        if (elementTypes.indexOf(sibling.convention.extension) !== -1) {

            var siblingIntegration = sibling.getIntegration(plugin, sibling);

            content += '{{ '+pluginLayer.convention.extension+'.'+sibling.convention.extension+' }}';

            result.elements.merge(siblingIntegration.elements);

            result.elements[sibling.convention.extension] = siblingIntegration.html;

            result.plugins.merge(siblingIntegration.plugins);
            result.contents.merge(siblingIntegration.contents);

        }

        else if (sibling.convention.plugin !== null) {

            content += '{% '+pluginLayer.convention.extension+'.'+sibling.convention.extension+' %}';
            result.plugins[sibling.convention.extension] = sibling;

        } else {

            var siblingIntegration = sibling.getIntegration(plugin, element);

            content += siblingIntegration.html;

            result.elements.merge(siblingIntegration.elements);
            result.plugins.merge(siblingIntegration.plugins);
            result.contents.merge(siblingIntegration.contents);
        }

    });

    var contentPlaceholder = content;
    var imagePlaceholder = this.fileSrc;

    if (element
        && elements[element.convention.extension]
        &&  Object.keys(elements[element.convention.extension]).indexOf(this.convention.extension) !== -1) {
        contentPlaceholder = imagePlaceholder = '{{ '+pluginLayer.convention.extension+'.'+element.convention.extension+'.'+this.convention.extension+' }}';

        if (result.contents[pluginLayer.convention.extension+'.'+element.convention.extension+'.'+this.convention.extension] === undefined)
            result.contents[pluginLayer.convention.extension+'.'+element.convention.extension+'.'+this.convention.extension] = [];

        result.contents[pluginLayer.convention.extension+'.'+element.convention.extension+'.'+this.convention.extension].push(content || this.fileSrc);
    }

    switch (this.tag) {
        case 'img':
            html += '<' + this.tag + ' id=\'' + this.cssId + '\' src=\'' + imagePlaceholder + '\' />';
            break;

        case 'div':
            html += '<' + this.tag + ' id=\'' + this.cssId + '\'>' + contentPlaceholder + '</' + this.tag + '>';
            break;

        case 'span':
            html += '<' + this.tag + ' id=\'' + this.cssId + '\'>' + contentPlaceholder + '</' + this.tag + '>';

            break;
        case 'a':
            html += '<a id=\'' + this.cssId + '\' href=\'' + this.href + '.html\'>' + contentPlaceholder + '</a>';
            break;
    }

    result.html = html;

    return result;
};

module.exports = Layer;