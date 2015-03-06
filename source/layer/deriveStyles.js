'use strict'
var monads = require('../../libs/monads.js')

function deriveBackgroundStyle(layer) {
    var style = {}
        , get = monads.getProperty(layer)

    style.color = {
        red: get('fill.color.red', 255)
        , green: get('fill.color.green', 255)
        , blue: get('fill.color.blue', 255)
    }

    return style
}

function deriveDimensionsStyle(layer) {

    return {}
}

function deriveBorderStyle(layer) {

    return {}
}

function deriveShadowStyle(layer) {

    return {}
}

function deriveBoxSizingStyle(layer) {

    return {}
}

function deriveOpacityStyle(layer) {

    return {}
}

function deriveFontStyle(layer) {

    return {}
}

function deriveStyles(layer) {
    return {
        background: deriveBackgroundStyle(layer)
        , dimensions: deriveDimensionsStyle(layer)
        , border: deriveBorderStyle(layer)
        , shadow: deriveShadowStyle(layer)
        , boxSizing: deriveBoxSizingStyle(layer)
        , opacity: deriveOpacityStyle(layer)
        , font: deriveFontStyle(layer)
    }
}

module.exports = deriveStyles