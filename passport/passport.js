
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');
var fs = require("fs");
var id = 2;
var users = [];

var adminUser = null;

var byUsername = {};
var byId = {};
var byGroup = {};

function getUser(username, callback) {
  if (adminUser && username === adminUser.username) return callback(null, adminUser);
  
  if (!byUsername.hasOwnProperty(username)) return callback();
  callback(null, byUsername[username]);
}

function getUserById(id, callback) {
  if (adminUser && id === adminUser.id) return callback(null, adminUser);
  
  if (!byId.hasOwnProperty(id)) return callback();
  callback(null, byId[id]);
}

function saveUser(data, callback) {
  if (byUsername.hasOwnProperty(data.username)) { return callback(new Error("Username already registered.")); }
  
  var user = { username: data.username, password: data.password, name: data.name, roles: data.roles, id: (data.id = id++) };
  users.push(user);  
  byUsername[user.username]  = user;
  byId[user.id] = user;
  
  if (user.roles) {
    user.roles.forEach(function (role) {
      if (!byGroup.hasOwnProperty(role)) byGroup[role] = [];
      byGroup[role].push(user);
    });
  }
  save(callback);
}

function save(callback) {  
  fs.writeFile("./users.json", JSON.stringify({ id: id, users: users }), function (err) {
    if (err) return console.log(err);
    if(callback) callback();
  });
}

