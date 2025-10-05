const { createAgenda } = require('../config/mongo');
const Message = require('../models/MessageSchedule');

let agenda;

async function initAgenda() {
    agenda = createAgenda();

    agenda.define('insert-message', async job => {
        const { message } = job.attrs.data;
        const m = new Message({ message, scheduledAt: job.attrs.nextRunAt, insertedAt: new Date() });
        await m.save();
    });

    await agenda.start();
}

// makeloop
// arita
async function scheduleMessageAt(date, message) {
    if (!agenda) await initAgenda();
    const job = await agenda.schedule(date, 'insert-message', { message });
    return job;
}


module.exports = { initAgenda, scheduleMessageAt };