'use strict'

// Starts the system using the exported document from Generator Core
function start(document) {
  require('./source/project.js').make(document)
}

require('./source/generatorInterface.js').documentP().done(start)
