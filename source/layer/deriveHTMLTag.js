'use strict'

/*

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
            if (true === layer._get('mask.removed', false)) {
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
*/

function deriveHTMLTag(layer) {
    return ''
}

module.exports = deriveHTMLTag
