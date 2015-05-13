// Creates a layer object used to generate HTML and CSS based on
// the linked PSD layer
var one = R.curry(function buildFunc(document, psdLayer) {
    return {
        documentId: document.id,
        psdId: psdLayer.id,
        children: undefined !== psdLayer.layers ? psdLayer.layers.map(one(document)) : [],
        id: uuid(),
        text: require('./layer/deriveText.js')(document, psdLayer),
        HTMLAttributes: {
            classes: '',
            id: ''
        },
        HTMLTag: '',
        afterElement: {},
        beforeElement: {},
        semantics: {},
        styles: style.all(document, psdLayer)
    }
})

function all(document) {
    return document.layers.map(one(document))
}

module.exports = {
    one: one,
    all: all
}