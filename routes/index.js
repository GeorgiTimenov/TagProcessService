var express = require("express");
var router  = express.Router();
var passport = require("passport");
var User = require("../models/user");
var middleware = require("../middleware");

var Admin = require("../models/AdminUser");
/* passport.serializeUser(function (user, done) {
  done(null, user.id);
});

passport.deserializeUser(function (id, done) {
  User.findById(id, function (err, user) {
      done(err, user);
  });
}); */
//root route
router.get("/", function(req, res){
  res.render("campgrounds/index",{campgrounds:null,noMatch: null,allhistory:null});

});

// show register form
router.get("/register", function(req, res){
   res.render("register"); 
});




 
router.post("/register", function(req, res){
  const firstname = req.body.firstname;
  const lastname = req.body.lastname;
  const companyname = req.body.companyname;
  const email = req.body.email;
  const phonenumber = req.body.phonenumber;
  const username = req.body.username;
  const password = req.body.password;
  const newuser = new User();
   newuser.firstname = firstname;
   newuser.lastname = lastname;
   newuser.companyname=companyname;
   newuser.email = email;
   newuser.phonenumber = phonenumber;
   newuser.username = username;
   newuser.password = newuser.encryptPassword(password);
  // Create a new campground and save to DB
  User.create(newuser, function(err, newlyCreated){
    if(err){
    
      req.flash("error", err.message);
      res.redirect("/register");
    } else {
        //redirect back to campgrounds page
       
        req.flash("success", "Welcome! You have successfully signed up. Please login to start your subscription.");
        res.redirect("/login",);
    }
});
});
//show login form
router.get("/login", function(req, res){
 
   res.render("login"); 
});

//handling login logic
router.post('/login',async(req,res) => {
  try {
    const user = await User.findOne({username:req.body.username}).exec();
    if(!user) {
      req.flash("error", "Incorrect Username!");
      res.redirect("/login");
    }
    if(!user.validPassword(req.body.password)){
      req.flash("error", "Incorrect Password!");
      res.redirect("/login");
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/campgrounds';
      delete req.session.redirectTo;
      req.flash("success", user.username+"  logged in!  ");
      res.redirect(redirectTo);
    });
   /*  req.flash("success", "You logged in!  "+ user.username);
        res.redirect("/campgrounds"); */
  }
catch(error) {
     /*  req.flash("error", error.message);
      res.redirect("/login"); */
}

});

router.get("/admin", function(req, res){
 
  res.render("admin"); 
});
router.post('/admin',async(req,res) => {
  try {
    const user = await Admin.findOne({username:req.body.username}).exec();
    if(!user) {
      req.flash("error", "Incorrect Username!");
      res.redirect("/admin");
    }
    if(!user.validPassword(req.body.password)){
      req.flash("error", "Incorrect Password!");
      res.redirect("/admin");
    }
    req.logIn(user, function(err) {
      if (err) { return next(err); }
      var redirectTo = req.session.redirectTo ? req.session.redirectTo : '/adminpanel';
      delete req.session.redirectTo;
      //req.flash("success", "Welcome to  "+ user.username);
      User.find({}, function(err, users) {
        
        res.render("Adminpanel", {userlist: users,admin:user});
      });
      
    });
   /*  req.flash("success", "You logged in!  "+ user.username);
        res.redirect("/campgrounds"); */
  }
catch(error) {
      res.send(error.message);
}

});

// logout route
router.get("/logout", function(req, res){
   req.logout();
   req.flash("success", "Logged you out!");
   res.redirect("/");
});



module.exports = router;