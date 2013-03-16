var logs = require('../logs');

function clientEvents(game, client) {

    var log = logs('#unit-info', true);

    client.on('unit:info', function(entity) {
        var stats = "";
        var commands = '';
        entity.stats.each(function(stat) {
            stats += "- " + stat.name + ":" + stat.val() + "/" + stat.max + "<br>";
        });

        entity.commands.each(function(command) {
            commands += '- ' + command.id + ': ' + command.damage + ' damage' + '<br>';
        });

        log(
            'unit type: ' + entity.type, '<br>',
            '--------------------------------', '<br>',
            'stats', '<br>',
            stats,
            '--------------------------------', '<br>',
            'commands', '<br>',
            commands
        );
    });

    client.on('input:movetile', function(data) {
        socket.emit('input:turn', {
            id: data.entity.id,
            type: 'move',
            x: data.tile.x,
            y: data.tile.y
        });
    });

    client.on('input:acttile', function(data) {
        socket.emit('input:acttile', {
            id: data.entity.id,
            target: data.target.id,
            command: data.command.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
}

module.exports = clientEvents;
