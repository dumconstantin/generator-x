"use strict"

function getStyles(documentLayer) {
	
}

function createLayer(documentLayer) {
	return {
		documentLayer: documentLayer
		, children: getLayers(documentLayer)
		, styles: getStyles(documentLayer)
	}
}

function createLayers(documentLayers) {
	return (true === documentLayers instanceof Array) ? documentLayers.map(createLayer) : []
}

exports.create = createLayers
