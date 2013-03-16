module.exports = {
    vanguard: {
        stats: {
            defense: 20,
            health: 200
        },
        commands: {
            dualshot: {
                damage: 100,
                range: 1,
                cooldown: 0,
                splash: 1
            }
        }
    },
    marine: {
        type: 'marine',
        stats: {
            range: 3,
            splash: 1
        },
        commands: {
            rifleshot: {
                damage: 50,
                range: 4,
                cooldown: 0,
                splash: 0
            }
        }

    }
};
