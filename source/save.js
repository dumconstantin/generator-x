'use strict'
var fs = require('fs')
  , path = require('path')
  , mkdirSync = require('node-fs').mkdirSync
  , PNG = require('pngjs').PNG
  , when = require('when')
  , R = require('ramda')

function writeFile(filePath, data) {
  fs.writeFileSync(mkdir(filePath), data)
  return filePath
}

function mkdir(filePath) {
    mkdirSync(path.dirname(filePath), '0777', true)
    return filePath
}

function saveJSON(filePath, data) {
  writeFile(filePath, JSON.stringify(data, null, 4))
}

function saveStream(filePath) {
  return fs.createWriteStream(mkdir(filePath))
}

module.exports = {
  json: saveJSON
  , stream: saveStream
}
