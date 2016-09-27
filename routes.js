var express = require('express');
var router = express.Router();
var mainController = require('./server/controller');
router.get('/', mainController.slash);
module.exports = router;