const mongoose = require('mongoose');
const PolicySchema = new mongoose.Schema({
    policy_number: { type: String, required: true, index: true },
    start_date: Date,
    end_date: Date,
    category_collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Lob' },
    company_collection_id: { type: mongoose.Schema.Types.ObjectId, ref: 'Carrier' },
    user_id: { type: mongoose.Schema.Types.ObjectId, ref: 'User' }
}, { timestamps: true });
module.exports = mongoose.model('Policy', PolicySchema);