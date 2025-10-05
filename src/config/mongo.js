const mongoose = require('mongoose');
const Agenda = require('agenda');
const dotenv = require('dotenv');
dotenv.config();

const mongoUri = process.env.MONGO_URI;

async function connectMongoose() {
    await mongoose.connect(mongoUri);
}

function createAgenda() {
    return new Agenda({ db: { address: mongoUri, collection: process.env.AGENDA_COLLECTION || 'agendaJobs' } });
}


module.exports = { connectMongoose, createAgenda };