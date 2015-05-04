// Node libs 
GLOBAL.path = require('path')
GLOBAL.fs = require('fs')

// Node modules
GLOBAL.R = require('ramda')
GLOBAL.uuid = require('node-uuid').v1
GLOBAL.when = require('when')
GLOBAL.slash = require('slash')
GLOBAL.PNG = require('pngjs').PNG
GLOBAL.mkdirSync = require('node-fs').mkdirSync
GLOBAL.generatorCore = require('./node_modules/generator-core/lib/generator.js')


// Application modules
GLOBAL.generator = require('./source/generator.js')
GLOBAL.save = require('./source/save.js')
GLOBAL.project = require('./source/project.js')
GLOBAL.layer = require('./source/layer.js')
GLOBAL.image = require('./source/image.js')
GLOBAL.style = require('./source/style.js')

// Libraries
GLOBAL.U = require('./libs/utils.js')
