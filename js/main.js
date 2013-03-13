/**
 * @author James Florentino
 */

var Game = require('./game/game');
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var EventEmitter = require('events').EventEmitter;

var socket = window.socket || new EventEmitter();

function bindSocket(socket, game) {
    socket.on('unit:spawn', function(data) {
        game.createEntity(data, function(err, entity) {
        });
    });

    socket.on('unit:move', function(data) {
        game.getEntity(data.id, function(err, entity) {
            // update the client first before moving the unit
            game.getTile({ x: data.x, y: data.y }, function(err, tile) {
                entity.move(tile, function() {
                    console.log('unit moved completed');
                });
            });
        });
    });

    socket.on('unit:act', function unitAct(data) {
        game.getEntity(data.id, function getEntity(err, entity) {
            game.createCommand(data, function(err, command) {
                entity.act(command);
            });
        });
    });

    socket.on('unit:turn', function unitTurn(data) {
        game.getEntity(data.id, function (err, entity) {
            game.setTurn(entity, function() {
            });
        });
    });
}

function test() {
    /** Test **/
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

    socket.on('test:move', function() {
        setTimeout(function() {
            socket.emit('unit:move', {
                id: 'vanguard',
                x: 4,
                y: 0
            });
        }, 250);
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
            socket.emit('unit:turn', {
                id: 'marine'
            });
        }, 1000);
    });

    socket.on('input:movetile', function(data) {
        setTimeout(function() {
            socket.emit('unit:move', data);
        }, 150);
    });

    socket.on('input:acttile', function(data) {
    });

    socket.emit('test:spawn');
    //socket.emit('test:move');
    socket.emit('test:turn');
}

function bindGame(game, client) {
    game.on('unit:spawn', function(entity) {
        client.createUnit(entity, function(err, unit) {
        });
    });

    client.on('input:movetile', function(data) {
        socket.emit('input:movetile', {
            id: data.entity.id,
            x: data.tile.x,
            y: data.tile.y
        });
    });
}

function preventDraggingiOS() {
    document.body.addEventListener('touchmove', function (ev) { 
        ev.preventDefault();
    }); 
}

function preventContextMenu() {
    document.querySelector('canvas').addEventListener('contextmenu', function(e) {
        e.preventDefault();
    });
}

window.addEventListener('load', function() {

    Game.create(settings, function(err, game) {

        Client.create(game, function(err, client) {

            client.preloader.load(assetManifest, function(err) {

                client.setScene(document.querySelector('canvas#game'), function(err) {

                    preventDraggingiOS();
                    preventContextMenu();
                    bindGame(game, client);
                    bindSocket(socket, game);
                    test();

                });

            });

        });

    });

});
