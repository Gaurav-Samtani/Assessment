const mongoose = require('mongoose');
const AccountSchema = new mongoose.Schema({
    accountName: String,
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true }); 

module.exports = mongoose.model('Account', AccountSchema);