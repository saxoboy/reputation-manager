const { NxAppWebpackPlugin } = require('@nx/webpack/app-plugin');
const { join } = require('path');

module.exports = {
  output: {
    path: join(__dirname, '../../dist/apps/api'),
    clean: true,
    ...(process.env.NODE_ENV !== 'production' && {
      devtoolModuleFilenameTemplate: '[absolute-resource-path]',
    }),
  },
  externalsPresets: { node: true },
  externals: [
    // Función personalizada para manejar externals
    function ({ request }, callback) {
      // NO externalizar librerías del workspace - bundlearlas
      if (request && request.startsWith('@reputation-manager/')) {
        console.log('[Webpack] BUNDLING workspace lib:', request);
        return callback(); // undefined = include in bundle
      }
      // Externalizar todo lo demás (node_modules)
      if (request && !request.startsWith('.') && !request.startsWith('/')) {
        return callback(null, 'commonjs ' + request);
      }
      // Default behavior para relative imports
      return callback();
    },
  ],
  plugins: [
    new NxAppWebpackPlugin({
      target: 'node',
      compiler: 'tsc',
      main: './src/main.ts',
      tsConfig: './tsconfig.app.json',
      assets: ['./src/assets'],
      optimization: false,
      outputHashing: 'none',
      generatePackageJson: false,
      sourceMaps: true,
    }),
  ],
};
