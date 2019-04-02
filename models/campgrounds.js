var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   
   judicalDistrictNum: String,
   courtName: String,
   address: String,
   phone: String,
   zipcodes: String
   
});

module.exports = mongoose.model("colorado", campgroundSchema);