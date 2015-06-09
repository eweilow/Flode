var config = require("file-distribute").config;
var cfg = config.readOrMake("./config/defaultmaster.json", function () { 
  return { port: 8081, basepath: "./files/master", keyfile: "./secret/keys.json", minimumretrytime: 100, allowedfiletypes: [".manifest"] };
});
cfg = config.override(argv, cfg);

var master = require("file-distribute").master;
master.configuration(cfg);
master.listen();  
master.initialize();