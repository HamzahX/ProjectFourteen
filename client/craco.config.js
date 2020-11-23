const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {
                            '@primary-color': 'rgb(195,56,56)'
                        },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
