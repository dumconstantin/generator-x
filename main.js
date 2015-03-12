'use strict'

// Starts the system using the exported document from Generator Core
function start(document) {
  require('./source/project.js')(Object.freeze(document))
}

require('./source/generatorInterface.js').getDocumentPromise().done(start)
