var express = require('express');
var router = express.Router();
var fs = require("fs");
var path = require("path");


module.exports.router = function (app, offsiterepositories, localrepository) {
 
  router.get("/node/:node", function (req, res, next) {
    var repository = null;
    var offsite = [{ href: "/browse/node/local", title: "local" }];
    if (req.params.node === "local") {
      repository = localrepository;
      offsite = Object.keys(offsiterepositories).map(function (it) { return { href: it, title: it } });
    } else if (offsiterepositories.hasOwnProperty(req.params.node))  {
      repository = offsiterepositories[req.params.node];
    }
    var tags = {};
    repository.getFilesOfType([".manifest"], function (err, files) {
      if (err) return next(err);
      
      var func = function (data, index, collect, cb) {
        if (index >= data.length) return cb(null, collect);
        
        repository.getFileAsJson(data[index], function (err, file) {
          if (err) return cb(err, null);
          
          file.tags.forEach(function (tag) {
            tag = tag.toLowerCase();
            if (!tags.hasOwnProperty(tag)) tags[tag] = [];
            tags[tag].push(file);
          });
          
          file.manifestfile = data[index];
          collect.push(file);
          func(data, index + 1, collect, cb);
        });
      }
      func(files, 0, [], function (err, files) {
        if (err) return next(err);
        
        res.render("browse.jade", { tags: tags, files: files, base: "/browse/node/" + req.params.node, node: req.params.node, offsite: offsite});
      });
    });
  });
  
  router.get("/node/:node/tag/:tag", function (req, res, next) {
    var repository = null;
    var offsite = [{ href: "/browse/node/" + req.params.node, title: req.params.node }];
    if (req.params.node === "local") {
      repository = localrepository;
      //offsite = Object.keys(offsiterepositories).map(function (it) { return { href: it, title: it } });
    } else if (offsiterepositories.hasOwnProperty(req.params.node))  {
      repository = offsiterepositories[req.params.node];
    }
    
    //offsite.push();
    
    repository.getFilesOfType([".manifest"], function (err, files) {
      if (err) return next(err);
      
      var func = function (data, index, collect, cb) {
        if (index >= data.length) return cb(null, collect);
        
        repository.getFileAsJson(data[index], function (err, file) {
          if (err) return cb(err, null);
          
          console.log(file.tags.map(function (a) { return a.toLowerCase(); }), req.params.tag);
          if (file.tags.map(function (a) { return a.toLowerCase(); }).indexOf(req.params.tag) >= 0) {
            file.manifestfile = data[index];
            collect.push(file);
          }
          func(data, index + 1, collect, cb);
        });
      }
      func(files, 0, [], function (err, files) {
        if (err) return next(err);
        
        res.render("browse.jade", { tag: req.params.tag, files: files, base: "/browse/node/" + req.params.node, node: req.params.node, offsite: offsite});
      });
    });
  });  

  var routeFile = function (req, res, next) {
    var repository = null;
    if (req.params.node === "local") {
      repository = localrepository;
    } else if (offsiterepositories.hasOwnProperty(req.params.node)) {
      repository = offsiterepositories[req.params.node];
    }

    if (path.extname(req.params.filename) === ".manifest") {
      repository.getFileAsJson(req.params.filename, function (err, file) {
        if (err) return next(err);

        res.render("media", { offsite: [{ href: "/browse/node/" + req.params.node, title: req.params.node }], name: req.params.node, base: "/browse/node/" + req.params.node, manifest: file });
      });
    } else return res.status(500).end();
  };
  
  router.get("/node/:node/:filename", routeFile);
  router.get("/user/:id/node/:node/:filename", routeFile);
  router.get("/node/:node/tag/:tag/:filename", routeFile);
  
  var routeRaw = function (req, res, next) {
    var repository = null;
    if (req.params.node === "local") {
      repository = localrepository;
    } else if (offsiterepositories.hasOwnProperty(req.params.node)) {
      repository = offsiterepositories[req.params.node];
    }

    if (path.extname(req.params.filename) !== ".manifest") {
      repository.getFile(req.params.filename, function (err, file) {
        if (err) return next(err);
        res.write(file);
        res.end();
      });
    } else return res.write(null).status(500).end();
  };
  router.get("/node/:node/raw/:filename", routeRaw);
  router.get("/user/:id/node/:node/raw/:filename", routeRaw);
  router.get("/node/:node/tag/:tag/raw/:filename", routeRaw);
  
  
  router.get("/user/:id/node/:node", function (req, res, next) {
    var repository = null;
    var offsite = [{ href: "/browse/node/local", title: "repository" }];
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

        var r = [];

        files.forEach(function (file) {
          if (file.author && file.author.id == req.params.id) {
            r.push(file);
          }
        });

        res.render("browse.jade", { files: r, base: "/browse/node/" + req.params.node, node: "user " + (r && r.length > 0 ? r[0].author.username : ""), offsite: [{href: "/browse/node/" + req.params.node, title: req.params.node}]});
      });
    });
  });
  
  return router;
}