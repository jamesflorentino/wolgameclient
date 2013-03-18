module.exports = {
    vanguard: {
        stats: {
            range: 2,
            defense: 50,
            health: 1000
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
        stats: {
            range: 2,
            splash: 1
        },
        commands: {
            rifleshot: {
                damage: 500,
                range: 3,
                cooldown: 0,
                splash: 0
            }
        }
    }
};
