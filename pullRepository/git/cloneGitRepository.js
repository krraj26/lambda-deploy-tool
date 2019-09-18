var fs = require("fs");
var path = require("path");
var directoryPath = path.join(__dirname, '../../public/static');
if (!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath, { recursive: true });
var git = require('simple-git/promise')(directoryPath);
var gitConfig = path.join(__dirname, "../../config/gitConfig/gitProperties.json");
var logger = require("../../logger/logger").logger;

var devRepository = function () {
	return new Promise((resolve, reject) => {
		fs.readFile(gitConfig, function (err, data) {
			if (err) {
				logger.info(err);
			}
			else if (!fs.existsSync(directoryPath + '/DeveloperRepo')) {

				let obj = JSON.parse(data);

				let gitCredential = `https://${obj.username}:${obj.password}@${obj.repository}`;

				git.silent(true)
					.clone(gitCredential)
					.then(() => {
						resolve("Developer repository cloned");
						logger.info("Developer repository cloned")
					})
					.catch((err) => {
						reject(err)
						logger.info(err)
					});
			}
		})
	})
}

module.exports.devRepository = devRepository;