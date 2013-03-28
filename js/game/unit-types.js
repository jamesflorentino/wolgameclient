module.exports = {
    vanguard: {
        data: {
            name: 'Lemurian Vanguard',
            role: 'Heavy/Defense',
            description: 'The Vanguard can best defend the frontline and' +
                ' hit multiple enemies. Effective against groups. ' +
                'Moves slowly and has limited firing range.'
                
        },
        stats: {
            range: 2,
            defense: 50,
            health: 800
        },
        commands: {
            dualshot: {
                damage: 300,
                range: 1,
                cooldown: 0,
                splash: 2
            }
        }
    },
    marine: {
        type: 'marine',
        data: {
            name: 'Lemurian Marine',
            role: 'Assault',
            description: 'The Lemurian marine unit is perfect for ' +
                'attacking power nodes and basic infantry units. ' +
                'Has average life. Ineffective against heavy units.'
        },
        stats: {
            range: 2,
            splash: 1
        },
        commands: {
            rifleshot: {
                damage: 250,
                range: 3,
                cooldown: 0,
                splash: 0
            }
        }
    }
};
