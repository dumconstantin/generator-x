"use strict"

function start(document) {
    var project = require("./source/project.js")

    Object.freeze(document)

    project
        .save(document)
        .build(document)
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
