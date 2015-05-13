'use strict'

function writeFile(filePath, data) {
    fs.writeFileSync(mkdir(filePath), data)
    return filePath
}

function mkdir(filePath) {
    mkdirSync(path.dirname(filePath), '0777', true)
    return filePath
}

var saveJSON = R.curry(function saveJSONFunc(filePath, data) {
    writeFile(filePath, JSON.stringify(data, null, 4))
})

function saveStream(filePath) {
    return fs.createWriteStream(mkdir(filePath))
}

module.exports = {
    json: saveJSON,
    stream: saveStream
}