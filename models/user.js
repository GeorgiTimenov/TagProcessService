var mongoose = require("mongoose");
var passportLocalMongoose = require("passport-local-mongoose");
var bcrypt = require('bcrypt-nodejs');
const uniqueValidator = require('mongoose-unique-validator')


var UserSchema = new mongoose.Schema({
    firstname:String,
    lastname:String,
    companyname:String,
    email : {
      type: String,
      unique: true
 },
    phonenumber:{
      type: String,
      unique: true
 },
    username: {
      type: String,
      required: true,
      unique: true
    },
    password: String,
    customerid:String,
    subscription:Boolean
    

});

UserSchema.plugin(passportLocalMongoose);
/* UserSchema.plugin(uniqueValidator);*/
UserSchema.methods.encryptPassword = function(password) {
  return bcrypt.hashSync(password, bcrypt.genSaltSync(5), null);  
};

UserSchema.methods.validPassword = function(password) {
  return bcrypt.compareSync(password, this.password);  
};
module.exports = mongoose.model("User", UserSchema);