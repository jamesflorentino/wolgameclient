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
            entity.turn();
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
                x: 0,
                y: 0
            });
        }, 250);
    });

    socket.on('test:move', function() {
        setTimeout(function() {
            socket.emit('unit:move', {
                id: 'vanguard',
                x: 3,
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
        }, 300);
    });

    socket.emit('test:spawn');
    socket.emit('test:move');
}

function bindGame(game, client) {
    game.on('unit:spawn', function(entity) {
        client.createUnit(entity, function(err, unit) {
        });
    });
}

window.addEventListener('load', function() {

    Game.create(settings, function(err, game) {

        Client.create(game, function(err, client) {

            client.preloader.load(assetManifest, function(err) {

                client.setScene(document.querySelector('canvas#game'), function(err) {

                    bindGame(game, client);
                    bindSocket(socket, game);
                    test();

                });

            });

        });

    });

});
