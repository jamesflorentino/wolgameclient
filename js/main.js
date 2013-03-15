/**
 * @author James Florentino
 */

var Game = require('./game/game');
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');
var EventEmitter = require('events').EventEmitter;
var _ = require('underscore');

var socket = window.socket || new EventEmitter();

function gameRoutes(socket, game) {
    socket.on('unit:spawn', function(data) {
        game.createEntity(data, function(err, entity) {
        });
    });

    socket.on('unit:move', function(data) {
        game.getEntity(data.id, function(err, entity) {
            // update the client first before moving the unit
            var tile = game.tiles.get(data.x, data.y);
            entity.move(tile);
        });
    });

    socket.on('unit:act', function unitAct(data) {
        game.getEntity(data.id, function getEntity(err, entity) {
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

    socket.on('tiles:config', function(data) {
        var tiles = data.tiles;
        _.each(tiles, function(tileData) {
            var tile = game.tiles.get(tileData.x, tileData.y);
            tile.wall = tileData.wall;
        });
        game.emit('tiles:config');
    });

}

function offlineRoutes(game) {

    socket.on('input:movetile', function(data) {
        setTimeout(function() {
            // TODO: Check if tile is a valid move
            socket.emit('unit:move', data);
        }, 150);
    });

    socket.on('input:acttile', function(data) {
        setTimeout(function() {
            game.getEntity(data.id, function(err, entity) {
                game.act(entity, game.tiles.get(data.x, data.y));
            });
        }, 150);
    });

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
        setInterval(function() {
            socket.emit('unit:move', {
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
    //socket.emit('test:endturn');
}

function initRoutes(game, client) {

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

    client.on('input:acttile', function(data) {
        socket.emit('input:acttile', {
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

    Game.create(settings, function(err, game) {
        //var tile = game.tiles.get(0, 0);
        //game.tiles.findRange(tile);
        //return;

        Client.create(game, function(err, client) {

            client.preloader.load(assetManifest, function(err) {

                client.setScene(document.querySelector('canvas#game'), function(err) {

                    preventDraggingiOS();
                    preventContextMenu();
                    initRoutes(game, client);
                    gameRoutes(socket, game);
                    offlineRoutes(game);

                });

            });

        });

    });

});
