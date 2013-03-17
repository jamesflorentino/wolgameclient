var logs = require('../logs');
var EventEmitter = require('events').EventEmitter;
var unitTypes = require('../game/unit-types');

function gameRoutes(socket, game) {
    var log = logs('#logs');
    var routes = new EventEmitter();

    routes.on('unit:move', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y,
            sync: data.sync
        };
        game.getEntity(options.id, function(entity) {
            game.tiles.get(options.x, options.y, function(tile) {
                game.moveEntity(entity, tile, data.sync);
                log('move: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
            });
        });
    });

    routes.on('unit:act', function(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                entity.commands.get(data.type, function(command) {
                    var target = game.getEntity(data.target);
                    game.actEntity(entity, tile, command, target);
                    log('act: ', entity.type , '(' + entity.id + ')', 'x:', tile.x, 'y:', tile.y);
                });
            });
        });
    });

    routes.on('unit:create', function(data) {
        var options = {
            id: data.id,
            type: data.target,
            x: data.x,
            y: data.y,
            attributes: unitTypes[data.target]
        };
        game.spawnEntity(options, function(entity) {
            log('new entity', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    routes.on('unit:enable', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y
        };
        game.getEntity(options.id, function(entity) {
            game.setTurn(entity);
            log('enable: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    routes.on('unit:disable', function(data) {
        var options = {
            id: data.id,
            x: data.x,
            y: data.y
        };
        game.getEntity(options.id, function(entity) {
            game.endTurn(entity);
            log('disable: ', entity.type , '(' + entity.id + ')', 'x:', entity.tile.x, 'y:', entity.tile.y);
        });
    });

    socket.on('unit/turn', function(data) {
        console.log('turn', data);
        routes.emit('unit:' + data.c, data);
    });
}

module.exports = gameRoutes;
