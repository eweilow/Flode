var express = require('express');
var router = express.Router();

/* GET upload page. */
router.get('/', function (req, res, next) {
  if (!req.is("user")) { return res.render('login', { reason: "You need to be logged in", redirect: req.originalUrl }); }
  
  res.render('upload.jade', { pagetitle: "Upload" });
});


var fs = require("fs");
var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];
var gm = require('gm');

var path = require("path");

router.post('/', function (req, res, next) {
  if (!req.is("user")) { return res.render('login', { reason: "You need to be logged in" }); }
  //if(done==true){
  
  var filepath = req.files.media.name;
  var thumbpath = path.basename("thumb_" + filepath, path.extname(filepath)) + ".jpg";
  files.push({ path: "/"+req.files.media.name, thumb: "/"+thumbpath, title: req.body.title, description: req.body.descr, date: req.body.date, tags: req.body.tags ? req.body.tags.split(",") : [ ] });
  
  fs.writeFileSync("./meta.json", JSON.stringify(files));
    
   var dir = "./public_media";

  if (!fs.existsSync(dir)){
      fs.mkdirSync(dir);
   }
  
  var file = path.resolve(path.join("./uploads", filepath));
  var outfile = path.join("./public_media", filepath);
  var thumb_outfile = path.join("./public_media", thumbpath);
  
  console.log("Reading from", file);
  
  console.log("Saving to %s and %s", outfile, thumb_outfile);
  
  gm(file).autoOrient().thumb(150, 150, thumb_outfile, 75, function (err) {
    if (err) return next(err);
    gm(file).autoOrient().write(outfile, function (err) {
      if (err) return next(err);
      for (var index = 0; index < funcs.length; index++) {
        var element = funcs[index];      
        element(req.files.media.name);
      }
      res.redirect("/browse");
    });  
  });
    
  //}
  
});


var funcs = [ ];
module.exports.router = router;
module.exports.callback = function (func) { 
  funcs.push(func);
};