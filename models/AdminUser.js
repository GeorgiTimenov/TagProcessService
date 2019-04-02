var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var bcrypt = require('bcrypt-nodejs');


var AdminSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    companyname:String,
    email : {
      type: String,
      unique: true
 },
    phonenumber:{
      type: Number,
      unique: true
 },
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: String,

});

AdminSchema.plugin(passportLocalMongoose);
/* UserSchema.plugin(uniqueValidator);*/
AdminSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);  
};

AdminSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);  
};
module.exports = mongoose.model("Admin", AdminSchema);