'use strict'

var fs = require('fs')
	, path = require('path')
	, slash = require('slash')
    , R = require('ramda')

function getProjectPath(document) {
	return path.resolve(__dirname, '..', 'generated', getProjectName(document))
}

function getProjectName(document) {
	return path.basename(slash(document.file), '.psd')
}

function makeProject(document) {
   return {
    'uid': require('node-uuid').v1()
    , 'layers': require('./layers.js')(document)
   } 
}

var save = R.curry(function save(document, folder, file, data) {
    require('./save.js').json(
            path.resolve(getProjectPath(document), folder, file)
            , data
        )
    return data
})

function project(document) {
    save(document, 'source', 'document.json', document) 
    return save(document, 'source', 'project.json', makeProject(document))
}

module.exports = { 
    make: project
    , path: getProjectPath
}

