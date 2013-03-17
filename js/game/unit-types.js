module.exports = {
    vanguard: {
        stats: {
            defense: 50,
            health: 1000
        },
        commands: {
            dualshot: {
                damage: 300,
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
                damage: 500,
                range: 13,
                cooldown: 0,
                splash: 0
            }
        }

    }
};
