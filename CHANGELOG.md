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
