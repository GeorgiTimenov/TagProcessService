var mongoose = require("mongoose");

var azzipcodeSchema = new mongoose.Schema({
   
   judicalDistrictNum: String,
   courtName: String,
   address: String,
   phone: String,
   courtType:String,
   zipcodes: String,
   filingFee:String
   
});

module.exports = mongoose.model("azzipcode", azzipcodeSchema);