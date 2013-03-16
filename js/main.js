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
var serverEmulator = require('./routes/game-server');
var clientEvents = require('./routes/client-routes');
var logs = require('./logs');
var socket = window.socket || new EventEmitter();

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
            });
        });
    });

	routes.on('unit:act', function(data) {
        game.getEntity(data.id, function(entity) {
            game.tiles.get(data.x, data.y, function(tile) {
                entity.commands.get(data.type, function(command) {
                    var target = game.getEntity(data.target);
                    game.actEntity(entity, tile, command, target);
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

    socket.on('unit/turn', function(data) {
        console.log('turn', data);
        routes.emit('unit:' + data.c, data);
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
                    clientEvents(game, client);
                    gameRoutes(socket, game);
                    preventDraggingiOS();
                    preventContextMenu();
                    if (!window.socket) {
                        serverEmulator(socket);
                    }
                });

            });

        });

    });
});
