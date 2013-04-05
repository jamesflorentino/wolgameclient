module.exports = {
    powernode: {
        data: {
            name: 'Power Node',
            role: 'Resource point',
            description: 'Power nodes provide steady flow of resources. ' +
                'If you destroy the power node of an enemy, you win the game.'
        },
        stats: {
            health: 100,
            turnspeed: 0
    },
    commands: {
        rally: {
            damage: 0
        }
        }
    },
    vanguard: {
        data: {
            name: 'Lemurian Vanguard',
            role: 'Heavy/Defense',
            description: 'The Vanguard can best defend the frontline and' +
                ' hit multiple enemies at once due to its splash damage at the expense of its limited firing range. '
        },
        stats: {
            range: 3,
            defense: 50,
            health: 800
        },
        commands: {
            dualshot: {
                damage: 300,
                range: 2,
                cooldown: 0,
                splash: 1
            }
        }
    },
    marine: {
        type: 'marine',
        data: {
            name: 'Lemurian Marine',
            role: 'Assault',
            description: 'The assault marine is perfect for ' +
                'attacking power nodes and basic infantry units due to its long range. ' +
                'Has average life. Ineffective against armored units.'
        },
        stats: {
            range: 4,
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
