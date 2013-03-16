/**
 * @author James Florentino
 */

/** globals **/
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

/** game **/
var Game = require('./game/game');
var unitTypes = require('./game/unit-types');

/** client **/
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var socket = window.socket || new EventEmitter();

/** server simulator **/
function serverRoutes() {
    var game = Game.create();
    var routes = new EventEmitter();

    /** routes **/

    routes.on('unit:move', function unitMove(data) {
    });

    routes.on('unit:create', function unitCreate(data) {
        game.createEntity(_.uniqueId('unit'), function(entity) {
            entity.set(unitTypes[data.id]); // set if there's attributes located
            game.addEntity(entity);
        });
    });

    routes.on('unit:act', function unitAct(data) {
    });

    game.on('unit:add', function(entity) {
        console.log('hey');
    });

    /** sockets **/
    socket.on('unit:turn', function(data) {
        var type = data.type; // [skip|move|act|create] - type of action
        var id = data.id; // id of the originating entity or the name of the requested unit in create mode
        var x = data.x; // x coordinate of the targetted tile
        var y = data.y; // y coordinate of the targetted tile
        var target = data.target; // id of the targetted unit
        routes.emit('unit:' + type, data);
    });

    socket.on('input:movetile', function(data) {
        setTimeout(function() {
            // TODO: Check if tile is a valid move
            socket.emit('unit:turn', data);
        }, 150);
    });

    socket.on('input:acttile', function(data) {
        /** id, x, y, target **/
        game.getEntity(data.id, function(err, entity) {
            game.getEntity(data.target, function(err, target) {
                var command = entity.commands.get(data.command);
                var tile = game.tiles.get(data.x, data.y);
                if (command && tile) {
                    /** Make sure the targetted tile is in range  **/
                    var tiles, targets;
                    tiles = game.tiles.neighbors(entity.tile, command.range);
                    if (tiles.indexOf(tile) > -1) {
                        /** look for affected tiles then **/
                        tiles = game.tiles.neighbors(tile, command.splash);
                        /** filter out the ones with entities in them **/
                        tiles = _.filter(tiles, function(tile) {
                            return tile.entities.length > 0 && !tile.has(entity);
                        });
                        tiles = [tile].concat(tiles);
                        /** get the affected targets **/
                        targets = [];
                        _.each(tiles, function(tile) {
                            _.each(tile.entities, function(entity) {
                                var damage = entity.calculateDamage(command.damage);
                                targets.push({
                                    id: entity.id,
                                    damage: damage
                                })
                            });
                        })

                        socket.emit('unit:disable', { id: entity.id });
                        //socket.emit('unit:act', {
                        //    id: entity.id,
                        //    command: 'rifleshot',
                        //    targets: null
                        //});
                    }
                }
            });
        });
    });

    socket.emit('unit:turn', {
        type: 'create',
        id: 'marine'
    })
}

function gameRoutes(socket, game) {
    /** Game Events **/
    socket.on('unit:spawn', function(data) {
        game.createEntity(data, function(entity) {
        });
    });

    //socket.emit('unit:turn', {
    //    id: 'soldier1',
    //    type: 'act',
    //    command: {
    //        id: 'grenade'
    //    },
    //    targets: [
    //        { id: 'trooper1', damage: 10 },
    //        { id: 'sniper1', damage: 5 }
    //    ],
    //    results: [
    //        { id: 'trooper1', type: 'death' },
    //        { id: 'sniper1', type: 'evade' }
    //    ]
    //});

    socket.on('unit:turn', function(data) {
        game.getEntity(data.id, function(err, entity) {
            routes.emit('move', entity, data.x, data.y);
        });
    });

    socket.on('unit:act', function unitAct(data) {
        game.getEntity(data.id, function getEntity(err, entity) {
            console.log('actinvg');
        });
    });

    socket.on('unit:enable', function unitTurn(data) {
        game.getEntity(data.id, function (err, entity) {
            game.setTurn(entity);
            entity.enable();
        });
    });

    socket.on('unit:disable', function unitTurn(data) {
        game.getEntity(data.id, function (err, entity) {
            game.endTurn(entity);
            entity.disable();
        });
    });

    socket.on('unit:remove', function(data) {
        game.getEntity(data.id, function(err, entity) {
            game.removeEntity(entity);
        });
    });

    socket.on('tiles:config', function(data) {
        var tiles = data.tiles;
        _.each(tiles, function(tileData) {
            var tile = game.tiles.get(tileData.x, tileData.y);
            tile.wall = tileData.wall;
        });
        game.emit('tiles:config');
    });
}

