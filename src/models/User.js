const mongoose = require('mongoose');
const UserSchema = new mongoose.Schema({
    firstName: String,
    dob: Date,
    address: String,
    phone: String,
    state: String,
    zipCode: String,
    email: { type: String, index: true },
    gender: String,
    userType: String
}, { timestamps: true });
module.exports = mongoose.model('User', UserSchema);