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

module.exports = {
	getProperty: getProperty
}