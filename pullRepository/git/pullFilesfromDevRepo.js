var fs = require("fs");
var path = require("path");
var directoryPath = path.join(__dirname, '../../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
var gitConfig = path.join(__dirname, "../../config/gitConfig/gitProperties.json");
var logger = require("../../logger/logger").logger;

var devRepository = function () {
    return new Promise((resolve, reject) => {
        fs.readFile(gitConfig, function (err, data) {
            if (err) {
                logger.info(err);
            }
            else if (fs.existsSync(directoryPath + '/DeveloperRepo')) {

                require('simple-git/promise')(directoryPath + '/DeveloperRepo')
                    .reset('--hard')
                    .pull((err, update) => {
                        if (update && update.summary.changes) {
                            require('child_process').exec('npm restart');
                        }
                    });
                resolve("Data pull Success");
            }
        });
    });

}

module.exports.devRepository = devRepository;