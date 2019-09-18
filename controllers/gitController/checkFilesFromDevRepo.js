var path = require('path');
var fs = require('fs');
var logger = require("../../logger/logger").logger;
var directoryPath = path.join(__dirname, '../../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });

var checkFilesFromDevRepo = function(testPath,cd)
{   
    var configFile = testPath + "/config.json";
    var packageFie = testPath + "/package.json";
    var indexFile = testPath + "/index.js"

    fs.readdir(testPath, function(err, files)
    {

        if (err) {
            console.log(err, null)
            
        }
        else {
            files.forEach((filename) => {
                var filePath = path.join(testPath, filename);
                var stat = fs.statSync(filePath);
                if (stat.isFile() && filename == ) {
                    
                }
            });
        }
    })
}

module.exports.checkFilesFromDevRepo = checkFilesFromDevRepo;