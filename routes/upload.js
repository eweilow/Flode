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
  //}
});


module.exports = router;
