'use strict'

function start(document) {
    Object.freeze(document)
    require('./source/project.js')(document)
}

function error(error) {
    console.error(err)
}

exports.init = function init(generator) {
    generator
        .getDocumentInfo()
        .then(start, error)
        .done()
}
