const mongoose = require('mongoose');

const CarrierSchema = new mongoose.Schema({
    company_name: String
}, { timestamps: true }); 

module.exports = mongoose.model('Carrier', CarrierSchema);