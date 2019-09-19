var fs = require("fs");
var path = require("path");
var writeData = require('write-data');
var logger = require("../../logger/logger");
var AWS = require('aws-sdk');
var git = require("simple-git");
var gitConfig = path.join(__dirname,"../../config/awsConfig/aws.json");
var directoryPath = path.join(__dirname, "../../public/static");
if(!fs.existsSync(directoryPath)) fs.mkdirSync(directoryPath,{recursive:true});
var config = require("../../config/awsConfig/aws.json");
var lambdaDir = path.join(__dirname, "../../public/static/lambda-pipeline-repo-pst");
var configlambda = path.join(__dirname, '../../public/static/lambda-pipeline-repo-pst/config.json');
var awsConfig = require("../../config/awsConfig/pipeline.json");
var gitAWS = require("simple-git/promise")(directoryPath);
var gitConfig = path.join(__dirname, "../../config/awsConfig/aws.json");


var deployCode = function (dirName) {
    return new Promise((resolve, reject)=>{
       
        code(dirName)
        .then(data=>pipeineCheckStatus()
        .then(data=>resolve(data)))
        .catch(err=>reject(err));
    });
}


var code = async function (dirName) {
    await pullAwsRepo().then(data => (console.log(data))).catch(err => console.log(err));
    await deleteFilesFromAwsRepo().then(data => (console.log(data))).catch(err => console.log(err));
    await copyFilesIntoAwsRepo(dirName).then(data => (console.log(data))).catch(err => console.log(err))
    await buildconversion().then(data => (console.log(data))).catch(err => console.log(err))
    await templateConverion().then(data => (console .log(data))).catch(err => console.log(err))
    await codeCommitToAWS().then(data => (console.log(data))).catch(err => console.log(err))
    await pipelineExecute().then(data => (console.log(data))).catch(err => console.log(err))
    
}

var pullAwsRepo = function () {

    return new Promise((resolve, reject) => {
        fs.readFile(gitConfig, function (err, data) {
            if (err) {

                reject(err);
            }
            else if (!fs.existsSync(lambdaDir)) {
                let obj = JSON.parse(data);
                let awsCredential = `${obj.repository}`;

                gitAWS.silent(true)
                    .clone(awsCredential)
                    .then(() => resolve("Aws repository cloned"))
                    .catch(err => reject(err));
            }
            else if (fs.existsSync(lambdaDir)) {

                git(lambdaDir)
                    .reset('--hard')
                    .pull((err, update) => {
                        if (update && update.summary.changes) {
                            require('child_process').exec('npm restart');
                        }
                    });
                resolve("Aws files pull successfully")
            }

        });
    })
}

var deleteFilesFromAwsRepo = function () {
    return new Promise((resolve, reject) => {
        fs.readdir(lambdaDir, function (err, files) {
            if (err) {
                console.log("delete  " + err)
                reject(err);
            }
            else {
                files.forEach((filename) => {
                    var filePath = path.join(lambdaDir, filename);
                    var stat = fs.statSync(filePath);
                    if (stat.isFile() && filename.indexOf(".git") == -1 && filename.indexOf(".gitignore") == -1) {
                        fs.unlink(lambdaDir + "/" + filename, function (err) {
                            if (err) {
                                reject(err);
                            }
                            else {
                                resolve("files deleted from lambda directory succesfully ");
                            }
                        });
                    }
                });
            }
        });
    })
}

var copyFilesIntoAwsRepo = function (dirName) {
    return new Promise((resolve, reject) => {

        var awsRepo = directoryPath + "/" + "DeveloperRepo" + "/" + dirName;

        fs.readdir(awsRepo, function (err, files) {
            if (err) {
                console.log(err)
                reject(err);
            }
            else {
                files.forEach(function (fileName) 
                {
                    var filePath = path.join(awsRepo, fileName);
                    var stat = fs.statSync(filePath);
                    if (stat.isFile()) {
                        var dotIndex = fileName.lastIndexOf(".");
                        var name = fileName.slice(0, dotIndex);
                        var newName = name + path.extname(fileName);
                        var read = fs.createReadStream(path.join(filePath));
                        var write = fs.createWriteStream(path.join(lambdaDir, newName));
                        read.pipe(write);
                    }
                });
                resolve("File copied successfully");
            }
        });
    })
}

