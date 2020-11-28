const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {
                            '@primary-color': 'rgba(195,56,56,0.90)'
                        },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
