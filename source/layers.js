'use strict'

// Creates a layer object used to generate HTML and CSS based on 
// the linked PSD layer
var makeLayer = R.curry(function makeLayer(document, layer) {
	return {
        documentId: document.id
		, layerId: layer.id
		, layers: layer.layers.map(makeLayer(document))
		, id: require('node-uuid').v1()
		, text: require('./layer/deriveText.js')(document, layer)
		, HTMLAttributes: {
			classes: ''
			, id: ''
		}
		, HTMLTag: ''
		, afterElement: {}
		, beforeElement: {}
		, semantics: {}
		, styles: require('./layer/deriveStyles.js')(document, layer)
		, image: require('./layer/needsImage.js')(document, layer) ? require('./layer/createImage.js')(document, layer) : ''
	}
})

function layers(document) {
    return document.layers.map(makeLayer(document))    
}

module.exports = layers 