var buildconversion = function () {
    return new Promise((resolve, reject) => {
        try {
            var buildFile = {
                "version": 0.2,
                "phases": {
                    "install": {
                        "runtime-versions": {
                            "nodejs": 10
                        }
                    },
                    "build": {
                        "commands": [
                            "npm install",
                            "export BUCKET=lambda-pipeine-s3-pst",
                            "aws cloudformation package --template-file template.yaml --s3-bucket $BUCKET --output-template-file outputtemplate.yaml"
                        ]
                    }
                },
                "artifacts": {
                    "type": "zip",
                    "files": [
                        "template.yaml",
                        "outputtemplate.yaml"
                    ]
                }
            }

            fs.readdir(lambdaDir, function (err, data) {
                if (err) {
                    console.log(err)
                    reject(err)
                }
                else {
                    writeData(lambdaDir + '/buildspec.yml', buildFile, function (err) {
                        if (err) {
                            reject(err)
                        } else {
                            resolve("build success");
                        }
                    })
                }
            });

        } catch (error) {
            console.log("please check build file " + error)
        }
    })
}

var templateConverion = function () {
    return new Promise((resolve, reject) => {
        try {
            if (fs.existsSync(configlambda)) {
                fs.readFile(configlambda, 'utf-8', function (err, data) {
                    if (err) { reject(console.log(err), err, null); }
                    else {
                        let getData = JSON.parse(data);
                        let status = getData.statusCode;

                        var i = 0;
                        var integrationResponses = [];
                        for (var j = 0; j < status.length; j++) {
                            var obj = {
                                "StatusCode": status[j].status
                            }
                            integrationResponses.push(obj);
                        }
                        var resources = {};
                        resources[getData.lambda] = {
                            "Type": "AWS::Serverless::Function",
                            "Properties": {
                                "Handler": getData.name + ".handler",
                                "Runtime": "nodejs10.x",
                                "CodeUri": "./",
                                "Events": {
                                    "MyTimeApi": {
                                        "Type": "Api",
                                        "Properties": {
                                            "Path": getData.path,
                                            "Method": getData.method,  
                                        },
                                        "Integration": {
                                            "Type": "AWS_PROXY",
                                            "MethodResponses" : integrationResponses
                                          },
                                          
                                    }
                                }
                            }
                        };
                        var template = {
                            "AWSTemplateFormatVersion": "2010-09-09",
                            "Transform": "AWS::Serverless-2016-10-31",
                            "Description": "Outputs the time",
                            "Resources": resources
                        }
                        fs.readdir(lambdaDir, function (err, data) {
                            if (err) { reject(err); }
                            else {

                                writeData(lambdaDir + '/template.yaml', template, function (err) {
                                    if (err) {
                                        reject(err)
                                    } else {
                                        resolve("template success");
                                    }
                                })
                            }
                        });
                    }
                });
            }
        } catch (error) {
            console.log("Please provide config file" + error)
        }
    })
}

var codeCommitToAWS = function () {
    return new Promise((resolve, reject) => {
        const REPO = config.repository;
        const gitHubUrl = `${REPO}`;

       
           try {
            git(lambdaDir).add('./*')
            .commit("first commit!")                
              .push(['-u', 'origin', 'master'],
                  () => {
                      resolve("files pushed to AWS repository successfully");
                  });
               
           } catch (error) {
               reject(error);
           }
                
        
    })
}

var pipelineExecute = function () {
    return new Promise((resolve, reject) => {
        const config = {
            accessKeyId: awsConfig.aws_access_key_id,
            secretAccessKey: awsConfig.aws_secret_access_key,
            region: awsConfig.region
        }
        var codepipeline = new AWS.CodePipeline(config);
        var params = {
            name: 'lambda-pipeline-dev'
        };
        codepipeline.startPipelineExecution(params, function (err, data) {
            if (err) { reject("pipeline error" + err, null) }
            else {
                resolve('AWS pipeline run Successfully ');
            }
        });
    })
}

var pipeineCheckStatus = function () {
    return new Promise((resolve, reject) => {
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
                reject("pipeline error" + err)
            }
            else {

                var getdata = JSON.stringify(data)

               // console.log("new" +getdata);
                resolve(data)
            }
        });
    })
}


module.exports.deployCode = deployCode;
