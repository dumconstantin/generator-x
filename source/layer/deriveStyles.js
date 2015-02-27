'use strict'

/*
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

        if (undefined !== style._get('text.boundingBox')) {

            css.width = style._get('text.boundingBox').right - style._get('text.boundingBox').left;
            css.right = css.left + css.width;
            
        }

        (function () {
            var leading = style._get('text.textStyleRange[0].textStyle.leading', css.fontSize),
                bounds = style._get('text.bounds');

            if (leading < css.fontSize) {
                leading = css.fontSize;
            }


            /*
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
        css.width += 31;
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
            css.bottom += rowGutter / 2 - fontGutter;
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

*/


module.exports = function deriveStyles(layer) {
	return {}
}