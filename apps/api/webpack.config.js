const path = require('node:path');
const nodeExternals = require('webpack-node-externals');

module.exports = (options) => ({
  ...options,
  externals: [
    nodeExternals({
      allowlist: [/^@repo\//],
      // @repo/service ships raw source and brings its own node_modules (e.g. bcrypt's
      // native addon) — without this, webpack can't find them to scan and tries to
      // bundle bcrypt itself, which breaks its native binary at runtime.
      additionalModuleDirs: [
        path.resolve(__dirname, '../../packages/service/node_modules'),
      ],
    }),
  ],
});
