var when = require('when')
    , R = require('ramda')
    , path = require('path')
    , generatorCore = require(path.resolve(__dirname, '../node_modules/generator-core/lib/generator.js'))

function generator() {
    var generator = generatorCore.createGenerator()

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

var pixmapP = R.curry(function pixmapPFunc(document, layer) {
  return generator().getPixmap(document.id, layer.psdId, {})
})

module.exports = {
    documentP: documentP
    , pixmapP: pixmapP
}
