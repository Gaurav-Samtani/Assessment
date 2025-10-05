const express = require('express');
const bodyParser = require('body-parser');
const dotenv = require('dotenv');
dotenv.config();


const { connectMongoose } = require('./config/mongo');
const apiRoutes = require('./routes/route');
const { initAgenda } = require('./services/scheduler');


const app = express();
app.use(bodyParser.json());

require('./models/User');
require('./models/Lob');
require('./models/Carrier');
require('./models/Policy');

app.use('/api', apiRoutes)

app.get('/health', (req, res) => res.json({ ok: true }));


(async () => {
    await connectMongoose();
    await initAgenda();
    const port = process.env.PORT || 3000;
    app.listen(port, () => console.log('Worker listening on port', port));
})();


module.exports = app;