/**
 * @author James Florentino
 */

var Game = require('./game/game');
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var EventEmitter = require('events').EventEmitter;

var socket = window.socket || new EventEmitter();

function clientReady(socket, client, game) {

    socket.on('unit.spawn', function(data) {
        game.createEntity(data, function(err, entity) {
            client.createUnit(entity, function(err, unit) {
                console.log('hey');
            });
        });
    });

    socket.on('unit.move', function(data) {
        game.getEntity(data.id, function(entity) {
        });
    });

    socket.emit('unit.spawn', {
        id: 10,
        type: 'marine'
    })
}

window.addEventListener('load', function() {

    Game.create(settings, function(err, game) {

        Client.create(game, function(err, client) {

            client.preloader.load(assetManifest, function(err) {

                client.setScene(document.querySelector('canvas#game'), function(err) {

                    clientReady(socket, client, game);

                });

            });

        });

    });

});
