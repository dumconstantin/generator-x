'use strict'

var fs = require('fs')
	, path = require('path')
	, slash = require('slash')
    , R = require('ramda')
    , U = require('../libs/utils.js')

function getFolderPath(document) {
	return path.resolve(__dirname, '..', 'generated', getProjectName(document))
}

function getProjectName(document) {
	return path.basename(slash(document.file), '.psd')
}

function createProjectDocument(document) {
    return R.pipe(
        U.setProp('uid', require('node-uuid').v1()) 
    )(document)
}

function createProject(document) {
	var save = require('./save.js') 
        , project = createProjectDocument(document)
    
    save.json(path.resolve(getFolderPath(document), 'source', 'document.json'), document)
    save.json(path.resolve(getFolderPath(document), 'source', 'project.json'), project)
    save.json(path.resolve(getFolderPath(document), 'source', 'tree.json'), require('./makeTree.js')(project))

    return project
}

module.exports = createProject

