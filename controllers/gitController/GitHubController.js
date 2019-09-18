var path = require('path');
var fs = require('fs');
var logger = require("../../logger/logger").logger;
var directoryPath = path.join(__dirname, '../../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });

var getDirectories = function (cb) {
    let devRepo = directoryPath + '/DeveloperRepo';
    let array = [];
    fs.readdir(devRepo, function (err, files) {

        if (err) cb(err, null);

        files.forEach(function (fileName) {

            var filePath = path.join(devRepo, fileName);
            var stat = fs.statSync(filePath);

            if (stat.isDirectory() && fileName.indexOf('.') == -1) {
                array.push({ fileName: fileName, filePath: filePath });
            }
        });
        cb(null, array);
    });

}

module.exports.getDirectories = getDirectories;