import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";

const banner = `
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// Third party license at
`;

export default {
  input: "./dist/esm/index.js",
  plugins: [
    nodeResolve({
      browser: true,
    }),
    json(),
    commonjs(),
  ],

  output: [
    {
      file: "dist/amazonLocationMaplibreGeocoder.js",
      format: "esm",
      banner,
      plugins: [
        getBabelOutputPlugin({
          minified: true,
          moduleId: "amazonLocationMaplibreGeocoder",
          presets: [["@babel/env", { modules: "umd" }]],
        }),
      ],
    },
  ],
};
