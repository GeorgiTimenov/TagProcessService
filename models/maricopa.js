var mongoose = require("mongoose");

var maricopaSchema = new mongoose.Schema({
   
   districtNum: String,
   courtName: String,
   address: String,
   phone: String,
   zipcodes: String
   
});

module.exports = mongoose.model("maricopa", maricopaSchema);