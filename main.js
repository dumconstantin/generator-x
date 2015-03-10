'use strict'

// Starts the system using the exported document from Generator Core
function start(document) {
  require('./source/project.js')(Object.freeze(document))
}

function error(error) {
  console.error(err)
}

require('generator-core')(function (generator) {
  generator
    .getDocumentInfo()
    .then(start, error)
    .done()
})
