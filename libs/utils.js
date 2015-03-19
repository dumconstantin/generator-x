'use strict'

var R = require('ramda')

var getProp = R.curry(function (defaultValue, props, obj) {
    return R.defaultTo(defaultValue 
        , R.reduce(R.ifElse(R.is(Object)
                , R.flip(R.prop)
                , R.always(undefined)
                )
            , obj
            , R.split('.', props)
            )
        )
})

var setProp = R.curry(function setProperty(propName, propValue, obj) {
    var clonedObject = R.clone(obj)   
    clonedObject[propName] = propValue
    return clonedObject
})

var argumentsToArray = function () {
    return Array.prototype.slice.call(arguments)
}

module.exports = {
	getProp: getProp 
    , setProp: setProp
    , argumentsToArray: argumentsToArray
}
