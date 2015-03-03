'use strict'

// Starts the system using the exported document from Generator Core
function start(document) {
    Object.freeze(document)
    require('./source/project.js')(document)
}

function error(error) {
    console.error(err)
}

// Method called by Generator Core once the connection to Photoshop is established
exports.init = function init(generator) {
    generator
        .getDocumentInfo()
        .then(start, error)
        .done()
}
