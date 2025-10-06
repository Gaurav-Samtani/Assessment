const mongoose = require('mongoose');
const MessageSchema = new mongoose.Schema({
    message: String,
    scheduledAt: Date,
    insertedAt: Date
}, { timestamps: true });

module.exports = mongoose.model('MessageSchedule', MessageSchema);