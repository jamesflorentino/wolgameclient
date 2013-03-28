var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');
var Game = require('../game/game');
var unitTypes = require('../game/unit-types');

/** server simulator **/
function serverEmulator(socket, level) {
    var game = Game.create();
    var routes = new EventEmitter();

    game.loadMap(level);

    routes.on('unit:move', function unitMove(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                game.moveEntity(entity, tile, data.sync);
                entity.stats.get('actions').reduce();
                game.checkCurrentTurn();
            });
        });
    });

    routes.on('unit:create', function unitCreate(data) {
        // { id: 'unit1', c: 'create', type: 'marine', x: 0, y: 0}
        var unitType = unitTypes[data.type];
        if (unitType) {
            game.getEntity(data.id, function(entity) {
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: data.type,
                    attributes: unitTypes[data.id],
                    x: data.x,
                    y: data.y
                });
                entity.stats.get('actions').empty();
                game.checkCurrentTurn();
            });
        } else {
            socket.emit('warning', {
                error: 'Unknown entity: ' + data.id,
                message: 'You tried to create an unknown entity. ' +
                    'If you are trying to see loopholes, ' +
                    'please visit http://github.com/jamesflorentino/wolgameclient for its full source code'
            });
        }
    });

    routes.on('unit:act', function unitAct(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                entity.commands.get(data.command, function(command) {
                    game.getEntity(data.target, function(target) {
                        game.actEntity(entity, tile, command, target);
                        //entity.stats.get('actions').reduce(command.cost);
                        entity.stats.get('actions').empty();
                        game.checkCurrentTurn();
                    });
                });
            });
        });
    });

    routes.on('unit:skip', function() {
        console.log('asdasd');
    });

    game.on('unit:add', function(entity) {
        socket.emit('unit/turn', {
            c: 'create',
            id: entity.id,
            target: entity.type,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    game.on('unit:move', function(entity, sync) {
        socket.emit('unit/turn', {
            c: 'move',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y,
            sync: sync
        });
    });

    game.on('unit:act', function(data) {
        socket.emit('unit/turn', {
            c: 'act',
            id: data.id,
            x: data.x,
            y: data.y,
            targets: data.targets,
            results: data.results,
            type: data.type
        });
    });

    game.on('unit:enable', function(entity) {
        socket.emit('unit/turn', {
            c: 'enable',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    game.on('unit:disable', function(entity) {
        socket.emit('unit/turn', {
            c: 'disable',
            id: entity.id,
            x: entity.tile.x,
            y: entity.tile.y
        });
    });

    socket.on('unit:turn', function(data) {
        var c = data.c; // [skip|move|act|create] - type of action
        var id = data.id; // id of the originating entity or the name of the requested unit in create mode
        var x = data.x; // x coordinate of the targetted tile
        var y = data.y; // y coordinate of the targetted tile
        var target = data.target; // id of the targetted unit
        game.getTurnID(function(entity) {
            if (entity && entity.id === id) {
                routes.emit('unit:' + c, data);
            } else {
                socket.emit('warning', {
                    error: 'Invalid Turn: ' + data.id,
                    message: 'Y U MANUALLY SEND Packets to server? u_u ' +
                        'If you are trying to see loopholes, ' +
                        'please visit http://github.com/jamesflorentino/wolgameclient for its full source code'
                });
            }
        });
    });

    function spawnUnitAtRandomRow(side, type) {
        var attemptLimits = 15;

        function findAvailableTile(fn) {
            var x = side === 'left' ? 0 : Game.columns - 1;
            var tile;
            var tiles = [];
            _(Game.rows).times(function(y) {
                tiles.push(game.tiles.get(x, y));
            });
            tiles = _.filter(tiles, function(tile) {
                return tile.entities.length === 0;
            });
            if (tiles.length > 0) {
                tile = tiles[_.random(tiles.length - 1)];
                if (typeof fn === 'function') {
                    if (tile) {
                        fn(tile);
                    }
                }
            }
            return tile;
        }

        findAvailableTile(function(tile) {
            routes.emit('unit:create', {
                c: 'create',
                id: type,
                x: tile.x,
                y: tile.y
            });
        });
    }

    function test() {
        var totalTime = 0;
        this.wait = function(time, fn) {
            time = typeof time === 'number' ? time : 1000;
            totalTime += time;
            setTimeout(fn, totalTime);
            return this;
        };

        this.spawn = function spawn(time) {
            return this.wait(time, function() {
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'marine',
                    attributes: unitTypes['marine'],
                    x: 2,
                    y: 6
                });
                game.spawnEntity({
                    id: _.uniqueId('unit'),
                    type: 'vanguard',
                    attributes: unitTypes['vanguard'],
                    x: 3,
                    y: 5
                });
                //routes.emit('unit:create', {
                //    c: 'create',
                //    id: 'marine',
                //    x: 0,
                //    y: 4
                //});
                //routes.emit('unit:create', {
                //    c: 'create',
                //    id: 'marine',
                //    x: 3,
                //    y: 3
                //});
            });
        };

        this.move = function move(time) {
            return this.wait(time, function() {
                var entity, tile;
                entity = game.entities[game.entities.length-1];
                tile = game.tiles.get(Game.columns - 2, Math.floor(Game.rows * 0.5));
                routes.emit('unit:move', {
                    id: entity.id,
                    x: tile.x,
                    y: tile.y
                });
            });
        };

        this.attack = function attack(time) {
            return this.wait(time, function() {
                var entity, target, tile, command;
                entity = game.entities[0];
                target = game.entities[1];
                tile = game.tiles.get(target.tile.x, target.tile.y);
                command = entity.commands.at(0);
                routes.emit('unit:act', {
                    id: entity.id,
                    x: tile.x,
                    y: tile.y,
                    target: target.id,
                    command: command.id
                });
            });
        };

        this.correctpos = function(time) {
            return this.wait(time, function() {
                var entity, tile;
                entity = game.entities[1];
                tile = game.tiles.get(entity.tile.x, entity.tile.y);
                routes.emit('unit:move', {
                    id: entity.id,
                    x: 4,
                    y: 4,
                    sync: true
                });    
            });
        };

        this.setTurn = function(time) {
            return this.wait(time, function() {
                game.setTurn(game.entities[0]);
            });
        };

        this.nextTurn = function(time) {
            return this.wait(time, function() {
                game.nextTurn();
            });
        };

        return this;
    }

    test().spawn(100)
        //.setTurn(100)
        .nextTurn(1000)
        //.correctpos(500)
        //.move(1000)
        //.attack(500)
        ;
}

module.exports = serverEmulator;
