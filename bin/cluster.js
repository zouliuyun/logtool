var cluster = require('cluster');
var cpuNums = require('os').cpus().length;

if (cluster.isMaster) {
    var workCount = cpuNums / 4;
    if(workCount < 2) workCount = 2;
    for (var i = 0; i < workCount; ++i) cluster.fork();
} else {
    require("./www");
}

cluster.on('exit', function(worker, code, signal) {
    console.log('worker %d died (%s). restarting...', worker.process.pid, signal || code);
    cluster.fork();
});
