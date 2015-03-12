'use strict'
var when = require('when')

function generatorPromise() {
    var generator = require(require('path').resolve(__dirname, '../node_modules/generator-core/lib/generator.js')).createGenerator() 

    generator.start({
        port: 49494
        , hostname: 'localhost'
        , password: '123456'
    })
    
    return generator
}

function documentPromise() {
    return generatorPromise().getDocumentInfo()
}

module.exports = {
    getDocumentPromise: documentPromise
}
