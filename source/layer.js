// Creates a layer object used to generate HTML and CSS based on
// the linked PSD layer
var build = R.curry(function buildFunc(document, psdLayer) {
    return {
        documentId: document.id
        , psdId: psdLayer.id
        , children: undefined !== psdLayer.layers ? psdLayer.layers.map(build(document)) : []
        , id: uuid()
        , text: require('./layer/deriveText.js')(document, psdLayer)
        , HTMLAttributes: {
            classes: ''
            , id: ''
        }
        , HTMLTag: ''
        , afterElement: {}
        , beforeElement: {}
        , semantics: {}
        , styles: style.all(document, psdLayer)
    }
})

function flatten(layers) {
    return layers.reduce(function(list, layer) {
        return list.concat(layer, flatten(layer.children))
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
