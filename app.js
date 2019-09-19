var http = require('http');
var bodyParser = require('body-parser');
var express = require('express');
var path = require('path');
var morgan = require('morgan');
var router = express.Router();
var logger = require("./logger/logger").logger;
require("./pullRepository/git/cloneGitRepository").devRepository();


var gitHubController = require('./controllers/gitController/GitHubController');
var pullFilesFromDev = require('././pullRepository/git/pullFilesfromDevRepo');
var deploy = require("./controllers/awsController/deploy");
var pipelineCheckStatus = require("./controllers/awsController/PipelineStatus");
var app = express();

app.set('port', 8383);
app.use(morgan('dev'));
app.use(bodyParser.urlencoded({ extended: false }));
app.use(bodyParser.json());
app.set('views', __dirname + '/views');
app.set('view engine', 'jade');
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'UI')));
app.use('/', express.static(__dirname + '/index.html'));

app.use(function (req, res, next) {
    res.header("Access-Control-Allow-Origin", "*");
    res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, authentication");
    res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,PATCH,OPTIONS');
    next();
});

router.get('/directories', function (req, res) {
    logger.info(req);
    gitHubController.getDirectories(function (err, response) {
        if (err) {
            logger.error(err);
            res.status(500).send(err);
        } else {
            logger.info(response);
            res.status(200).send(response);
        }
    });
});
router.get('/pullfiles', function (req, res) {
    logger.info(req);

    pullFilesFromDev.devRepository()
    .then(data => { res.status(200).json(data); logger.info(data) })
    .catch(err => { res.status(400).json(err); logger.info(err) });
});

router.post('/deploy/:dirName', function (req, res) {
    logger.info(req);
    if (req.params && req.params.dirName) {
        deploy.deployCode(req.params.dirName)
            .then(data => { res.status(200).json(data); logger.info(data) })
            .catch(err => { res.status(400).json(err); logger.info(err) });
    } else {
        res.status(400).json("path variable missing!");
    }
});


router.get('/status', function (req, res) {
    logger.info(req);
    pipelineCheckStatus.pipeineCheckStatus(function (err, response) {
        if (err) {
            logger.error(err);
            res.status(500).send(err);
        } else {
            logger.info(response);
            res.status(200).send(response);
        }
    });
});

router.get(function (req, res, next) {
    if (req.originalUrl === '/favicon.ico') {
        res.status(204).json({ nope: true });
    } else {
        next();
    }
});

app.use('/', router);

http.createServer(app).listen(app.get('port'), function () {
    logger.info("Express server listening on port " + app.get('port'));
}, function (err) {
    logger.info(err);
});