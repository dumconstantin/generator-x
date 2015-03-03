'use strict'

var fs = require('fs')
	, path = require('path')
	, slash = require('slash')

function getFolderPath(document) {
	return path.resolve(__dirname, '../', 'generated', getProjectName(document))
}

function getProjectName(document) {
	return path.basename(slash(document.file), '.psd')
}

module.exports = function createProject(document) {
	var save = require('./save.js') 

	save.json(path.resolve(getFolderPath(document), 'source', 'document.json'), document)
	save.json(path.resolve(getFolderPath(document), 'source', 'tree.json'), require('./makeTree.js')(document.layers))
}