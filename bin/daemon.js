var child_process = require('child_process');
function spawn(mainModule) {
    var worker = child_process.spawn('node', [ mainModule ]);
    worker.stdout.pipe(process.stdout);   // 把子进程的输出导向控制台
    worker.stderr.pipe(process.stdout);   // 把子进程的错误导向控制台
    worker.on('exit', function (code) {
        if (code !== 0) {
            console.log('[ERROR]process exit, errcode: ',code);
            spawn(mainModule);
        }
    });
}

spawn('www');
