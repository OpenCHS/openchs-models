module.exports = {
    presets: [
        ["@babel/env",
            {
                targets: {
                    node: "current"
                }
            }
        ],
        '@babel/preset-typescript'
    ],
    plugins: [
        "@babel/plugin-proposal-class-properties",
        "@babel/plugin-proposal-object-rest-spread"
    ],
    env: {
        "test": {
            "plugins": [
                [
                    "istanbul"
                ]
            ]
        }
    },
    sourceMaps: true
};
