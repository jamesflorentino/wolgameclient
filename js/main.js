/**
 * @author James Florentino
 */

/** globals **/
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

/** game **/
var Game = require('./game/game');

/** client **/
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var serverEmulator = require('./routes/game-server');
var clientEvents = require('./routes/client-routes');
var gameRoutes = require('./routes/game-routes');
var socket = window.socket || new EventEmitter();

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
                    clientEvents(game, client, socket);
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
