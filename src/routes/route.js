const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const { Worker } = require('worker_threads');
const Policy = require('../models/Policy');
const User = require('../models/User');
const { scheduleMessageAt } = require('../services/scheduler');


// ================= Upload Routes =================
const upload = multer({ dest: path.join(__dirname, '../../uploads/') });
router.post('/upload', upload.single('file'), async (req, res) => {
    let responded = false;
    try {
        if (!req.file) return res.status(400).json({ error: 'file required' });
        const filePath = req.file.path;
        const worker = new Worker(path.join(__dirname, '../workers/fileWorker.js'), { workerData: { filePath, mongoUri: process.env.MONGO_URI } });
        // console.log(worker,"workerrrrrrrrrrr")
        console.log("step 1")
        worker.on('message', msg => {
            // console.log(msg,"============")
            if (msg.type === 'done') {
                // console.log("step 2")
                responded = true;
                res.json({ status: 'completed', results: msg.results });
                // console.log("step 3")
                worker.terminate();
            } else if (msg.type === 'error') {
                // console.log("step 4")
                responded = true;
                res.status(500).json({ error: msg.error });
                // console.log("step 5")
                worker.terminate();
            }
        });

        worker.on('error', err => {
            // console.log("step 6")
            responded = true;
            res.status(500).json({ error: err.message });
            // console.log("step 7")
            worker.terminate();
        });

            worker.on('exit', code => {
            if (!responded && code !== 0) {
                responded = true;
                // console.log("step 8")
                res.status(500).json({ error: `Worker stopped with exit code ${code}` });
                // console.log("step 9")
            }
        });

    } catch (err) {
        res.status(500).json({ error: err.message });
        worker.terminate();
    }
});

// ================= Policy Routes =================
router.get('/search', async (req, res) => {
    const { username } = req.query; 
        if (!username) return res.status(400).json({ error: 'username required as query param' });
    
    
        try {
            const users = await User.find({ $or: [{ firstName: new RegExp(username, 'i') }, { email: new RegExp(username, 'i') }] });
            const userIds = users.map(u => u._id);
            // console.log(userIds,"=====")
    
            const policies = await Policy.find({ user_id: { $in: userIds } })
                .populate('category_collection_id')
                .populate('company_collection_id')
                .populate('user_id');
            // console.log(policies,"=======")
            // console.log(JSON.stringify(policies, null, 2));
    
            res.json({ count: policies.length, policies });
        } catch (err) {
            res.status(500).json({ error: err.message });
        }
});

router.get('/aggregate-by-user', async (req, res) => {
    try {
        const agg = await Policy.aggregate([
            {
                $group: {
                    _id: '$user_id',
                    policyCount: { $sum: 1 },
                    earliestStart: { $min: '$start_date' },
                    latestEnd: { $max: '$end_date' }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'user'
                }
            },
            { $unwind: { path: '$user', preserveNullAndEmptyArrays: true } },
            {
                $project: {
                    user: { firstName: '$user.firstName', email: '$user.email' },
                    policyCount: 1,
                    earliestStart: 1,
                    latestEnd: 1
                }
            }
        ]).allowDiskUse(true);

        // console.log(agg,"aggregate testing")
        res.json(agg);
    } catch (err) {
        console.log(err,"=======error test")
        res.status(500).json({ error: err.message });
    }
});

// ================= Schedule Routes =================
router.post('/schedule', async (req, res) => {
    try {
        const { message, day, time } = req.body;
        if (!message || !day || !time) return res.status(400).json({ error: 'message, day and time required' });


        const scheduledAt = new Date(`${day}T${time}:00`);
        if (isNaN(scheduledAt)) return res.status(400).json({ error: 'invalid day/time' });


        const job = await scheduleMessageAt(scheduledAt, message);
        // console.log(job,"===========job.attrs")
        res.json({ status: 'scheduled', nextRunAt: job.attrs.nextRunAt });
    } catch (err) {
        res.status(500).json({ error: err.message });
    }
});

module.exports = router;