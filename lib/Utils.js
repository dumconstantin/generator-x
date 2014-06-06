console.custom = function (obj, message) {
    if (true === this.filter(obj, message)) {
        console.log(message);
    }
};

// Has method
// Will provide a response for a chain of Object properties
// e.g: x.has('one.of.these.properties');
Object.defineProperty(Object.prototype, '_has', {
    enumerable : false,
    value : function(params) {
        var tester;
        if ('function' !== typeof params && 'string' === typeof params) {
            try {
                eval('tester = this.' + params);
                // This eval is not evil , as long is completely secured
                if (undefined === tester) {
                    throw new Error('The property ' + params + ' is not available');
                }
            } catch (e) {
                return false;
            }
        } else {
            return false;
        }
        return true;
    }
});

//
// getValueOf
// Retrieves the value of a chained Object properties
//
Object.defineProperty(Object.prototype, '_get', {
    enumerable : false,
    value : function(params, fallback) {
        var value;
        if ('function' !== typeof params && 'string' === typeof params) {

            try {
                eval('value = this.' + params.toString());
                if (undefined === value) {
                    throw new Error('not available');
                }
            } catch (e) {
                if (undefined !== fallback) {
                    return fallback;
                }
                return undefined;
            }
        } else {
            return false;
        }
        return value;
    }
});

GLOBAL.stringify = function (obj, circularProperties) {
    var stringified,
        circularProperties = circularProperties ? circularProperties : [];

    function removeCircular(name, value) {
        if (-1 === circularProperties.indexOf(name)) {
            return value;
        } else {
            //Undefined properties will be removed from JSON.
            return undefined;
        }
    }

    try {
        if (0 === circularProperties.length) {
            stringified = JSON.stringify(obj, null, 4);
        } else {
            stringified = JSON.stringify(obj, removeCircular, 4);
        }
    } catch (e) {
        console.error('Stringify error:', e);
        stringified = String(obj);
    }

    return stringified;
}

GLOBAL.isNumber = function (value) {
    if ((undefined === value) || (null === value)) {
        return false;
    }
    if (typeof value == 'number') {
        return true;
    }
    return !isNaN(value - 0);
}

/**
 * Convert camelCase strings to hyphen separated words.
 *
 * @param  {string} name The camelCase words.
 * @return {string}      The hyphen separated words
 */
GLOBAL.convertFromCamelCase = function (camelCaseWords) {
    return camelCaseWords.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
}

GLOBAL.getCSSFontFamily = function (fontName) {
    var result = '',
        fileName = fonts2[fontName],
        location = '../fonts/',
        file = location + fileName;


    if (undefined !== fileName) {
        font = "\n@font-face {"
            + "\nfont-family: '" + fontName + "'; "
            + "\n src: url('" + file + ".eot'); "
            + "\n src: url('" + file + ".eot?#iefix') format('embedded-opentype'),"
            + "\n     url('" + file + ".woff') format('woff'),"
            + "\n    url('" + file + ".ttf') format('truetype'),"
            + "\n    url('" + file + ".svg#" + fontName + "') format('svg');"
            + "\nfont-weight: normal;"
            + "\nfont-style: normal;"
            + "\n}";
    }

    return font;
};

GLOBAL.fonts2 = {
    'MavenPro-Regular': 'maven_pro-regular',
    'MavenPro-Bold': 'maven_pro-bold',
    'MavenPro-Black': 'maven_pro-black'
};




GLOBAL.fonts = {
    Oswald: {
        family: {
            regular: 'oswaldbook'
        },
        name: 'oswald'
    },
    IcoMoon: {
        family: {
            regular: 'icomoon'
        },
        name: 'icomoon'
    },
    MavenProBold: {
        family: {
            regular: 'maven_probold'
        },
        name: 'maven_pro_bold'
    },
    MavenProBlack: {
        family: {
            regular: 'maven_problack'
        },
        name: 'maven_pro_black'
    },
    MavenProMedium: {
        family: {
            regular: 'maven_promedium'
        },
        name: 'maven_pro_medium'
    },
    MavenProRegular: {
        family: {
            regular: 'maven_proregular'
        },
        name: 'maven_pro_regular'
    },
    MavenPro: {
        family: {
            bold: 'maven_probold',
            regular: 'maven_pro',
            medium: 'maven_promedium'
        },
        name: 'maven_pro'
    },
    OpenSans: {
        family: {
            bold: 'open_sansbold',
            blackitalic: 'open_sansbold_italic',
            extrabold: 'open_sansextrabold',
            extrabolditalic: 'open_sansextrabold_italic',
            italic: 'open_sansitalic',
            light: 'open_sanslight',
            lightitalic: 'open_sanslight_italic',
            semibold: 'open_sanssemibold',
            regular: 'open_sans',
            semibolditalic: 'open_sanssemibold_italic',
        },
        name: 'open_sans'
    },
    Roboto: {
        family: {
            black: 'robotoblack',
            blackitalic: 'robotoblack_italic',
            bold: 'robotobold',
            bolditalic: 'robotobold_italic',
            italic: 'robotoitalic',
            light: 'robotolight',
            medium: 'robotomedium',
            mediumitalic: 'robotomedium_italic',
            regular: 'robotoregular',
            thin: 'robotothin',
            thinitalic: 'robotothin_italic'
        },
        name: 'roboto'
    }
};



/**
 * Recursively clone an object.
 * @param  {object} object The object that will be cloned.
 * @return {object}     The resulting object clone.
 */
GLOBAL.cloneObject = function (object) {
    var clone;

    switch (typeof object) {
        case 'object':
            // Determine if it's array, null, regex or object.
            if (null === object) {
                clone = null;
            } else if (true === object instanceof Number) {
                clone = new Number(object.valueOf());
            } else if (true === object instanceof String) {
                clone = object.toString();
            } else if (true === object instanceof Date) {
                clone = new Date(object);
            } else if (true === object instanceof Array) {
                clone = [];
                object.forEach(function (item, index) {
                    clone[index] = cloneObject(item);
                });
            } else if (true === object instanceof RegExp) {
                clone = new RegExp(object);
            } else if (true === object instanceof Boolean) {
                clone = new Boolean(object);
            } else if (true === object instanceof Object) {
                clone = {};
                if (true === object.hasOwnProperty('__name')) {
                    clone = object;
                } else {
                    Object.getOwnPropertyNames(object).forEach(function (property) {    
                        clone[property] = cloneObject(object[property]);
                    });
                    clone.__proto__ = Object.getPrototypeOf(object);
                }
                
            } else {
                console.error('Cloning object encountered an unrecognized object');
                console.log(object);
                clone = undefined;
            }
        break;
        case 'function':
            clone = object;
        break;
        case 'number':
            // This also catches NaN.
            clone = object;
        break;
        case 'string':
            clone = object;
        break;
        case 'undefined':
            clone = object;
        break;
        case 'boolean':
            clone = object;
        break;
        default:
            console.error('Cloning object encountered an unrecognized object');
            console.log(object);
        break;
    }

    return clone;
}


Object.prototype.merge = function(obj) {
    var _this = this;
    Object.keys(obj).forEach(function(key){
        if (true === _this[key] instanceof Array) {
            _this[key] = _this[key].concat(obj[key]);
        } else
        _this[key] = obj[key];
    });
}
