'use strict'


function makeLayer(layer) {
	return {
		link: layer.id
		, layers: layer.layers ? makeTree(layer.layers) : []
		, id: require('node-uuid').v1()
		, text: require('./layer/deriveText.js')(layer)
		, HTMLAttributes: {
			classes: ''
			, id: ''
		}
		, HTMLTag: ''
		, afterElement: {}
		, beforeElement: {}
		, semantics: {}
		, styles: require('./layer/deriveStyles.js')(layer)
	}
}

function makeTree(layers) {
	return layers.map(function (layer) {
		return makeLayer(layer)
	}, [])
}

module.exports = makeTree

