var path = require("path");
var fs = require("fs");

module.exports = function(session) {

  var Store = session.Store;

  function DatabaseStore(options){
    this.prefix = options.directory || "/";
    this.filename = options.filename || "sessionstore.json";
    this.datatransform = options.transform || null;

    this.filepath = path.join(this.prefix, this.filename);
    this.directory = path.dirname(this.filepath);

    this.sessions = { };

    this.load();
  }

  DatabaseStore.prototype.__proto__ = Store.prototype;

  DatabaseStore.prototype.load = function() {
    if(fs.existsSync(this.filepath))
      this.sessions = JSON.parse(fs.readFileSync(this.filepath, 'utf8'));
  }
  DatabaseStore.prototype.save = function() {
    var stringToSave = JSON.stringify(this.sessions);

    if(!fs.existsSync(this.directory))
      fs.mkdirSync(this.directory);
    fs.writeFile(this.filepath, stringToSave, function (err) {
      if (err) throw err;
    });
  }

  DatabaseStore.prototype.get = function(sid, callback) {
    callback(null, this.sessions[sid]);
  }
  DatabaseStore.prototype.set = function(sid, session, callback) {
    this.sessions[sid] = session;
    this.save();
    callback(null);
  }
  DatabaseStore.prototype.destroy = function(sid, callback) {
    delete this.sessions[sid];
    this.save();
    callback(null);
  }

  return DatabaseStore;
}
