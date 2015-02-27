'use strict'

/*
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

    return this; */

module.exports = function extractText(layer) {
	return ''
}