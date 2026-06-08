# 2.0.7
### ✨ Features and improvements
- Dependency version updates:
  `@aws-sdk/client-geo-places`, `@aws-sdk/client-location`, `brace-expansion`, `fast-xml-builder`


# 2.0.6
### ✨ Features and improvements
- Dependency version updates:
  `@aws-sdk/client-geo-places`, `@aws-sdk/client-location`, `@aws-sdk/xml-builder`,
  `@babel/core`, `@babel/preset-env`, `@babel/preset-typescript`,
  `@eslint/js`, `@jest/types`, `@maplibre/maplibre-gl-geocoder`,
  `@rollup/plugin-babel`, `@rollup/plugin-commonjs`,
  `@typescript-eslint/eslint-plugin`, `@typescript-eslint/parser`,
  `ajv`, `brace-expansion`, `diff`, `eslint`, `fast-xml-parser`, `flatted`,
  `glob`, `globals`, `handlebars`, `jest`, `js-yaml`, `lint-staged`,
  `markdown-it`, `minimatch`, `picomatch`, `prettier`, `prettier-plugin-jsdoc`,
  `protocol-buffers-schema`, `rollup`, `ts-jest`, `typedoc`, `yaml`


# 2.0.5
### ✨ Features and improvements
- Several dependency version updates


# 2.0.4
### ✨ Features and improvements
- Updated README file to fix example code map style URL's [#207](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/207/)
- Several dependency version updates


# 2.0.3
### ✨ Features and improvements
- Added support for specifying `AdditionalFeatures` to expand response fields [#197](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/197)
- Several dependency version updates

# 2.0.2
### ✨ Features and improvements
- Added support for `AutocompleteCommand` [#193](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/193)
- Several dependency version updates

# 2.0.1
### 🐞 Bug fixes

- Fix flyTo not being honoured [#157](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/157)
- Fix Geocoding returns error 400 when zoom level < 9 [#158](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/158)
- Removed `enableEventLogging` from options

### ✨ Features and improvements

- Extended `options` to support `maplibre-gl-geocoder`'s MaplibreGeocoderOptions for:
    - flyTo,
    - zoom,
    - trackProximity,
    - proximityMinZoom,
    - showResultsWhileTyping,
    - minLength,
    - reverseGeocode,
    - limit,
    - collapsed,
    - clearAndBlurOnEsc,
    - clearOnBlur,
    - localGeocoderOnly,
    - debounceSearch,
    - language,
    - reverseMode,
    - getItemValue,
    - render,
    - popupRender,
    - filter

# 2.0.0

### ⚠️ Breaking changes
- When using the consolidated `LocationClient`, the `placesIndex` is now passed in the `options`

### ✨ Features and improvements

- Added support for new standalone Places SDK

# 1.0.5

### 🐞 Bug fixes

- Fix to publish the bundled script for browser: [#99](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/99)

# 1.0.4

### ✨ Features and improvements

- Added Changelog and Continuous Deployment

# 1.0.3

### 🐞 Bug fixes

- Added missing PlaceId field in response when searching by PlaceId: [#91](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/91)

# 1.0.2

### 🐞 Bug fixes

- Fixed issue when bundling by enabling esModuleInterop [#83](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/pull/83)

# 1.0.1

### ✨ Features and improvements

- Added omitSuggestionsWithoutPlaceId option to omit suggestions that don't have a PlaceId (e.g. query string suggestions, such as "pizza near me")
- Added placeholder option to override the string placeholder text in the input field
- Added full result in the optional properties in the responses, so the user can access all fields
- Exported PlacesGeocoderOptions so that users can access the configuration options type
- Several dependency version bumps (from dependabot)

### 🐞 Bug fixes

- Removed a number of console.log debug prints that were left behind

# 1.0.0

### ✨ Features and improvements

- Integrate Amazon Location Service API with MapLibre GL Geocoder
