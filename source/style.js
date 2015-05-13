'use strict'

var style = {}

style.background = R.curry(function(document, layer) {
    var style = {}

    style.color = {
        red: U.getProp(255, 'fill.color.red', layer),
        green: U.getProp(255, 'fill.color.green', layer),
        blue: U.getProp(255, 'fill.color.blue', layer)
    }

    return style
})

style.dimensions = R.curry(function(document, layer) {
    var style = {}

    return style
})

style.border = R.curry(function(document, layer) {
    var style = {}

    return style
})

style.shadow = R.curry(function(document, layer) {
    var style = {}

    return style
})

module.exports = {}

Object.keys(style).forEach(function(method) {
    module.exports[method] = style[method]
})

module.exports.all = R.curry(function(document, layer) {
    return Object.keys(style).reduce(function(aggregator, method) {
        aggregator[method] = style[method](document, layer)
        return aggregator
    }, {})
})