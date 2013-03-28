var logs = require('../logs');

function clientEvents(game, client, socket) {
    client.on('input:move', function(data) {
        socket.emit('unit:turn', {
            c: 'move',
            id: data.entity.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
    client.on('input:act', function(data) {
        socket.emit('unit:turn', {
            c: 'act',
            id: data.entity.id,
            target: data.target.id,
            command: data.command.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
    client.on('input:skip', function() {
        socket.emit('unit:turn', {
            c: 'skip'
        });
    });
}

module.exports = clientEvents;
