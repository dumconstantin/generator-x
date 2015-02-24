(function () {
	"use strict"

	var fs = require("fs")
		, path = require("path")
		, slash = require("slash")

	// All plurals means an array

	function getFolderPath(document) {
		return path.resolve(__dirname, "../", "projects", getProjectName(document))
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

	function createFolder(document) {
		if (false === fs.existsSync(getFolderPath(document))) {
			fs.mkdirSync(getFolderPath(document))
		}
	}

	exports.save = function saveProject(document) {
		createFolder(document)
		saveDocument(document)
	}

	exports.build = function buildProject(document) {
		var layers = require("./source/layers.js")

		layers.create(document.layers)
	}

}())