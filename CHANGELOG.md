
# 1.0.2
### 🐞 Bug fixes
* Fixed issue when bundling by enabling esModuleInterop #83
# 1.0.1
### ✨ Features and improvements
* Added omitSuggestionsWithoutPlaceId option to omit suggestions that don't have a PlaceId (e.g. query string suggestions, such as "pizza near me")
Added placeholder option to override the string placeholder text in the input field
Added full result in the optional properties in the responses, so the user can access all fields
Exported PlacesGeocoderOptions so that users can access the configuration options type
Several dependency version bumps (from dependabot)

### 🐞 Bug fixes
* Removed a number of console.log debug prints that were left behind
# 1.0.0
### ✨ Features and improvements
* Integrate Amazon Location Service API with MapLibre GL Geocoder