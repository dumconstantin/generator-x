'use strict'

function projectPath(document) {
    return path.resolve(__dirname, '..', 'generated', projectName(document))
}

function projectName(document) {
    return path.basename(slash(document.file), '.psd')
}

var filePath = R.curry(function filePathFunc(document, folder, file) {
    return path.resolve(projectPath(document), folder, file)
})

module.exports = {
    path: projectPath,
    file: filePath,
    name: projectName
}