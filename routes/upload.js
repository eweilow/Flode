var express = require('express');
var router = express.Router();

/* GET upload page. */
router.get('/', function(req, res, next) {
  res.render('upload.jade', { pagetitle: "Upload" });
});
router.post('/',function(req,res){
  //if(done==true){
  console.log(req.files);
  res.redirect("/browse");
    
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