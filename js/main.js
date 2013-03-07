/**
 * @author James Florentino
 * This file will contain the graphics part
 */
/*jshint laxcomma: true*/

var Game = require('./game/game');
var Client = require('./client/client');
var assetManifest = require('./client/asset-manifest.js');
var settings = require('./client/settings');

window.addEventListener('load', function() {

    //console.debug('window ready');

    Game.create(settings, function(err, game) {

        //console.debug('Game created');

        Client.create(game, function(err, client) {

            //console.debug('Client created');

            client.preloader.load(assetManifest, function(err) {

                //console.debug('assets preloaded');

                client.setScene(document.querySelector('canvas#game'), function() {

                    //console.debug('scene set');

                    game.createEntity({ id: 10, type: 'marine' }, function(err, entity) {
                        client.addUnit(entity, function(sprite) {
                            entity.move(game.tiles.get(0, 0));
                        });

                    });

                    //client.pause();
                    //client.render();

                });

            });

        });

    });

});
