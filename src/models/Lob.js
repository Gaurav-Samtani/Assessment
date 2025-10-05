const mongoose = require('mongoose');
const CategorySchema = new mongoose.Schema({
    category_name: String
}, { timestamps: true });
module.exports = mongoose.model('Lob', CategorySchema);