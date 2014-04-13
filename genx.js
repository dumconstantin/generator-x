var psd = require('./sample.json'),
    fs = require('fs'),
    doc = '<!DOCTYPE html><body>',
    styles = {},
    stylesOutput = '<style>',
    html = '',
    structure = {};



/**
 * Has method
 * Will provide a response for a chain of Object properties
 * e.g: x.has('one.of.these.properties');
 */
Object.defineProperty(Object.prototype, 'has', {
    enumerable : false,
    value : function(params) {
        var tester;
        if ('function' !== typeof params && 'string' === typeof params) {
            try {
                eval('tester = this.' + params);
                // This eval is not evil , as long is completely secured
                if (undefined === tester) {
                    throw new Error('not available');
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

/**
 * getValueOf
 * Retrieves the value of a chained Object properties
 */
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

/**
 * unsetValueOf
 * Removes a reference from a given object
 */

Object.defineProperty(Object.prototype, 'unsetValueOf', {
    enumerable : false,
    value : function(params) {
        var value;

        if ('function' !== typeof params && 'string' === typeof params) {
            try {
                eval('delete this.' + params);
            } catch (e) {
                return undefined;
            }
        } else {
            return false;
        }
        return value;
    }
});

/**
 * setValueOf
 * Creates the desired structure and assigns a desired value to it
 */
Object.defineProperty(Object.prototype, 'setValueOf', {
    enumerable : false,
    value : function(params, value, recall) {
        var tree, i, chain, isValid = true, setValue, placebo, tempTree, finalVar;

        if (true === this instanceof String) {
            return false;
        }

        if (true === this instanceof Number) {
            return false;
        }

        if (true === this instanceof Boolean) {
            return false;
        }

        if (true === this instanceof Function) {
            return false;
        }

        if (true === this instanceof Array) {
            return false;
        }

        if ('object' !== typeof this) {
            return false;
        }

        if ('number' === typeof this) {
            return false;
        }

        setValue = function() {
            try {
                if (/\./.test(params)) {
                    tempTree = params.split('.');
                    finalVar = tempTree.pop();
                    eval('placebo = this.' + tempTree.join('.'));
                    if (undefined !== placebo) {
                        placebo[finalVar] = value;
                    }
                } else {
                    this[params] = value;
                }
            } catch (e) {
                console.error('Object prototype setValueOf has failed');
                console.error(e);
                return false;
            }
        };

        if ('function' !== typeof params && 'string' === typeof params) {
            if (/\./.test(params)) {

                //Get the property tree
                tree = params.split('.');

                if (0 < tree.length) {
                    chain = '';

                    for ( i = 0; i < Math.round(tree.length - 1); i += 1) {
                        chain += tree[i];
                        if (false === this.has(chain)) {
                            isValid = false;
                            this.setValueOf(chain, {}, true);
                        }
                        if (i !== tree.length - 1) {
                            chain += ".";
                        }

                    }

                    chain += tree[tree.length - 1];

                    if (false === isValid) {
                        this.setValueOf(chain, value, true);
                        return;
                    } else {
                        if (false === this.has(params)) {
                            setValue.call(this);
                            return true;
                        }
                    }
                }
            }

            if (false === this.has(params)) {
                setValue.call(this);
            }
        }
        return true;
    }
});


// All sections are still layers.
// The semantic is given by the way the interaction with the dom will occur
// A layer must have: 
// - tag: div, p, span, etc
// - class
// - id
// - text
// - parent/nextSibling/prevSibling for traversing
// - css all the css properties that will eventually end in the stylesheet

// Parsing will be made in 3 stages:
// 1. The parsing of the PSD document with absolute styles - Done
// 2. From the absolute styles connections between elements will emerge (e.g. floats, overlay, etc)
// 3. Establish the logical order of dom elements (based on float, etc)
// 4. Find patterns in styles through css duplication, hierachy and inheritance to optimise the css creation
// 5. Create the HTML version of the structure
// 6. Create the CSS version of the layers
// 7. Create a file with the HTML and CSS code


// TODO: For layers that have the same name regardless of their position
// in the structure tree, allocate different cssNames to avoid id collision


function parseCSS(style) {
    var css = {
        top: style._get('bounds.top', 0),
        right: style._get('bounds.right', 0),
        bottom: style._get('bounds.bottom', 0),
        left: style._get('bounds.left', 0),
        position: 'static',
        background: {
            color: {
                red: style._get('fill.color.red', null),
                green: style._get('fill.color.green', null),
                blue: style._get('fill.color.blue', null)
            },
            gradient: {
                colors: [],
                locations: [],
                reverse: null
            }
        },
        opacity: style._get('blendOptions.opacity.value', 0) / 100,
        border: {
            color: {
                red: style._get('layerEffects.frameFX.color.red', null),
                green: style._get('layerEffects.frameFX.color.green', null),
                blue: style._get('layerEffects.frameFX.color.blue', null)
            },
            size: 0,
            radius: {
                topLeft: 0,
                topRight: 0,
                bottomLeft: 0,
                bottomRight: 0
            }
        },
        zIndex: style.index
    };

    // Fill color overwritted by the blend options
    css.background.color = {
        red: style._get('layerEffects.solidFill.color.red', css.background.color.red),
        green: style._get('layerEffects.solidFill.color.green', css.background.color.green),
        blue: style._get('layerEffects.solidFill.color.blue', css.background.color.blue)
    };

    // Gradient Colors
    style._get('layerEffects.gradientFill.gradient.colors', []).forEach(function (color) {
        css.background.gradient.colors.push({
            red: color.color.red,
            green: color.color.green,
            blue: color.color.blue,
            location: color.location,
            type: color.type,
            midpoint: color.midpoint
        });
        css.background.gradient.locations.push(color.location);
    });

    // The color array is in reverse order due to the way is added
    css.background.gradient.colors.reverse();

    css.background.gradient.reverse = style._get('layerEffects.gradientFill.reverse', false);

    // Overwrite positioning for now
    css.position = 'absolute';

    css.width = css.right - css.left;
    css.height = css.bottom - css.top;

    return css;
}

var getUnique = (function () {
    var id = 0;
    return function () {
        id += 1;
        return id;
    };
}());

function Layer(layer) {
    var _this = this;

    this.id = layer.id;
    this.siblings = [];
    this.visible = layer.visible;
    this.name = layer.name;
    this.cssName = layer.name.replace(/\s/g, '-') + '-' + getUnique();
    this.index = layer.index;
    this.text = '';

    // Presumed css styles
    this.css = parseCSS(layer);

    // Layer type specific configuration
    switch (layer.type) {
        case 'layerSection':
            this.tag = 'div';
        break;

        case 'shapeLayer':
            this.tag = 'div';
        break;

        case 'textLayer':
            this.tag = 'span';
            this.text = layer._get('text.textKey', '');
        break;

        case 'layer':
            this.tag = 'img';
        break;

        default: 
            console.log('The layer type "' + layer.type + '" is no recognised.');
        break;
    }

    // Parse children layers.
    if (undefined !== layer.layers) {
        layer.layers.forEach(function (siblingLayer) {
            _this.siblings.push(new Layer(siblingLayer));
        });
    }

}

Layer.prototype.getCSSName = function (name) {
    return name.replace(/([a-z])([A-Z])/g, '$1-$2').toLowerCase();
};


Layer.prototype.getCSSProperty = function (name) {
    var property = this.getCSSName(name) + ': ',
        value = this.css[name];

    switch (name) {
        case 'top':
            property += Math.round(value) - Math.round(this.parent.css.top) + 'px';
        break;
        
        case 'right':
            property += 'auto'; // Math.round(value) + 'px';
        break;
        
        case 'bottom':
            property += 'auto'; // Math.round(value) + 'px';
        break;

        case 'left':
            property += Math.round(value) - Math.round(this.parent.css.left) + 'px';
        break;

        case 'position':
            property += value;
        break;

        case 'width':
            property += value + 'px';
        break;

        case 'height':
            property += value + 'px';
        break;

        case 'background':
            if (0 < value.gradient.colors.length) {

                property += 'linear-gradient(';

                if (true === value.gradient.reverse) {
                    value.gradient.colors.reverse();
                }

                value.gradient.colors.forEach(function (color, index, colors) {
                    property += 'rgb(' + Math.round(color.red) + ','
                        + Math.round(color.green) + ',' 
                        + Math.round(color.blue) 
                        + ') ' + Math.round((value.gradient.locations[index] * 100) / 4096) + '%';

                    if (index < colors.length - 1) {
                        property += ', ';
                    }
                });
                
                property += ')';

            } else if (null !== value.color.red) {
                property += 'rgb('
                    + Math.round(value.color.red) + ', '
                    + Math.round(value.color.green) + ', '
                    + Math.round(value.color.blue)
                    + ')';
            } else {
                property += 'transparent';
            }

        break;

        case 'zIndex':
            property += value;
        break;
        
        case 'border':

        break;

        case 'opacity':

        break;

        default: 
            console.log('CSS property "' + name + '" is not regonized.');
        break;
    }

    return property;
};

Layer.prototype.getCSS = function () {
    var _this = this,
        css = '';

    css += '\n#' + this.cssName + ' {\n';

    Object.keys(this.css).forEach(function (property) {
        css += '\t' + _this.getCSSProperty(property) + ';\n'; 
    });

    css += '}';

    this.siblings.forEach(function (sibling) {
        css += sibling.getCSS();
    });

    return css;
};

Layer.prototype.getHTML = function () {
    var html = '',
        content = '';

    content += this.text;

    this.siblings.forEach(function (sibling) {
        content += sibling.getHTML();
    });

    html += '\n<' + this.tag + ' id="' + this.cssName + '">' + content + '</' + this.tag + '>';

    return html;
};

function Structure(document) {
    var _this = this;

    this.doc = [];
    this.layers = [];
    this.html = '';
    this.css = '';

    // This is the top most parent of the document. 
    // Catch all traversal that arrive here.
    this.parent = {
        css: parseCSS({})
    };

    this.document = document;

    this.header = '<!DOCTYPE html>' +
        '<head>' +
        '<link rel="stylesheet" href="style.css">' +
        '</head>' +
        '<body>';
    
    this.footer = '</body></html>';
}

Structure.prototype.parse = function () {
    var _this = this;
    this.document.layers.forEach(function (layer) {
        _this.layers.push(new Layer(layer));
    });
};

Structure.prototype.link = function () {

    function linkSiblings(siblings, parent) {
        siblings.forEach(function (sibling, index) {
            
            sibling.parent = parent;
            
            if (0 < index) {
                sibling.prev = siblings[index - 1];
            }

            if (siblings.length > index + 1) {
                sibling.next = siblings[index + 1];
            }
 
            linkSiblings(sibling.siblings, sibling);
        });
    }

    linkSiblings(this.layers, this.parent);
};

Structure.prototype.refreshCode = function () {
    var _this = this;

    // Reset html and css
    this.html = "";
    this.css = "";

    this.layers.forEach(function (layer) {
        _this.html = layer.getHTML();
        _this.css = layer.getCSS();
    });

    this.html = this.header + this.html + this.footer;
};

Structure.prototype.toJSON = function (filename) {

    function removeLinks(name) {
        console.log(name);
    }

    fs.writeFile(filename, JSON.stringify(this.layers, removeLinks, 4), function (err) {
        if(err) {
            console.log(err);
        } else {
            console.log('Structure.json is saved!');
        }
    });
};

Structure.prototype.output = function () {
    fs.writeFileSync('./index.html', this.html);
    fs.writeFileSync('./style.css', this.css);
};

var structure = new Structure(psd);
structure.parse();
structure.link();

structure.toJSON('./structure.json');
structure.refreshCode();

structure.output();

return;




function setBoundries(style, layer, bounds) {
    style.top = Math.round(bounds.top);
    if (undefined !== layer.properties.parent.properties.parsedCSS.top) {
        style.top -= layer.properties.parent.properties.parsedCSS.top;
    }

    style.left = Math.round(bounds.left);
    if (undefined !== layer.properties.parent.properties.parsedCSS.left) {
        style.left -= layer.properties.parent.properties.parsedCSS.left;
    }

    style.bottom = Math.round(bounds.bottom);
    if (undefined !== layer.properties.parent.properties.parsedCSS.top) {
        style.bottom -= layer.properties.parent.properties.parsedCSS.top;
    } 

    style.right = Math.round(bounds.right);
    if (undefined !== layer.properties.parent.properties.parsedCSS.left) {
        style.right -= layer.properties.parent.properties.parsedCSS.left;
    }
}

function parseLayerStyles(layer) {
    var style = {};

    switch (layer.type) {
        case 'textLayer':
            temp = layer.text.textStyleRange[0].textStyle;
            style.color = 'rgb(' + Math.round(temp.color.red) + ', ' 
                + Math.round(temp.color.green) + ', ' + Math.round(temp.color.blue) + ')';
            
            setBoundries(style, layer, layer.bounds);

            style['font-family'] = temp.fontName;
            style['font-size'] = temp.size + 'px';

            Object.keys(layer.bounds).forEach(function (boundry) {
                style[boundry] = Math.round(layer.bounds[boundry]);
            });

        break;

        case 'shapeLayer':
            style.background = 'rgb(' + Math.round(layer.fill.color.red) + ', ' 
                + Math.round(layer.fill.color.green) 
                + ', ' + Math.round(layer.fill.color.blue) + ')';

            setBoundries(style, layer, layer.path.bounds);

            style['z-index'] = layer.index;
            style.width = (style.right - style.left) + 'px';
            style.height = (style.bottom - style.top) + 'px';
        break;
        default:
            console.log('The "' + layer.type + '" layer type is not regonized.');
        break;
    }

    style['z-index'] = layer.index;

    layer.properties.parsedCSS = style;
}

function parseSectionStyles(section) {
    var style = section.properties.parsedCSS;

    if (undefined !== section.properties.bounds) {

        setBoundries(style, section, section.properties.bounds);

        style.width = (style.right - style.left) + 'px';
        style.height = (style.bottom - style.top) + 'px';

        style['z-index'] = section.properties.index;

    }

    section.properties.parsedCSS = style;

    return style;
}

function addLinkages(section, parent) {

    section.sections.forEach(function (childSection) {
        childSection.properties.parent = section;
        addLinkages(childSection, section);
    });

    section.layers.forEach(function (layer, index) {
        
        layer.properties.parent = section;

        if (undefined !== section.layers[index - 1]) {
            layer.properties.prev = section.layers[index - 1];
        }

        if (undefined !== section.layers[index + 1]) {
            layer.properties.next = section.layers[index + 1]
        }
    });
}

function parseStyles(section) {

    parseSectionStyles(section);

    section.sections.forEach(function (childSection) {
        parseStyles(childSection);
    });

    section.layers.forEach(function (layer) {
        parseLayerStyles(layer);
    });
}

function findFloatables(layers, type) {
    var flotables = [],
        firstElementsInRow = [],
        disposeFloatables = false,
        marginColumn,
        marginRow;

    if (1 < layers.length) {

        // Order layers by left alignment
        layers.sort(function (left, right) {
            return left.properties.parsedCSS.left > right.properties.parsedCSS.left;
        });

        // Order layers by top down alignment
        layers.sort(function (left, right) {
            return left.properties.parsedCSS.top > right.properties.parsedCSS.top;
        });

        // Clone array
        layers.forEach(function (layer) {
            flotables.push(layer);
        });

        /*
        // Find the layers that have the same top
        flotables = flotables.filter(function (layer) {
            if (flotables[0].properties.parsedCSS.top === layer.properties.parsedCSS.top) {
                return true;
            }
        });
        */

        // Calculate the necessary margin for all floated layers
        marginColumn =  flotables[1].properties.parsedCSS.left - 
                (flotables[0].properties.parsedCSS.left +
                parseInt(flotables[0].properties.parsedCSS.width));

        console.log("MarginColumn: " + marginColumn);
        // The first element of each row must not have margins
        firstElementsInRow.push(flotables[0].id);
        console.log(firstElementsInRow);

        // Find the margin between other layers
        flotables = flotables.filter(function (layer, index) {
            var prev = flotables[index - 1],
                value;

            // If a flotable candidate did not conform with the margin
            // then all following canditates are also not floated.
            if (true === disposeFloatables) {
                return false;
            }

            if (undefined !== prev) {
                // If floated cantidate is on a different row.
                if (prev.properties.parsedCSS.top !== layer.properties.parsedCSS.top) {
                    firstElementsInRow.push(layer.id);

                    // Calculate the bottom margin of the above row
                    marginRow = layer.properties.parsedCSS.top -
                        (parseInt(flotables[0].properties.parsedCSS.height) +
                        flotables[0].properties.parsedCSS.top);

                    return true;
                }

                value = 
                    layer.properties.parsedCSS.left - 
                    (prev.properties.parsedCSS.left +
                    parseInt(prev.properties.parsedCSS.width));

                console.log(layer.properties.parsedCSS.left + " vs " + prev.properties.parsedCSS.left + " vs " + prev.properties.parsedCSS.width);
                console.log("Value: " + value);
                if (value === marginColumn) {
                    return true;
                } else {
                    disposeFloatables = true;
                    return false;
                }
            } else {
                return true; // The first floated element which is also reference.
            }
        });

        console.log('Found ' + flotables.length + ' ' + type + ' floatable elements.');
    }

    return {
        elements: flotables,
        marginColumn: marginColumn,
        marginRow: marginRow,
        firstElementsInRow: firstElementsInRow
    };
}

// Verificarea de float este simpla:
// - Daca un element incepe de la marginea unui container
// - Daca un element nu incepe de la marginea unui container dar are acceasi distanta
// de sus ca unul care incepe de la marginea unui container
// - Daca un element este intre alte elemente care au aceeasi distanta intre ele
// si unul dintre elemente incepe de la marginea unui container
// - 

function processCSS(section) {
    var floatableLayers,
        floatableSections;

    // Find floatable sections
    if (section.sections.length > 1) {
        console.log("Sending sections");
        // floatableSections = findFloatables(section.sections, 'sections');
    }

    console.log(floatableSections);

    section.sections.forEach(function (childSection) {
        if (undefined !== floatableSections && floatableSections.elements.some(function (floated) {
            if (floated.id === childSection.id) {
                return true;
            } else {
                return false;
            }
        })) {

            childSection.properties.css.float = 'left';
            if (-1 === floatableSections.firstElementsInRow.indexOf(childSection.id)) {
                console.log("Setting margin column");
                childSection.properties.css['margin-left'] = floatableSections.marginColumn + 'px';
            }
            childSection.properties.css['margin-bottom'] = floatableSections.marginRow + 'px';
        } else {
            childSection.properties.css.position = 'absolute';

            childSection.properties.css.left = childSection.properties.parsedCSS.left + 'px';
            childSection.properties.css.top = childSection.properties.parsedCSS.top + 'px';
            childSection.properties.css.width = childSection.properties.parsedCSS.right - childSection.properties.parsedCSS.left + "px";
        }
        
        processCSS(childSection);
    });

    // floatableLayers = findFloatables(section.layers, 'layers');

    section.layers.forEach(function (layer) {

        // Decide if the element requires floating.
        if (undefined !== floatableLayers && floatableLayers.elements.some(function (floated) {
            if (floated.id === layer.id) {
                return true;
            } else {
                return false;
            }
        })) {
            layer.properties.css.float = 'left';

            // If the layer is the first layer then the margin shouldn't be 
            // the same as with the rest of the layers.
            // console.log('For ' + section.properties.cssName + ' vs ' + layer.properties.cssName + ' ' + JSON.stringify(floatableLayers.firstElementsInRow));
            if (-1 === floatableLayers.firstElementsInRow.indexOf(layer.id)) {
                layer.properties.css['margin-left'] = floatableLayers.marginColumn + 'px';
            }

            layer.properties.css['margin-bottom'] = floatableLayers.marginRow + 'px';
        } else {

            // The element is not floated.
            layer.properties.css.position = 'absolute'; 
            layer.properties.css.left = layer.properties.parsedCSS.left + 'px';
            layer.properties.css.top = layer.properties.parsedCSS.top + 'px';
        }

        layer.properties.css.background = layer.properties.parsedCSS.background;
        
        if (undefined !== layer.properties.parsedCSS.width) {
            layer.properties.css.width = layer.properties.parsedCSS.width;
        }

        if (undefined !== layer.properties.parsedCSS.height) {
            layer.properties.css.height = layer.properties.parsedCSS.height;
        }

    });

}

// Handle Structure aspects
structure = createStructure(psd.layers);
fs.writeFile('./structure.json', JSON.stringify(structure, null, 4), function (err) {
    if(err) {
        console.log(err);
    } else {
        console.log('Structure.json is saved!');
    }
});

// Set parent, next, prev for traversing
addLinkages(structure);

// Parse styles and prepare for css process
parseStyles(structure);

// Process CSS
processCSS(structure);

html = generateHTML(structure);

// Prepare styles
Object.keys(styles).forEach(function (layerName) {
    var css = "";
    Object.keys(styles[layerName]).forEach(function (cssProperty) {
        css += "\t" + cssProperty + ':' + styles[layerName][cssProperty] + ';' + "\n";
    });

    stylesOutput += "\n" + '#' + layerName + ' { ' + "\n" + css + '}';
});







