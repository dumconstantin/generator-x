'use strict'


// Creates a layer object used to generate HTML and CSS based on 
// the linked PSD layer
function makeLayer(document, layer) {
	return {
        documentId: document.id
		, layerId: layer.id
		, layers: layer.layers ? makeTree(document, layer.layers) : []
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
}

function makeTree(document, layers) {	
    return layers.map(function (layer) {
      makeLayer(document, layer)   
    }, [])
}

module.exports = makeTree
