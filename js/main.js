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
            game.getTile({ x: data.x, y: data.y }, function(err, tile) {
                entity.move(tile, function() {
                    console.log('unit moved completed');
                });
            });
        });
    });

    /** Test **/
    socket.on('client:ready', function() {
        setTimeout(function() {
            socket.emit('unit:spawn', {
                id: 10,
                type: 'marine',
                x: 1,
                y: 0
            });

            setTimeout(function() {
                socket.emit('unit:move', {
                    id: 10,
                    x: 1,
                    y: 2
                });
            }, 250);
        }, 250);
    });

    socket.emit('client:ready');
}

function bindGame(game, client) {
    game.on('unit:spawn', function(entity) {
        client.createUnit(entity, function(err, unit) {
            console.log('asd');
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

                });

            });

        });

    });

});
