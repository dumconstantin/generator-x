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

    var fs = require('fs'),
        path = require('path'),
        Structure = require('./lib/Structure.js'),
        archiver = require('archiver');

    require('./lib/Utils.js');

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
            pageName = fileNameParts[1],
            projectFolder = path.resolve(__dirname, 'projects/' + projectName);

        if (false === fs.existsSync(projectFolder)) {
            fs.mkdirSync(projectFolder);
            fs.mkdirSync(projectFolder + '/images/');
            fs.mkdirSync(projectFolder + '/fonts/');
            fs.mkdirSync(projectFolder + '/generator/');
            fs.mkdirSync(projectFolder + '/styles/');
        }

        var structure = new Structure({
            folders: {
                images: path.resolve(__dirname, 'projects/' + projectName + '/images/') + '/',
                fonts: path.resolve(__dirname, 'projects/' + projectName + '/fonts/') + '/',
                src: 'images/',
                styles: 'styles/',
                fontSource: path.resolve(__dirname, 'fonts/')
            },
            files: {
                html: path.resolve(__dirname, 'projects/' + projectName + '/' + pageName + '.html'),
                css: path.resolve(__dirname, 'projects/' + projectName + '/styles/' + pageName + '.css'),
                cssFileName: pageName + '.css',
                document: path.resolve(__dirname, 'projects/' + projectName + '/generator/' + 'document.json'),
                structure: path.resolve(__dirname, 'projects/' + projectName + '/generator/' + 'structure.json'),
                integration: path.resolve(__dirname, 'projects/' + projectName + '/generator/' + 'integration.json')
            },
            wordpress: {},
            document: document,
            generator: generator
        });

        structure.events.on('imagesFinished', function () {

            structure
                .refreshImageBoundries()
                .refreshParentBoundries()
                .parseUiConventions()
                .optimiseCode()
                .saveStructureToJSON()
                .refreshCode()
                .generateLogicStructure()

                .getIntegration()
                .outputCode();
                // .outputToWordpress();
        });

        structure.events.on('structureFinished', function () {
            var archive = archiver('zip'),
                output;

            archive.on('error', function(err){
                throw err;
            });


            archive.bulk([
                { src: [projectFolder + '/**'], dest: projectName}
            ]);

            output = fs.createWriteStream(projectFolder + '/' + projectName + '_generated.zip');

            output.on('close', function () {
                console.log('Archive generation finished.');
                console.log('Finished.');

                process.send({
                    projectName: projectName,
                    fileName: pageName + '.html'
                });

                process.exit(0);
            });

            archive.pipe(output);
            archive.finalize();
        });

        structure
            .createLayers(structure.parent.siblings, structure.document.layers)
            .linkLayers()
            .generateCssIds()
            .queueImagesForGeneration()
            .startImageGeneration();
    }

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