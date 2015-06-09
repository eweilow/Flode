var express = require('express');
var router = express.Router();

module.exports.router = function (allowedfiletypes) {
  /* GET upload page. */
  router.get('/', function (req, res, next) {
    if (req.is("unvalidated")) { return res.render('invalidpermission', { message: "You are not verified yet." }); }
    else if (!req.is("user") && !req.user) { return res.render('login', { reason: "You need to be logged in." }); }
    else if (!req.is("user")) { return res.render('login', { reason: "Not permitted to do this." }); }

    res.render('upload.jade', { pagetitle: "Upload" });
  });


  var fs = require("fs");
  var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];
  var gm = require('gm');

  var path = require("path");

  var images = [".png", ".jpg", ".gif", ".bmp"];

  router.post('/', function (req, res, next) {
    if (req.is("unvalidated")) { return res.render('invalidpermission', { message: "You are not verified yet." }); }
    else if (!req.is("user") && !req.user) { return res.render('login', { reason: "You need to be logged in." }); }
    else if (!req.is("user")) { return res.render('login', { reason: "Not permitted to do this." }); }

    var filepath = req.files.media.name;
    var ext = path.extname(filepath).toLowerCase();
    
    if(allowedfiletypes.length > 0 && allowedfiletypes.indexOf(ext) < 0) { return res.render('invalidpermission', { message: "You are not allowed to upload this type of file." });}

    var thumbpath = path.basename("thumb_" + filepath, path.extname(filepath)) + ".jpg";
    var manifestpath = path.basename(filepath, path.extname(filepath)) + ".manifest";

    var dir = "./public_media";

    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir);
    }

    var file = path.resolve(path.join("./uploads", filepath));
    var outfile = path.join(dir, filepath);
    var thumb_outfile = path.join(dir, thumbpath);
    var manifest_outfile = path.join(dir, manifestpath);

    console.log("Reading from", file);

    console.log("Saving to %s and %s", outfile, thumb_outfile);

    var data = { author: { username: req.user.username, id: req.user.id }, src: "/" + req.files.media.name, thumb: "/" + thumbpath, title: req.body.title, description: req.body.descr, date: req.body.date, tags: req.body.tags ? req.body.tags.split(",") : [] };
    var result = function (d) {
      fs.writeFileSync(manifest_outfile, JSON.stringify(d));
      res.redirect("/browse/node/local");
    };
    if (images.indexOf(ext) >= 0) {
      gm(file).autoOrient().thumb(150, 150, thumb_outfile, 75, function (err) {
        if (err) return next(err);
        gm(file).autoOrient().write(outfile, function (err) {
          if (err) return next(err);

          result(data);
        });
      });
    } else {
      delete data.thumb;
      fs.writeFileSync(outfile, fs.readFileSync(file));
      result(data);
    }
 
  
    
    //}
  
  });
  return router;
};