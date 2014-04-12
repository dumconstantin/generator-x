var psd = require('./sample.json'),
    fs = require('fs'),
    doc = '<!DOCTYPE html><body>',
    styles = {},
    stylesOutput = '<style>',
    html = '',
    structure = {};

function createStructure(sections, parent) {

    // Is the first call from the root?
    if (undefined === parent) {
        parent = {
            properties: {
                cssName: 'global',
                parsedCSS: {
                    top: 0,
                    left: 0,
                    bottom: 0,
                    right: 0
                },
                css: {}
            },
            sections: [],
            layers: [] // This layers global section hosts layers without a section
        };
    } else {
        // The parent is a section
    }

    sections.forEach(function (layer, index) {
        var section = {};

        layer.properties = {
            css: {},
            parsedCSS: {},
            cssName: layer.name.replace(/\s/g, '-')
        };

        switch (layer.type) {
            case 'layerSection':

                Object.keys(layer).forEach(function (property) {
                    if (-1 === ['layers', 'properties'].indexOf(property)) {
                        layer.properties[property] = layer[property];
                    } else {
                        // Layers are not added to the object.
                        // They will be added in the layers property 
                        // on the parent object
                    }
                });

                section = {
                    properties: layer.properties,
                    sections: [],
                    layers: []
                };

                parent.sections.push(section);

                if (undefined !== layer.layers) {
                    createStructure(layer.layers, section);
                } else {
                    // The section does not have other layers
                }

            break;
            
            case 'shapeLayer':
                parent.layers.push(layer);
            break;

            case 'textLayer':
                parent.layers.push(layer);
            break;
            default: 
                console.log('The "' + layer.type + '" layer type is not recognised.');
            break;
        }
    });

    return parent;
}

function parseLayerStyles(layer) {
    var style = {};

    switch (layer.type) {
        case 'textLayer':
            temp = layer.text.textStyleRange[0].textStyle;
            style.color = 'rgb(' + Math.round(temp.color.red) + ', ' 
                + Math.round(temp.color.green) + ', ' + Math.round(temp.color.blue) + ')';
            
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

            style.top = Math.round(layer.path.bounds.top) - layer.properties.parent.properties.parsedCSS.top;
            style.left = Math.round(layer.path.bounds.left) - layer.properties.parent.properties.parsedCSS.left;
            style.bottom = Math.round(layer.path.bounds.bottom) - layer.properties.parent.properties.parsedCSS.top;
            style.right = Math.round(layer.path.bounds.right) - layer.properties.parent.properties.parsedCSS.left;

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
    var style = {},
        properties = section.properties.parsedCSS;

    if (undefined !== section.properties.bounds) {
        
        Object.keys(section.properties.bounds).forEach(function (boundry) {
            properties[boundry] = Math.round(section.properties.bounds[boundry]);
            style[boundry] = 
                (properties[boundry] - section.properties.parent.properties.parsedCSS[boundry]) + 'px';
        });
        
        style.position = 'absolute';
        style['z-index'] = section.properties.index;

    }

    section.properties.parsedCSS = properties;

    return style;
}

function generateHTML(section) {
    var html = "";

    html += '<div id="' + section.properties.cssName + '"><span class="groupName">' + section.properties.cssName + '</span>';
    styles[section.properties.cssName] = section.properties.css;

    section.sections.forEach(function (childSection) {
        html += generateHTML(childSection);
    });

    section.layers.forEach(function (layer) {

        switch (layer.type) {
            case 'textLayer':
                html += '<p id="' + layer.properties.cssName + '">' + layer.text.textKey + '</p>'; 
            break;

            case 'shapeLayer':
                html += '<div id="' + layer.properties.cssName + '">' + layer.properties.cssName + '</div>';
            break;

            default: 
                console.log('The "' + layer.type + '" layer type is not recognised.');
            break;
        }

        styles[layer.properties.cssName] = layer.properties.css;
    });

    html += '</div>';

    return html;
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

function testFloat(layer) {
    var lefts = [],
        tempLayer = layer;

    console.log("Testing " + layer.properties.cssName);
    function get(direction) {
        while(tempLayer.properties[direction]) {
            lefts.push(tempLayer.properties[direction].properties.parsedCSS.left);
            tempLayer = tempLayer.properties[direction];
        }
    }

    get('prev');
    // get('next');

    console.log(lefts);
}


function findFloatables(layers) {
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

        // The first element of each row must not have margins
        firstElementsInRow.push(flotables[0].id);

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
                if (prev.properties.parsedCSS.top != layer.properties.parsedCSS.top) {
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

        console.log(flotables.length + ' floatable elements.');
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
    var floatableLayers = {},
        floatableSections = {};

    section.properties.css.position = 'absolute'; 
    section.properties.css.left = section.properties.parsedCSS.left + 'px';
    section.properties.css.top = section.properties.parsedCSS.top + 'px';
    section.properties.css.width = section.properties.parsedCSS.right - section.properties.parsedCSS.left + "px";

    // Find floatable sections
    // floatableSections = findFloatables(section.sections);
    // console.log(floatableSections);

    console.log()
    section.sections.forEach(function (childSection) {
        processCSS(childSection);
    });

    // floatableLayers = findFloatables(section.layers);

    section.layers.forEach(function (layer) {

        // Decide if the element requires floating.
        if (floatableLayers.elements.some(function (floated) {
            if (floated.id === layer.id) {
                return true;
            } else {
                return false;
            }
        })) {
            layer.properties.css.float = 'left';

            // If the layer is the first layer then the margin shouldn't be 
            // the same as with the rest of the layers.
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


// Helper styles
stylesOutput += ".groupName { position: absolute; top: -20px; left: 0; }"

stylesOutput += '</style>';
doc += stylesOutput;
doc += html;
doc += '</body></html>';

fs.writeFile('./index.html', doc, function (err) {
    if(err) {
        console.log(err);
    } else {
        console.log('Index.html is saved!');
    }
});




