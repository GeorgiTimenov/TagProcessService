var mongoose = require("mongoose");

var campgroundSchema = new mongoose.Schema({
   
   judicalDistrictNum: String,
   courtName: String,
   address: String,
   phone: String,
   queryCities: String,
   filingFee:String,
   courtType:String
   
});

module.exports = mongoose.model("newmexico", campgroundSchema);