var mongoose = require("mongoose");

var commentSchema = mongoose.Schema({
    search:String,
    courtName: String,
    address : String,
    phone :String,
    username: String
});

module.exports = mongoose.model("Comment", commentSchema);

