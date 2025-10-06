const mongoose = require('mongoose');

const AgentSchema = new mongoose.Schema({
    name: { type: String, required: true }
}, { timestamps: true }); 

module.exports = mongoose.model('Agent', AgentSchema);