const mongoose = require("mongoose");

const AccountSchema = new mongoose.Schema({
    name: String ,
    email: String,
    password: String,
    role:String
});

const Account = mongoose.model("Account", AccountSchema);

module.exports = Account;