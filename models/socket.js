var handler = module.exports;

handler.init = function(server){
    var _socketIO = require('socket.io')(server);
    _socketIO.on('connection', function(socket) {
        socket.on('event', function(data){
            console.log('=========>>>00001:\t', data);
        });
        socket.on('disconnect', function(){});
    });
};
