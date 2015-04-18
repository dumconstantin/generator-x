'use strict'
var save = require('./source/save.js')
    , path = require('path')
    , project = require('./source/project.js')
    , layer = require('./source/layer.js')
    , generator = require('./source/generator.js')
    , image = require('./source/image.js')
    , when = require('when')

// Starts the system using the exported document from Generator Core
function start(document) {
  var source = project.file(document, 'source')

  save.json(source('document.json'), document)
  save.json(source('layers.json'), layer.all(document))
  when.all(image.allP(document)).done(function saveImagesFunc(images) {
    console.log(images)
    save.json(source('images.json'), images)
  })
}

generator.documentP().done(start)
