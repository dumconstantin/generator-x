'use strict'

var R = require('ramda')

// TODO: Refactor getPropertyMonad to use recursive property access 
// instead of eval
function getProperty(obj) {
	return function (propertyChain, defaultValue) {
		var value;
		
		if ('function' !== typeof propertyChain && 'string' === typeof propertyChain) {

			try {
				eval('value = obj.' + propertyChain.toString());
				if (undefined === value) {
					throw new Error('not available');
				}
			} catch (e) {
				if (undefined !== defaultValue) {
					return defaultValue;
				}
				return undefined;
			}
		} else {
			return null;
		}

		return value;
	}
}

var setProperty = R.curry(function setProperty(propName, propValue, obj) {
    var clonedObject = R.clone(obj)   
    clonedObject[propName] = propValue
    return clonedObject
})

module.exports = {
	getProp: getProperty
    , setProp: setProperty
}
