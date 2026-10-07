import { nodeResolve } from "@rollup/plugin-node-resolve";
import json from "@rollup/plugin-json";
import commonjs from "@rollup/plugin-commonjs";
import { getBabelOutputPlugin } from "@rollup/plugin-babel";
import nodePolyfills from "rollup-plugin-polyfill-node";

const banner = `
// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0
// Third party license at
`;

// MapLibre GL JS v6 ships as ES modules only and reads `import.meta.url` to locate its web worker.
// This bundle is loaded with a classic <script> tag (UMD), where `import.meta` is a syntax error, so
// replace it with the bundle's own URL, captured from document.currentScript while the script runs.
// The geocoder never creates a map with the bundled MapLibre, so the worker files are not shipped.
const bundleUrlVariable = "__amazonLocationMaplibreGeocoderScriptUrl";

function importMetaUrl() {
  return {
    name: "import-meta-url",
    resolveImportMeta(property) {
      if (property === "url") {
        return bundleUrlVariable;
      }
      return null;
    },
  };
}

// MapLibre GL JS v6 contains non-ASCII identifiers (for example its Arabic ligature table). A classic
// <script> is decoded with the page's encoding unless the server sends `charset=utf-8`, so escape every
// non-ASCII character as \uXXXX. That escape is valid in identifiers, strings, regular expressions and comments.
function asciiOnly() {
  return {
    name: "ascii-only",
    renderChunk(code) {
      const backslashBeforeNonAscii = /\\[\u0080-\uffff]/.exec(code);
      if (backslashBeforeNonAscii) {
        this.error(
          `Cannot safely escape non-ASCII character after a backslash at index ${backslashBeforeNonAscii.index}`,
        );
      }
      return {
        code: code.replace(/[\u0080-\uffff]/g, (char) => "\\u" + char.charCodeAt(0).toString(16).padStart(4, "0")),
        map: null,
      };
    },
  };
}

export default {
  input: "./dist/esm/index.js",
  plugins: [
    importMetaUrl(),
    nodeResolve({
      browser: true,
    }),
    json(),
    commonjs(),
    nodePolyfills({
      include: ["events"],
    }),
  ],

  output: [
    {
      file: "dist/amazonLocationMaplibreGeocoder.js",
      format: "esm",
      banner,
      intro: `const ${bundleUrlVariable} = typeof document !== "undefined" && document.currentScript && document.currentScript.src ? document.currentScript.src : typeof location !== "undefined" ? location.href : "";`,
      plugins: [
        getBabelOutputPlugin({
          minified: true,
          moduleId: "amazonLocationMaplibreGeocoder",
          presets: [["@babel/env", { modules: "umd" }]],
        }),
        asciiOnly(),
      ],
    },
  ],
};
