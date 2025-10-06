const cluster = require('cluster');
const os = require('os');
const dotenv = require('dotenv');
dotenv.config();


const numCPUs = 1;
// const numCPUs = os.cpus().length; 
// console.log(numCPUs,"====================") 

if (cluster.isMaster) {
    console.log('Master process running, forking worker');
    const worker = cluster.fork();


    const { cpuAverage, calculateCpu } = require('./services/cpuMonitor');
    const checkInterval = parseInt(process.env.CPU_CHECK_INTERVAL_MS || '5000');
    const threshold = parseInt(process.env.CPU_THRESHOLD || '70');


    let prev = cpuAverage();
    setInterval(() => {
        const cur = cpuAverage();
        const usage = calculateCpu(prev, cur);
        prev = cur;
        console.log(`CPU usage: ${usage}%`);
        if (usage >= threshold) {
            console.warn('CPU threshold exceeded; restarting worker');
            worker.process.kill();
            const w = cluster.fork();
        }
    }, checkInterval);


    cluster.on('exit', (worker, code, signal) => {
        console.log(`worker ${worker.process.pid} died. code=${code} signal=${signal}`);
        cluster.fork();
    });


} else {
    require('./app');
}


// function calculateCpu(previous, current) {
//     const idleDiff = current.idle - previous.idle;
//     const totalDiff = current.total - previous.total;
//     const usage = 100 - Math.round(100 * idleDiff / totalDiff);
//     return usage;
// }

// function cpuAverage() {
//     const cpus = os.cpus();
//     let totalIdle = 0, totalTick = 0;
//     for (const cpu of cpus) {
//         for (const type in cpu.times) {
//             totalTick += cpu.times[type];
//         }
//         totalIdle += cpu.times.idle;
//     }
//     return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
// }