const os = require('os');


function cpuAverage() {
    const cpus = os.cpus();
    let totalIdle = 0, totalTick = 0;
    for (const cpu of cpus) {
        for (const type in cpu.times) {
            totalTick += cpu.times[type];
        }
        totalIdle += cpu.times.idle;
    }
    return { idle: totalIdle / cpus.length, total: totalTick / cpus.length };
}

// returns percent CPU usage between two samples
function calculateCpu(previous, current) {
    const idleDiff = current.idle - previous.idle;
    const totalDiff = current.total - previous.total;
    const usage = 100 - Math.round(100 * idleDiff / totalDiff);
    return usage;
}


module.exports = { cpuAverage, calculateCpu };