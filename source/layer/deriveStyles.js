'use strict'

function deriveBackgroundStyle(layer) {
    var style = {}
        
    style.color = {
        red: U.getProp(255, 'fill.color.red', layer)
        , green: U.getProp(255, 'fill.color.green', layer)
        , blue: U.getProp(255, 'fill.color.blue', layer)
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
