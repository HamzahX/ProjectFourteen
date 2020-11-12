const CracoLessPlugin = require('craco-less');

module.exports = {
    plugins: [
        {
            plugin: CracoLessPlugin,
            options: {
                lessLoaderOptions: {
                    lessOptions: {
                        modifyVars: {
                            '@primary-color': 'rgba(235,88,126,0.71)',
                            '@typography-title-font-weight': 700
                        },
                        javascriptEnabled: true,
                    },
                },
            },
        },
    ],
};
