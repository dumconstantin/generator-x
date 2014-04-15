(function () {
    "use strict";

    var _generator = null,
        MENU_ID = "core-version-test",
        fs = require('fs'),
        path = require('path'),
        PNG = require('pngjs').PNG,
        psdFile,
        doc = '<!DOCTYPE html><body>',
        styles = {},
        stylesOutput = '<style>',
        html = '',
        _document,
        regenerateDocument = true,
        regenerateImages = true,
        structure = {},
        fonts = {
            'Oswald': 'oswaldbook',
            'IcoMoon': 'icomoonregular'
        };


    function init(generator) {
        _generator = generator;

        var menuText = "Error: version property not present";

        if (_generator.version) {
            menuText = "Generator Core version: " + _generator.version;
        }

        _generator.addMenuItem(
            MENU_ID,
            menuText,
            true, // enabled
            false // not checked
        );

        _generator.getDocumentInfo().then(
            function (document) {
                console.log("Received complete document:");
                _document = document;
                handle(document);
            },
            function (err) {
                console.error("[Tutorial] Error in getDocumentInfo:", err);
            }
        ).done();    
    }

    function stringify(object) {
        try {
            return JSON.stringify(object, null, "    ");
        } catch (e) {
            console.error(e);
        }
        return String(object);
    }

    function savePixmap(pixmap, fileName){
        var pixels = pixmap.pixels;
        var len = pixels.length,
            channels = pixmap.channelCount;
     
        // convert from ARGB to RGBA, we do this every 4 pixel values (channelCount)
        for(var i=0;i<len;i+=channels){
            var a = pixels[i];
            pixels[i]   = pixels[i+1];
            pixels[i+1] = pixels[i+2];
            pixels[i+2] = pixels[i+3];
            pixels[i+3] = a;
        }
     
        // init a new PNG
        var png = new PNG({
            width: pixmap.width,
            height: pixmap.height
        });
     
        // set pixel data
        png.data = pixmap.pixels;
        // write to a file (will write out.png to the same directory as this *.js file
        png.pack().pipe(fs.createWriteStream(path.resolve(__dirname, 'images/' + fileName)));
    }

    function handle(document) {
        if (true === regenerateDocument) {
            fs.writeFile(path.resolve(__dirname, 'sample.json'), stringify(document), function (err) {
                if(err) {
                    console.log(err);
                } else {
                    console.log("The sample.json file was saved!");
                    start();
                }
            });
        } else {
            start();
        }
    }

    function start() {
        psdFile = require(path.resolve(__dirname, 'sample.json'));
        runGenerator();
    }

    function getCSSFontFamily(fontName) {
        var font = "";
        
        switch (fontName) {
            case 'Oswald':
                font += "\n @font-face {"
                    + " font-family: 'oswaldbook'; " 
                    + " src: url('fonts/oswald-regular.eot');"
                    + " src: url('fonts/oswald-regular.eot?#iefix') format('embedded-opentype'),"
                    + "     url('fonts/oswald-regular.woff') format('woff'),"
                    + "     url('fonts/oswald-regular.ttf') format('truetype'),"
                    + "     url('fonts/oswald-regular.svg#oswaldbook') format('svg');"
                    + " font-weight: normal;"
                    + " font-style: normal; " 
                    + " } \n";
            break;

            case 'IcoMoon':
                font += "@font-face { " 
                    + " font-family: 'icomoonregular';"
                    + " src: url('fonts/icomoon.eot');"
                    + " src: url('fonts/icomoon.eot?#iefix') format('embedded-opentype'),"
                    + "     url('fonts/icomoon.woff') format('woff'),"
                    + "     url('fonts/icomoon.ttf') format('truetype'),"
                    + "     url('fonts/icomoon.svg#icomoonregular') format('svg');"
                    + " font-weight: normal;"
                    + " font-style: normal;"
                    + " } \n";
            break;

            case 'Futura':

            break;

            case 'Helvetica':

            break;

            case 'Helvetica Neue':

            break;

            case 'Arial':

            break;

            case 'Myriad':

            break;

            case 'Tipogram':

            break;

            default:
                // console.log('The font name "' + fontName + '" is not supported.');
            break;
        }

        return font;
    }

    /**
     * Has method
     * Will provide a response for a chain of Object properties
     * e.g: x.has('one.of.these.properties');
     */
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
                    active: style._has('fill'),
                    color: {
                        red: style._get('fill.color.red', null),
                        green: style._get('fill.color.green', null),
                        blue: style._get('fill.color.blue', null)
                    },
                    gradient: {
                        colors: [],
                        locations: [],
                        reverse: style._get('layerEffects.gradientFill.reverse', false),
                        type: 'linear',
                        opacity: style._get('layerEffects.gradientFill.opacity.value', 100)
                    },
                    // Background type (linear, radial, angle)
                    type: style._get('layerEffects.gradientFill.type', 'linear')
                },
                opacity: style._get('blendOptions.opacity.value', 100) / 100,
                border: {
                    active: style._has('layerEffects.frameFX'),
                    color: {
                        red: style._get('layerEffects.frameFX.color.red', null),
                        green: style._get('layerEffects.frameFX.color.green', null),
                        blue: style._get('layerEffects.frameFX.color.blue', null)
                    },
                    size: 0
                },
                boxShadow: {
                    active: style._has('layerEffects.dropShadow'),
                    color: style._get('layerEffects.dropShadow.color', {
                        red: 0,
                        green: 0,
                        blue: 0
                    }),
                    opacity: style._get('layerEffects.dropShadow.opacity.value', 0),
                    distance: style._get('layerEffects.dropShadow.distance', 0),
                    blur: style._get('layerEffects.dropShadow.blue', 0),
                    angle: style._get('layerEffects.dropShadow.localLightingAngle.value', 90),
                    spread: style._get('layerEffects.dropShadow.chokeMatte', 0) 
                },
                borderRadius: [],
                zIndex: style.index,
                color: {},
                fontSize: 16,
                fontFamily: style._get('text.textStyleRange[0].textStyle.fontName', 'Arial')
            },
            textColor;

        // -----------------
        // Background styles

        // Fill color overwritted by the blend options
        css.background.color = {
            red: style._get('layerEffects.solidFill.color.red', css.background.color.red),
            green: style._get('layerEffects.solidFill.color.green', css.background.color.green),
            blue: style._get('layerEffects.solidFill.color.blue', css.background.color.blue)
        };

        // TODO: Implement Radial Gradient
        
        // TODO: Implement Angle Gradient

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

        // TODO: Implement border

        // Border Radius
        switch (style._get('path.pathComponents[0].origin.type', '')) {
            case 'roundedRect':
                css.borderRadius = style._get('path.pathComponents[0].origin.radii', []);
            break;

            case 'ellipse':
                // this actually requires to be transffered to an SVG
                // ellipse implementation
                (function () {
                    var bounds = style._get('path.pathComponents[0].origin.bounds', {}),
                        width = bounds.bottom - bounds.top,
                        height = bounds.right - bounds.left;
                    css.borderRadius[0] = height / 2;
                }());
            break;

            default:
                // There is no border radius.
            break;
        }

        // TODO: Implement drop shadow/outer glow

        // TODO: Implement inner shadow/inner glow

        // ---------
        // Text styles
        css.color = style._get('text.textStyleRange[0].textStyle.color', {});

        css.fontSize = style._get('text.textStyleRange[0].textStyle.size', 16) / 2.5;
        // For some reason font size comes in a different format that is 

        // TODO: Line height
        // leading / font size
        // css.lineHeight = ((style._get('text.textStyleRange[0].textStyle.leading', 16) / css.fontSize) * 1000 ) / 1000;


        // [TEMP] Overwrite positioning for now
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
        this.cssName = layer.name
            .replace(/&/, '')
            .replace(/^\//, 'a')
            .replace(/^[0-9]/g, 'a')
            .replace(/\s/g, '-') + '-' + getUnique();
        this.index = layer.index;
        this.text = '';
        this.type = layer.type;

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
                if (true === regenerateImages) {
                    fs.exists(path.resolve(__dirname, 'images/' +  _this.cssName + '.png'), function (exists) {
                        if (true === exists) {
                            _generator.getPixmap(_document.id, layer.id,{}).then(
                                function(pixmap){
                                savePixmap(pixmap, _this.cssName + '.png');
                            },
                                function(err){
                                console.error("err pixmap:",err);
                            }).done();
                        } else {
                            // The image was already generated.
                        }
                    });

                } else {
                    // No regeneration is required.
                }
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

                // In photohop there is the case where bitmap layers have background styles applied
                // but still keep a large portion transparent. This leads to images that cover everything 
                // behind them.
                if ('img' !== this.tag) {
                    if (0 < value.gradient.colors.length) {

                        property += 'linear-gradient(';

                        if (true === value.gradient.reverse) {
                            value.gradient.colors.reverse();
                        }

                        value.gradient.colors.forEach(function (color, index, colors) {
                            property += 'rgba(' + Math.round(color.red) + ','
                                + Math.round(color.green) + ',' 
                                + Math.round(color.blue) + ', '
                                + (value.gradient.opacity / 100).toFixed(2)
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
                } else {
                    property += 'transparent';
                }

            break;

            case 'zIndex':
                property += value;
            break;
            
            case 'border':

            break;

            case 'borderRadius':
                if (0 < value.length) {
                    value.forEach(function (bound) {
                        property += Math.ceil(bound) + 'px ';
                    })
                }

                // Type: roundedRect, ellipse

            break;

            case 'opacity':
                property += value;
            break;

            case 'color':

                if (0 !== Object.keys(value).length) {
                    property += 'rgb('
                        + Math.round(value.red) + ', '
                        + Math.round(value.green) + ', '
                        + Math.round(value.blue) + ')';
                } else {
                    property += 'inherit';
                }

            break;

            case 'fontSize':

                property += Math.round(value) + 'px';

            break;

            case 'boxShadow':
                    /*
                    active: style._has('layerEffects.dropShadow'),
                    color: style._get('layerEffects.dropShadow.color', {
                        red: 0,
                        green: 0,
                        blue: 0
                    }),
                    opacity: style._get('layerEffects.dropShadow.opacity.value', 0),
                    distance: style._get('layerEffects.dropShadow.distance', 0),
                    blur: style._get('layerEffects.dropShadow.blue', 0),
                    angle: style._get('layerEffects.dropShadow.localLightingAngle.value', 90),
                    spread: style._get('layerEffects.dropShadow.chokeMatte', 0) 
                    */
                if (true === value.active) {
                    property += value.distance + 'px 0px ' + value.blur + 'px'
                    + ' rgba(' + Math.round(value.color.red) + ', '
                    + Math.round(value.color.green) + ', '
                    + Math.round(value.color.blue) + ', '
                    + value.opacity + ')'
                } else {
                    // Not active 
                }
            break;

            /*
            case 'lineHeight':
                property += Math.round(value) + 'px';
            break;
            */

            case 'fontFamily':
                if (undefined !== fonts[value]) {
                    property += fonts[value];
                } else {
                    property += value;
                }
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

        if (false === this.visible) {
            return '';
        }

        css += '\n#' + this.cssName + ' {\n';

        var addFont = "";

        Object.keys(this.css).forEach(function (property) {

            // TODO: Add _this.css[property].active testing before trying to create a method.
            
            css += '\t' + _this.getCSSProperty(property) + ';\n'; 
            
            // Implementing certain styles require additional rules based
            // on the type of the element and the property being styled
            if ('textLayer' === _this.type && 'background' === property) {
                // TODO: Fix gradient opacity on for text layers.
                css += '\t' + '-webkit-background-clip: text;\n';
                // css += '\t' + '-webkit-text-fill-color: transparent;\n';
            }

            if ('textLayer' === _this.type && 'fontFamily' === property) {
                addFont = _this.css[property];
            }

            // console.log(getCSSFontFamily(_this[property]));

        });

        css += '}';

        css += getCSSFontFamily(addFont);

        this.siblings.forEach(function (sibling) {
            css += sibling.getCSS();
        });

        return css;
    };

    Layer.prototype.getHTML = function () {
        var html = '',
            content = '',
            attributes = '';

        if (false === this.visible) {
            return '';
        }

        content += this.text;

        this.siblings.forEach(function (sibling) {
            content += sibling.getHTML();
        });

        switch (this.tag) {
            case 'img':
                html += '\n<' + this.tag + ' id="' + this.cssName + '" src="images/' + (this.cssName + '.png') + '" />';
            break;

            case 'div':
                html += '\n<' + this.tag + ' id="' + this.cssName + '">' + content + '</' + this.tag + '>';
            break;

            case 'span':
                html += '\n<' + this.tag + ' id="' + this.cssName + '">' + content + '</' + this.tag + '>';

            break;
        }

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
            _this.html += layer.getHTML();
            _this.css += layer.getCSS();
        });

        this.html = this.header + this.html + this.footer;
    };

    Structure.prototype.toJSON = function (filename) {

        function removeLinks(name, value) {
            if (-1 === ['parent', 'prev', 'next'].indexOf(name)) {
                return value;
            } else {
                return undefined; // When undefined the property is removed from the JSON.
            }
        }

        fs.writeFileSync(filename, JSON.stringify(this.layers, removeLinks, 4));
        console.log('Structure file was saved.');
    };

    Structure.prototype.output = function () {
        fs.writeFileSync(path.resolve(__dirname, 'index.html'), this.html);
        fs.writeFileSync(path.resolve(__dirname, 'style.css'), this.css);
        console.log('Index.html and style.css were created.');
    };

    function runGenerator() {
        var structure = new Structure(psdFile);
        structure.parse();
        structure.link();

        structure.toJSON(path.resolve(__dirname, 'structure.json'));
        structure.refreshCode();

        structure.output();
    }

    // Verificarea de float este simpla:
    // - Daca un element incepe de la marginea unui container
    // - Daca un element nu incepe de la marginea unui container dar are acceasi distanta
    // de sus ca unul care incepe de la marginea unui container
    // - Daca un element este intre alte elemente care au aceeasi distanta intre ele
    // si unul dintre elemente incepe de la marginea unui container
    // - 

    /*
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
    }*/

    exports.init = init;

}());