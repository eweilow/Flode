var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");

/* GET upload page. */
router.get('/', function (req, res, next) {  
  var files = fs.readdirSync(path.resolve("./uploads"));
  res.render('browse.jade', { pagetitle: "Browse", files: files });
});


module.exports.router = router;
