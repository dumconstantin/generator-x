function generator() {
    var generator = generatorCore.createGenerator()

    generator.start({
        port: 49494,
        hostname: 'localhost',
        password: '123456'
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
    documentP: documentP,
    pixmapP: pixmapP
}