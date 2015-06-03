var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");


module.exports.router = function (app, offsiterepositories, localrepository) {
 
  router.get("/node/:node", function (req, res, next) {
    var repository = null;
    if (req.params.node === "local") {
      repository = localrepository;
    } else if (offsiterepositories.hasOwnProperty(req.params.node))  {
      repository = offsiterepositories[req.params.node];
    }
    repository.getFilesOfType([".manifest"], function (err, files) {
      if (err) return next(err);
      
      var func = function (data, index, collect, cb) {
        if (index >= data.length) return cb(null, collect);
        
        repository.getFileAsJson(data[index], function (err, file) {
          if (err) return cb(err, null);
          
          file.manifestfile = data[index];
          collect.push(file);
          func(data, index + 1, collect, cb);
        });
      }
      func(files, 0, [], function (err, files) {
        if (err) return next(err);
        
        console.log(files);        
        res.render("browse.jade", { files: files, node: req.params.node});
      });
    });
  });
  
  router.get("/node/:node/:filename", function (req, res, next) {
    var repository = null;
    if (req.params.node === "local") {
      repository = localrepository;
    } else if (offsiterepositories.hasOwnProperty(req.params.node))  {
      repository = offsiterepositories[req.params.node];
    }
    
    if (path.extname(req.params.filename) === ".manifest") {
      repository.getFileAsJson(req.params.filename, function (err, file) {
        if (err) return next(err);
        
        repository.getFile(file.src, function (err, file2) {
          res.render("media", { manifest: file, file: file2 });
        });
      });
    } else return res.write(null).status(500).end();
  });
  
  router.get("/node/:node/raw/:filename", function (req, res, next) {
    var repository = null;
    if (req.params.node === "local") {
      repository = localrepository;
    } else if (offsiterepositories.hasOwnProperty(req.params.node))  {
      repository = offsiterepositories[req.params.node];
    }
    
    if (path.extname(req.params.filename) !== ".manifest") {
      repository.getFile(req.params.filename, function (err, file) {
        if (err) return next(err);
        res.write(file);
        res.end();
      });
    } else return res.write(null).status(500).end();
  });

  
  /* GET upload page. */
  router.get('/', function (req, res, next) {
    var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];
    res.render('browse.jade', { pagetitle: "Browse", files: files });
  });
  
  return router;
}