function testRoutes(game) {

    socket.on('test:spawn', function() {
        setTimeout(function() {
            socket.emit('unit:spawn', {
                id: 'marine',
                type: 'marine',
                x: 1,
                y: 0
            });

            socket.emit('unit:spawn', {
                id: 'vanguard',
                type: 'vanguard',
                x: 1,
                y: 1
            });

            socket.emit('unit:spawn', {
                id: 'vanguard2',
                type: 'vanguard',
                x: 2,
                y: 1
            });
        }, 250);
    });

    socket.on('test:removeunit', function() {
        setTimeout(function() {
            socket.emit('unit:remove', {
                id: 'vanguard2'
            })
        }, 4000);
    });

    socket.on('test:move', function() {
        setInterval(function() {
            socket.emit('unit:turn', {
                id: 'vanguard2',
                x: Math.round(Math.random() * 5),
                y: Math.round(Math.random() * 5)
            });
        }, 2000);
        setInterval(function() {
            socket.emit('unit:move', {
                id: 'vanguard',
                x: Math.round(Math.random() * 5),
                y: Math.round(Math.random() * 5)
            });
        }, 2000);
    });

    socket.on('test:attack', function() {
        setTimeout(function() {
            socket.emit('unit:act', {
                id: 'marine',
                attack_id: 'rifleshot',
                targets: [
                    { id: 'vanguard', damage: 100 }
                ]
            });
        }, 250);
    });

    socket.on('test:turn', function() {
        setTimeout(function() {
            socket.emit('unit:enable', {
                id: 'marine'
            });
        }, 1000);
    });

    socket.on('test:endturn', function() {
        setTimeout(function() {
            socket.emit('unit:disable', {
                id: 'marine'
            });
        }, 2000);
    });

    socket.on('test:tileconfig', function() {
        socket.emit('tiles:config', {
            tiles: [
                { x: 2, y: 0, wall: true },
                { x: 2, y: 2, wall: true },
                { x: 2, y: 3, wall: true },
                { x: 2, y: 4, wall: true },
                { x: 2, y: 5, wall: true },
                { x: 2, y: 6, wall: true }
            ]
        })
    });

    socket.emit('test:spawn');
    //socket.emit('test:move');
    socket.emit('test:turn');
    socket.emit('test:tileconfig');
    //socket.emit('test:removeunit');
    //socket.emit('test:endturn');
}

function clientEvents(game, client) {
    game.on('unit:spawn', function(entity) {
        client.createUnit(entity, function(err, unit) {
        });
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

function preventDraggingiOS() {
    document.body.addEventListener('touchmove', function (ev) { 
        ev.preventDefault();
    }); 
    window.addEventListener("load",function() {
            // Set a timeout...
        setTimeout(function(){
            // Hide the address bar!
            window.scrollTo(0, 1);
        }, 0);
    });
}

function preventContextMenu() {
    document.querySelector('canvas').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

window.addEventListener('load', function() {
    Game.create(function(err, game) {
        Client.create(game, function(err, client) {
            client.preloader.load(assetManifest, function(err) {
                client.setScene(document.querySelector('canvas#game'), function(err) {
                    serverRoutes();
                    clientEvents(game, client);
                    gameRoutes(socket, game);
                    preventDraggingiOS();
                    preventContextMenu();
                });

            });

        });

    });
});
