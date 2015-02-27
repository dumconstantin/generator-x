'use strict'

var fs = require('fs')
	, path = require('path')
	, mkdirSync = require('node-fs').mkdirSync

function saveFile(filePath, data) {
	mkdirSync(path.dirname(filePath), '0777', true)
	fs.writeFileSync(filePath, data)
}

module.exports.json = function (filePath, data) {
	saveFile(filePath, JSON.stringify(data, null, 4))
}

module.exports.font = function () {}
module.exports.image = function () {}