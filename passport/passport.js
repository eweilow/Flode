
var LocalStrategy = require('passport-local').Strategy;
var bCrypt = require('bcrypt-nodejs');

var users = {};
function getUser(username, callback) {
  callback(null, { firstname: "t", lastname: "p", password: "$2a$10$3b261nsiV33W1kFLBatO3exwGsApvzFYrUWedcUGRSYEH8ZtGbCJK", username: username, roles: ["admin", "user"], id: 0 });
}
function getUserById(id, callback) {
  callback(null, { firstname: "t", lastname: "p", password: "$2a$10$3b261nsiV33W1kFLBatO3exwGsApvzFYrUWedcUGRSYEH8ZtGbCJK", username: "wat", roles: ["admin", "user"], id: 0 });
}
function saveUser(username, data, callback) {
  callback();
}

module.exports.init = function (app, file) {
  
  var passport = require("passport");
  
  passport.serializeUser(function (user, done) {
    done(null, user.id);
  });

  passport.deserializeUser(function (id, done) {
    getUserById(id, function (err, result) {
      if (err) return done(err, false);
      if (!result) return done(null, false, { message: "Incorrect user id" });
      var user = { firstname: result.firstname, lastname: result.lastname, roles: result.roles, username: result.username, id: result.id };

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

        var user = { firstname: result.firstname, lastname: result.lastname, username: result.username, roles: result.roles, id: result.id };
        return done(null, user);
      });
    })
    );

  passport.use('signup', new LocalStrategy({
    passReqToCallback: true // allows us to pass back the entire request to the callback
  },
    function (req, username, password, done) {
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
            return done(null, false, req.flash('message', 'User Already Exists'));
          } else {
            // if there is no user with that email
            // create the user
            var newUser = {};
            // set the user's local credentials
            newUser.username = username;
            newUser.password = createHash(password);
            newUser.email = req.param('email');
            newUser.firstName = req.param('firstName');
            newUser.lastName = req.param('lastName');

            // save the user
            saveUser(username, newUser, function (err) {
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

  // Generates hash using bCrypt
  var createHash = function (password) {
    return bCrypt.hashSync(password, bCrypt.genSaltSync(10), null);
  };
  
  app.use(passport.initialize());
  app.use(passport.session());
  
  app.use(function (req, res, next) {
    res.locals.user = req.user;
    req.is = function (what) {
      return req.user && req.user.roles.indexOf(what) >= 0;
    };
    next();
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
  /*app.post('/login', passport.authenticate('login', {
    successRedirect: '/',
    failureRedirect: '/login' }
  ));*/
  
  app.get('/logout', function(req, res) {
    req.logout();
    res.redirect("/");
  });

};