var U = require('../libs/utils.js')
    , R = require('ramda')
    , path = require('path')
    , generator = require('./generator.js')
    , uniqueId = require('node-uuid').v1
    , save = require('./save.js')
    , project = require('./project.js')

// Creates a layer object used to generate HTML and CSS based on
// the linked PSD layer
var build = R.curry(function buildFunc(document, psdLayer) {
  return {
    documentId: document.id
    , psdId: psdLayer.id
    , children: undefined !== psdLayer.layers ? psdLayer.layers.map(build(document)) : []
    , id: uniqueId() 
    , text: require('./layer/deriveText.js')(document, psdLayer)
    , HTMLAttributes: {
        classes: ''
        , id: ''
    }
    , HTMLTag: ''
    , afterElement: {}
    , beforeElement: {}
    , semantics: {}
    , styles: require('./layer/deriveStyles.js')(document, psdLayer)
  }
})

function flatten(layers) {
    return layers.reduce(function (list, layer) {
        list = list.concat(layer)
        list = list.concat(flatten(layer.children))
        return list
    }, [])
}

function all(document) {
    return document.layers.map(build(document)) 
}

module.exports = {
    build: build
    , all: all
    , flatten: flatten
}
