var express = require('express');
var router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index.jade', { pagetitle: "Home" });
});

/* GET home page. */
router.get('/settings', function(req, res, next) {
  res.render('settings.jade', { pagetitle: "Home" });
});


module.exports = router;
