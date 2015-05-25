var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");

/* GET upload page. */
router.get('/', function (req, res, next) {  
  var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];
  res.render('browse.jade', { pagetitle: "Browse", files: files });
});

/* GET upload page. */
router.get('/:id', function (req, res, next) {  
  var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];
  res.render('media.jade', { pagetitle: "Media", file: files[req.params.id] });
});


module.exports.router = router;
