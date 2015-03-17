'use strict'
var R = require('ramda') 
    , U = require('../../libs/utils.js')

function deriveBackgroundStyle(layer) {
    var style = {}
        
    style.color = {
        red: U.getProp('fill.color.red', 255, layer)
        , green: U.getProp('fill.color.green', 255)
        , blue: U.getProp('fill.color.blue', 255)
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
