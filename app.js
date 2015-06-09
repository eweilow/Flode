argv = require("optimist").string("admin").string("password").argv;

if (argv.master) {
  var m = require("./master_run.js");
} else if (argv.node) {
  var n = require("./node_run.js");
}