module.exports.init = function (app, file) {  
  
  var passport = require("passport");  
  // Generates hash using bCrypt
  var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };
  
  if (fs.existsSync("./users.json")) {
    var data = { users: [], id: 2 };
    var file = fs.readFileSync("./users.json");
    try {
      data = JSON.parse(file);
    } catch(error) {
      
    }
    users = data.users;
    id = data.id;
    
    users.forEach(function (user) {
      byId[user.id] = user;
      byUsername[user.username] = user;
      
      if (user.roles) {
        user.roles.forEach(function (role) {
          if (!byGroup.hasOwnProperty(role)) byGroup[role] = [];
          byGroup[role].push(user);
        });
      }
    });
  } else {
    users = [];
    id = 2;
  }
  
  if (argv.admin && argv.password) {
    adminUser = { id: 1, username: null, password: null, name: "Admin", roles: ["admin", "user"] };

    adminUser.username = argv.admin;
    adminUser.password = createHash(argv.password);
  }
  
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });
  save();

  passport.deserializeUser(function (id, done) {
    getUserById(id, function (err, result) {
      if (err) return done(err, false);
      if (!result) return done(null, false, { message: "Incorrect user id" });
      var user = { name: result.name, roles: result.roles, username: result.username, id: result.id };

      done(null, user);
    });
  });

  // Setting up Passport Strategies for Login and SignUp/Registration
  passport.use('login', new LocalStrategy({
    passReqToCallback: true
  },
    function (req, username, password, done) {
      getUser(username, function (err, result) {
        if (err) return done(err, false);

        if (!result) return done(null, false, { message: "Incorrect username" });

        if (!bCrypt.compareSync(password, result.password)) {
          return done(null, false, { message: "Incorrect password" });
        }

        var user = { name: result.name, username: result.username, roles: result.roles, id: result.id };
        return done(null, user);
      });
    })
    );

  passport.use('signup', new LocalStrategy({
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
    function (req, username, password, done) {
      
      if (!/\d+/g.test(username)) return done(null, false, { message: "Invalid username" });
      var findOrCreateUser = function () {
        // find a user in Mongo with provided username
        getUser(username, function (err, user) {
          // In case of any error, return using the done method
          if (err) {
            console.log('Error in SignUp: ' + err);
            return done(err);
          }
          // already exists
          if (user) {
            console.log('User already exists with username: ' + username);
            return done(null, false, { message: "Username already registered." });
          } else {
            // if there is no user with that email
            // create the user
            var newUser = {};
            // set the user's local credentials
            newUser.username = username;
            newUser.password = createHash(password);
            newUser.name = req.param('name');
            newUser.roles = ["unvalidated"];

            // save the user
            saveUser(newUser, function (err) {
              if (err) {
                console.log('Error in Saving user: ' + err);
                throw err;
              }
              console.log('User Registration succesful');
              return done(null, newUser);
            });
          }
        });
      };
      // Delay the execution of findOrCreateUser and execute the method
      // in the next tick of the event loop
      process.nextTick(findOrCreateUser);
    })
  );

  
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use(function (req, res, next) {
    if (!req.user) {
      req.is = function (what) {  return false; }
      return next();
    }
    
    getUserById(req.user.id, function (err, user) {
      if (err) return next(err);
      
      req.user = user;
      res.locals.user = req.user;
      req.is = function (what) {
        return req.user && req.user.roles && req.user.roles.indexOf(what) >= 0;
      };
      next();
    });
  })
  
  app.get('/login', function(req, res) {
    res.render('login', { });
  });
  
  app.post("/login", function (req, res, next) {
    passport.authenticate('login', function (err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.render('login', { reason: "Invalid username or password." }); }
      req.logIn(user, function (err) {
        if (err) { return next(err); }
        return req.body.redirect ? res.redirect(req.body.redirect) : res.redirect("/");
      });
    })(req, res, next);
  });
  
  app.get("/users", function (req, res) {
    if (!req.is("admin")) { return res.render("invalidpermission", { message: "You need to be admin to do this" }); }
    
    res.render("users", { users: users });
  });
  
  app.get("/users/:id/verify", function (req, res, next) {
    if(!req.is("admin")) { return res.redirect("/users"); }
    
    if (!byId.hasOwnProperty(req.params.id)) {
      return res.render("users", { users: users, message: "That user does not exists" });
    }
    var user = byId[req.params.id];
    user = users[users.indexOf(user)];
    
    var index = user.roles.indexOf("unvalidated");
    if (index >= 0) {
      user.roles.splice(index, 1);
    }
    if(user.roles.indexOf("user") < 0) user.roles.push("user");
    
    save(function (err) {
      if (err) return next(err);
      
      res.redirect("/users");
    });
  });
  
  app.get("/users/:id/unverify", function (req, res, next) {
    if (!req.is("admin"))  { return res.redirect("/users"); }
    
    if (!byId.hasOwnProperty(req.params.id)) {
      return res.render("users", { users: users, message: "That user does not exists" });
    }
    var user = byId[req.params.id];
    user = users[users.indexOf(user)];
    
    var index = user.roles.indexOf("users");
    if (index >= 0) {
      user.roles.splice(index, 1);
    }
    if(user.roles.indexOf("unvalidated") < 0) user.roles.push("unvalidated");
    
    save(function (err) {
      if (err) return next(err);
      
      res.redirect("/users");
    });
  });
  
  app.get("/users/:id/delete", function (req, res, next) {
    if (!req.is("admin"))  { return res.redirect("/users"); }
    
    if (!byId.hasOwnProperty(req.params.id)) {
      return res.render("users", { users: users, message: "That user does not exists" });
    }
    var user = byId[req.params.id];
    users.splice(users.indexOf(user), 1);
    
    save(function (err) {
      if (err) return next(err);
      
      res.redirect("/users");
    });
  });
  
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect("/");
  });

  app.get('/register', function(req, res) {
    res.render('register', { });
  });
  
  app.post("/register", function (req, res, next) {
    passport.authenticate('signup', function (err, user, info) {
      if (err) { return next(err); }
      if (!user) { return res.render('register', { reason: info, username: req.param('username'), name: req.param('name') }); }
      req.logIn(user, function (err) {
        if (err) { return next(err); }
        return req.body.redirect ? res.redirect(req.body.redirect) : res.redirect("/");
      });
    })(req, res, next);
  });
  
};