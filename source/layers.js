'use strict'
var U = require('../libs/utils.js')
    , R = require('ramda')
    , path = require('path')

// Creates a layer object used to generate HTML and CSS based on 
// the linked PSD layer
var makeLayer = R.curry(function (document, layer) {
    var fileName = require('node-uuid').v1() 
        , filePath = path.resolve(require('./project.js').path(document), 'temp',  fileName)
   
    var imageP = R.pipeP(
        require('./generatorInterface.js').pixmapP
        , require('./save.js').tempImageP(filePath)
    )(document.id, layer.id)
    
    imageP.done(function () {
        console.log(arguments) 
        console.log('image is done')
    })
    return {
        documentId: document.id
		, layerId: layer.id
		, layers: undefined !== layer.layers ? layer.layers.map(makeLayer(document)) : []
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
		, image: imageP
    }
})

function layers(document) {
    return document.layers.map(makeLayer(document)) 
}

module.exports = layers 
