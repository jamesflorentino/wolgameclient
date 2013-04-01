var _ = require('underscore');
var keymanager = require('./keymanager');

_.templateSettings = {
  interpolate : /\{\{(.+?)\}\}/g
};


module.exports = function UIKeyBindings(game, client) {
    var tplUnitInfo = _.template(document.querySelector('#tpl-unit-info').innerHTML);
    var domUnitInfo = document.querySelector('#unit-info');
    var domUIContainer = document.querySelector('#ui-container');
    var domHelpButton = document.querySelector('#help-button');

    function showUnitInfo(entity) {
        if (!entity) {
            return;
        }
        game.getEntity(entity.id, function(entity) {
            var health = entity.stats.get('health');
            var range = entity.stats.get('range');
            var reach = entity.commands.at(0);
            domUnitInfo.innerHTML = tplUnitInfo({
                name: entity.data.name,
                role: entity.data.role,
                description: entity.data.description,
                health: health.ratio(),
                health_val: health.val(),
                health_max: health.max,
                def: entity.stats.get('defense').val(),
                atk: entity.commands.at(0).damage
            });
            _.each(
                domUnitInfo.querySelectorAll('.range-stat .range-bg'),
                function(rangeBG, i) {
                    if (i + 1> range.val()) {
                        rangeBG.innerHTML = '';
                    }
                }
            );

            _.each(
                domUnitInfo.querySelectorAll('.reach-stat .reach-bg'),
                function(reachBG, i) {
                    if (i > reach.range - 1) {
                        reachBG.innerHTML = '';
                    }
                }
            );
            domUnitInfo.classList.remove('hidden');
        });
    }

    function hideUnitInfo() {
        domUnitInfo.classList.add('hidden');
        client.hideUnitOptions();
    }

    function toggleUnitInfo(e) {
        if (domUnitInfo.classList.contains('hidden')) {
            showUnitInfo();
        } else {
            hideUnitInfo();
        }
    }

    var showingUnitOptions = false;
    function showUnitOptions() {
        if (showingUnitOptions) {
            hideUnitInfo();
            showingUnitOptions = false;
        } else {
            client.showUnitOptions();
            showingUnitOptions = true;
        }
    }

    domHelpButton.addEventListener('mousedown', showUnitOptions);
    domUnitInfo.addEventListener('mousedown', showUnitOptions);
    client.on('input:unit:info', showUnitInfo);
    //domHelpButton.addEventListener('touchend', toggleUnitInfo);
};
