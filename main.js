/** ----------------------------------
 * GeneratorX
 * @author Constantin Dumitrescu
 * @author Bogdan Matei
 * @company Brandup
 * @version 0.1.0
 * -----------------------------------
 * 
 * The GeneratorX has 8 stages:
 *  1. Parse the PSD exported document 
 *  2. Generate images for bitmap PSD layers
 *  3. From the absolute styles, connections between elements will emerge (e.g. floats, overlay, etc)
 *  4. Establish the logical order of dom elements (based on float, etc)
 *  5. Find patterns in styles through css duplication, hierachy and inheritance to optimise the css creation
 *  7. Export the generated HTML and CSS into files
 *
 *
 * @TODO: If the designer has his Types and Rulers in anything else 
 *     than pixels, all values must be converted before using. 
 *     Defaults: types (points) rulers (in?)
 *     
 * @TODO: Retrieve the GenX PSD Test File as an image for left to right comparison.
 *
 * @TODO: It seems that sometimes when you leave PSD for a long time opened (observed behaviour),
 *       all new bitmap layers that you create are not exported to files. Investigate further.
 *
 * @TODO: In the CFG case study there is a layer which makes the image creation system crash.
 * Generated: /Users/constantin/Sites/generatorx/test/plugins/generatorx/images/CFG_Dropbox_FINAL_psd_global-ClientChallenge-leafs_left_global-ClientChallenge-leafs_left-Layer-7-copy-10.png
 * (the layer after the above layer)
 * Assertion failed: (!ctx->write_in_progress_ && "write already in progress"), function Write, file ../src/node_zlib.cc, line 124.
 * [1]    48523 abort      node app -f test/plugins
 */

(function () {
    "use strict";

    var path = require('path');

    var Layer = require('./lib/Layer.js')
    require('./lib/Utils.js');
    var Structure = require('./lib/Structure.js');

    /**
     * UI Component constructor.

    function UIComponent() {

    }

    // () vs []
    // Functions from conventions

    UIComponent.prototype.setSiblings = function (setType, elements) {
        var _this = this;

        Object.keys(elements).forEach(function (elementName) {

            if (undefined === _this.siblings[elementName] && 'list' === setType) {
                _this.siblings[elementName] = [];
            }

            _this.parent.find('.' + elementName).forEach(function (result) {
                var item = {};

                item.element = result;

                elements[elementName].forEach(function (elementSelector) {
                    item[elementSelector] = result.find('.' + elementSelector)[0];
                });

                if ('list' === setType) {
                    _this.siblings[elementName].push(item);
                } else {
                    _this.siblings[elementName] = item;
                }
            });

        });
    };


    /**
     * Slider constructor.
     * Will register a layer and will modify the layer structure to conform
     * to that of a slider/carusel syntax while maintaining the initial logic.

    function Slider(layer) {

        this.parent = layer;
        this.siblings = {};

        this.setSiblings('elements', {
            arrows: ['left', 'right']
        });

        this.setSiblings('list', {
            slides: ['title', 'caption', 'image'],
            bullets: ['title'],
            thumbnails: ['title', 'image']
        });

        console.log(Object.keys(this.siblings.arrows.left));

        return this;
    }
    Slider.prototype = Object.create(UIComponent.prototype);
    Slider.prototype.constructor = Slider;


    // .slider {
        html: '<div id="slider">' +
                    '<div id="slides">{{slider_collection}}</div>' +
                    '<div id="bullets">{{bullet_collection}}></div>' +
                '</div>',
        collections: {
            slider: {
                html: '<div class="slide"><h2>{{title}}</h2><img src="{{image}}" /></div>',
                content: [
                    { title: 'foo bar', image: 'foo.png'},
                    { title: 'baz bar', image: 'baz.png'}
                ],
                params: {
                    orderBy: 'date',
                    order: 'asc',
                    limit: 5
                }
            },
            bullet: {
                html: '<div class="bullet"><span>{{index}}</span></div>'
            }
        }
    }
    .slides.orderBy(date).order(asc).limit(5)
*/

    /**
     * Call GeneratorX to parse the document and output the HTML and CSS files.
     * @param  {JSON} document  The PSD exported data
     * @param  {Generator} generator The reference to the Adobe Generator
     * @return {undefined}
     */
    function runGenerator(document, generator) {

        // TODO: Create image movers. Instead of exporting images to the wordpress
        // or other integration path, export images to the generator path
        // and the let integrations to get their desired images to their images
        // folder.
        var fileName = document.file.lastIndexOf('/') !== -1 ? document.file.substr(document.file.lastIndexOf('/'), document.file.length) : document.file,
            fileNameParts = fileName.split(/_|\./gi),
            projectName = fileNameParts[0],
            pageName = fileNameParts[1];
    
        var structure = new Structure({
            folders: {
                images: path.resolve(__dirname, 'projects/' + projectName + '/images/') + '/',
                fonts: path.resolve(__dirname, 'projects/' + projectName + '/fonts/') + '/',
                src: 'images/',
                // images: path.resolve(__dirname, 'wordpress/images/') + '/',
                styles: 'styles/',
                // src: 'wp-content/themes/generator/images/'
            },
            files: {
                html: path.resolve(__dirname, 'projects/' + projectName + '/' + pageName + '.html'),
                css: path.resolve(__dirname, 'projects/' + projectName + '/styles/' + pageName + '.css'),
                cssFileName: pageName + '.css',
                document: path.resolve(__dirname, 'projects/' + projectName + '/generator/' + 'document.json'),
                structure: path.resolve(__dirname, 'projects/' + projectName + '/generator/' + 'structure.json')
            },
            wordpress: {},
            document: document,
            generator: generator
        });

        // structure.registerUiComponent(Slider);

        structure.events.on('imagesFinished', function () {

            structure
                .refreshImageBoundries()
                .refreshParentBoundries()
                // .optimiseCode()
                .saveStructureToJSON()
                .refreshCode()
                .generateLogicStructure()
                // .parseUIStructure()
                .outputCode();
                // .outputToWordpress();

            // All work is done and can safely exit.
            // process.exit(0);
        });     

        structure
            .createLayers(structure.parent.siblings, structure.document.layers)
            .linkLayers()
            .generateCssIds()
            .queueImagesForGeneration()
            .startImageGeneration();
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


    // Init
    exports.init = function (generator) {
        
        generator.getDocumentInfo().then(

            function (document) {
                runGenerator(document, generator);
            },
            
            function (err) {
                console.error(" Error in getDocumentInfo:", err);
            }

        ).done();    
    };

}());