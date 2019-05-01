var mongoose = require("mongoose");

var pinalSchema = new mongoose.Schema({
   
   districtNum: String,
   courtName: String,
   address: String,
   phone: String,
   zipcodes: String,
   courtType:String,
   filingFee:String
   
});

module.exports = mongoose.model("pinal", pinalSchema);