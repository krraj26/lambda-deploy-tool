var awsConfig = require("../../config/awsConfig/pipeline.json");
var AWS = require('aws-sdk');

var pipeineCheckStatus = function (cb) {
    const config = {
        accessKeyId: awsConfig.aws_access_key_id,
        secretAccessKey: awsConfig.aws_secret_access_key,
        region: awsConfig.region
    }
    var codepipeline = new AWS.CodePipeline(config);
    var params = {
        name: 'lambda-pipeline-dev'
    };
    codepipeline.getPipelineState(params, function (err, data) {
        if (err) {
            cb("pipeline error" + err, null)
        }
        else {
            cb(null, data)
        }
    });
}

module.exports.pipeineCheckStatus = pipeineCheckStatus;