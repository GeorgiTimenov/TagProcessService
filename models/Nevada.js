var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   
   judicalDistrictNum: String,
   courtName: String,
   address: String,
   phone: String,
   zipcodes: String,
   filingFee:String,
   courtType:String,
   Filingfeenotes:String
   
});

module.exports = mongoose.model("nevada", campgroundSchema);