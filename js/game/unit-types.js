module.exports = {
    vanguard: {
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
                splash: 0
            }
        }
    },
    marine: {
        type: 'marine',
        stats: {
            range: 1,
            splash: 1
        },
        commands: {
            rifleshot: {
                damage: 500,
                range: 3,
                cooldown: 0,
                splash: 3
            }
        }
    }
};
