'use strict'
var path = require('path')
    , generator = require(path.resolve(__dirname, '../', 'node_modules/generator-core/lib/generator.js'))
    , config = {
        port: 49494
        , hostname: 'localhost'
        , password: '123456'
    }
    
generator.createGenerator().start(config).done(function () {
    console.log('Loaded generator')
    generator.getDocumentInfo()
    .then(function () {
      console.log('Foobar')
    }, console.log('barfoo'))
})

