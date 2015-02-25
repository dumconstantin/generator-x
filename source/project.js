"use strict"

var fs = require("fs")
	, path = require("path")
	, slash = require("slash")

// All plurals means an array

function getFolderPath(document) {
	return path.resolve(__dirname, "../", "generated", getProjectName(document))
}

function getProjectName(document) {
	return path.basename(slash(document.file), ".psd")
}

function saveDocument(document) {
	fs.writeFileSync(
		path.resolve(getFolderPath(document), "document.json")
		, JSON.stringify(document, null, 4)
	)
}

function createFolder(folderPath) {
	try {
		fs.mkdirSync(folderPath)
	} catch (error) {
		if ('EEXIST' !== error.code)
			throw error
	}
}

exports.save = function saveProject(document) {
	createFolder(getFolderPath(document))
	saveDocument(document)
	return this
}

exports.build = function buildProject(document) {
	var layers = require("./source/layers.js")

	layers.create(document.layers)
	return this
}