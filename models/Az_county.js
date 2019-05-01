var mongoose = require("mongoose");

var azcountySchema = new mongoose.Schema({

   judicalDistrictNum: String,
   courtName: String,
   address: String,
   phone: String,
   courtType:String,
   countyname: String,
   filingFee:String
   
});

module.exports = mongoose.model("azcount", azcountySchema);


