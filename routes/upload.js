var express = require('express');
var router = express.Router();

/* GET upload page. */
router.get('/', function(req, res, next) {
  res.render('upload.jade', { pagetitle: "Upload" });
});


var fs = require("fs");
var files = fs.existsSync("./meta.json") ? JSON.parse(fs.readFileSync("./meta.json")) : [];

router.post('/',function(req,res){
  //if(done==true){
  
  files.push({ path: "/"+req.files.media.name, title: req.body.title, description: req.body.descr, date: req.body.date, tags: req.body.tags.split(",") });
  console.log(files);
  res.redirect("/browse");
  
  fs.writeFileSync("./meta.json", JSON.stringify(files));
    
    for (var index = 0; index < funcs.length; index++) {
      var element = funcs[index];
      
         element(req.files.media.name);
    }
  //}
});


var funcs = [ ];
module.exports.router = router;
module.exports.callback = function (func) { 
  funcs.push(func);
};