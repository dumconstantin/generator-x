'use strict'
var when = require('when')

function generator() {
    var generator = require(require('path').resolve(__dirname, '../node_modules/generator-core/lib/generator.js')).createGenerator() 

    generator.start({
        port: 49494
        , hostname: 'localhost'
        , password: '123456'
    })
    
    return generator
}

function documentP() {
    return generator().getDocumentInfo()
}

function pixmapP(documentId, layerId) {
  return generator().getPixmap(documentId, layerId, {})
}

module.exports = {
    documentP: documentP
    , pixmapP: pixmapP
}
