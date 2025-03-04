# amazon-location-for-maplibre-gl-geocoder

[![Version](https://img.shields.io/npm/v/@aws/amazon-location-for-maplibre-gl-geocoder?style=flat)](https://www.npmjs.com/package/@aws/amazon-location-for-maplibre-gl-geocoder) [![Tests](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/actions/workflows/build.yml/badge.svg)](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/actions/workflows/build.yml)

This library is used to simplify the process of using [Amazon Location Service](https://aws.amazon.com/location/) with [maplibre-gl-geocoder](https://github.com/maplibre/maplibre-gl-geocoder) in JavaScript Applications.

## Installation

Install this library from NPM for usage with modules:

```console
npm install @aws/amazon-location-for-maplibre-gl-geocoder
```

You can also import HTML and CSS files for usage directly in the browser.

```html
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2"></script>
<link
  href="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2/dist/amazon-location-for-mlg-styles.css"
  rel="stylesheet"
/>
```

## Usage

### Usage with Module - Standalone GeoPlaces SDK

This example uses the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) to get a GeoPlacesClient to provide to the library, and [AuthHelper](https://github.com/aws-geospatial/amazon-location-utilities-auth-helper-js) for authenticating the GeoPlacesClient. It enables all APIs for the geocoder.

```javascript
// Import MapLibre GL JS
import maplibregl from "maplibre-gl";
// Import from the AWS JavaScript SDK V3
import { GeoPlacesClient } from "@aws-sdk/client-geo-places";
// Import the utility functions
import { withAPIKey } from "@aws/amazon-location-utilities-auth-helper";
// Import the AmazonLocationMaplibreGeocoder
import {
  buildAmazonLocationMaplibreGeocoder,
  AmazonLocationMaplibreGeocoder,
} from "@aws/amazon-location-for-maplibre-gl-geocoder";

const apiKey = "<API Key>";
const mapName = "Standard";
const region = "<Region>"; // region containing Amazon Location API Key

// Create an authentication helper instance using an API key and region
const authHelper = await withAPIKey(apiKey, region);

const client = new GeoPlacesClient(authHelper.getClientConfig());

// Render the map
const map = new maplibregl.Map({
  container: "map",
  center: [-123.115898, 49.295868],
  zoom: 10,
  style: `https://maps.geo.${region}.amazonaws.com/maps/v2/styles/${mapStyle}/descriptor?key=${apiKey}`,
});

// Gets an instance of the AmazonLocationMaplibreGeocoder Object.
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, { enableAll: true });

// Now we can add the Geocoder to the map.
map.addControl(amazonLocationMaplibreGeocoder.getPlacesGeocoder());
```

### Usage with a browser - Standalone GeoPlaces SDK

The clients and utility functions are available under the `amazonLocationClient` global.

> Some of these example use the Amazon GeoPlacesClient. The Amazon GeoPlacesClient is based on the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) and allows for making calls to Amazon Location through a script referenced in an HTML file.

This example uses the Amazon GeoPlacesClient to make a request that authenticates using an API Key.

```html
<!-- Import the Amazon Location For Maplibre Geocoder -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2"></script>
<link
  href="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2/dist/amazon-location-for-mlg-styles.css"
  rel="stylesheet"
/>
<!-- Import the Amazon GeoPlacesClient -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-client@1"></script>
```

```javascript
const apiKey = "<API Key>";
const mapStyle = "Standard";
const region = "<Region>"; // region containing Amazon Location API key

// Create an authentication helper instance using an API key and region
const authHelper = await amazonLocationClient.withAPIKey(apiKey, region);

const client = new amazonLocationClient.GeoPlacesClient(authHelper.getClientConfig());

// Render the map
const map = new maplibregl.Map({
  container: "map",
  center: [-123.115898, 49.295868],
  zoom: 10,
  style: `https://maps.geo.${region}.amazonaws.com/maps/v2/styles/${mapStyle}/descriptor?key=${apiKey}`,
});

// Initialize the AmazonLocationMaplibreGeocoder object
const amazonLocationMaplibreGeocoderObject = amazonLocationMaplibreGeocoder.buildAmazonLocationMaplibreGeocoder(
  client,
  { enableAll: true },
);

// Use the AmazonLocationWithMaplibreGeocoder object to add a geocoder to the map.
map.addControl(amazonLocationMaplibreGeocoderObject.getPlacesGeocoder());
```

### Usage with Module - consolidated LocationClient SDK

This example uses the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) to get a LocationClient to provide to the library, and [AuthHelper](https://github.com/aws-geospatial/amazon-location-utilities-auth-helper-js) for authenticating the LocationClient. It enables all API's for the geocoder.

Usage with the consolidated LocationClient APIs require that you provide a PlacesIndex (Name of your places resource in your AWS Account) in the options variable.

```javascript
// Import MapLibre GL JS
import maplibregl from "maplibre-gl";
// Import from the AWS JavaScript SDK V3
import { LocationClient } from "@aws-sdk/client-location";
// Import the utility functions
import { withAPIKey } from "@aws/amazon-location-utilities-auth-helper";
// Import the AmazonLocationMaplibreGeocoder
import {
  buildAmazonLocationMaplibreGeocoder,
  AmazonLocationMaplibreGeocoder,
} from "@aws/amazon-location-for-maplibre-gl-geocoder";

const identityPoolId = "<Identity Pool ID>";
const mapName = "<Map Name>";
const region = "<Region>"; // region containing Amazon Location resource
const placeIndex = "<PlaceIndexName>"; // Name of your places resource in your AWS Account.

// Create an authentication helper instance using credentials from Cognito
const authHelper = await withIdentityPoolId(identityPoolId, region);

const client = new LocationClient(authHelper.getLocationClientConfig());

// Render the map
const map = new maplibregl.Map({
  container: "map",
  center: [-123.115898, 49.295868],
  zoom: 10,
  style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor`,
  ...authHelper.getMapAuthenticationOptions(),
});

// Gets an instance of the AmazonLocationMaplibreGeocoder Object.
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, {
  enableAll: true,
  placesIndex: placeIndex,
});

// Now we can add the Geocoder to the map.
map.addControl(amazonLocationMaplibreGeocoder.getPlacesGeocoder());
```

### Usage with a browser - consolidated LocationClient SDK

The clients and utility functions are available under the `amazonLocationClient` global.

> Some of these example use the Amazon Location Client. The Amazon Location Client is based on the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) and allows for making calls to Amazon Location through a script referenced in an HTML file.

Usage with the LocationClient APIs require that you provide a PlacesIndex (Name of your places resource in your AWS Account) in the options variable.

This example uses the Amazon Location Client to make a request that that authenticates using Amazon Cognito.

```html
<!-- Import the Amazon Location For Maplibre Geocoder -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2"></script>
<link
  href="https://cdn.jsdelivr.net/npm/@aws/amazon-location-for-maplibre-gl-geocoder@2/dist/amazon-location-for-mlg-styles.css"
  rel="stylesheet"
/>
<!-- Import the Amazon Location Client -->
<script src="https://cdn.jsdelivr.net/npm/@aws/amazon-location-client@1"></script>
```

```javascript
const identityPoolId = "<Identity Pool ID>";
const mapName = "<Map Name>";
const region = "<Region>"; // region containing Amazon Location resource
const placeIndex = "<PlaceIndexName>"; // Name of your places resource in your AWS Account.

// Create an authentication helper instance using credentials from Cognito
const authHelper = await amazonLocationClient.withIdentityPoolId(identityPoolId);

// Initialize the LocationClient
const client = new LocationClient(authHelper.getLocationClientConfig());

// Render the map
const map = new maplibregl.Map({
  container: "map",
  center: [-123.115898, 49.295868],
  zoom: 10,
  style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor`,
  ...authHelper.getMapAuthenticationOptions(),
});

// Initialize the AmazonLocationMaplibreGeocoder object
const amazonLocationMaplibreGeocoderObject = amazonLocationMaplibreGeocoder.buildAmazonLocationMaplibreGeocoder(
  client,
  { enableAll: true, placesIndex: placeIndex },
);

// Use the AmazonLocationWithMaplibreGeocoder object to add a geocoder to the map.
map.addControl(amazonLocationMaplibreGeocoderObject.getPlacesGeocoder());
```

## Documentation

Import the library and call the utility functions in the top-level namespace as needed. You can find more details about these functions in the Documentation section.

```console
npm run typedoc
```

### `buildAmazonLocationMaplibreGeocoder`

Creates an instance of the AmazonLocationMaplibreGeocoder which is the entry point to the other all other calls.

Using standalone GeoPlacesClient API Calls (client is instanceof GeoPlacesClient)

```javascript
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, { enableAll: true });
```

Using consolidated LocationClient API Calls (client is instance of LocationClient)

```javascript
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, {
  enableAll: true,
  placesIndex: placeIndex,
});
```

### `getPlacesGeocoder`

Returns a ready to use IControl object that can be added directly to a map.

```javascript
const geocoder = getPlacesGeocoder();

// Initialize map see: <insert link to initializing a map instance here>
let map = await initializeMap();

// Add the geocoder to the map.
map.addControl(geocoder);
```

### `Options` Description

| Options                                                                                                                            | Description                                                                                                                                                                                                                                                                                                                                                   |
| ---------------------------------------------------------------------------------------------------------------------------------- |---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| enableAll?: boolean                                                                                                                | When false honours the explict set boolean flags for enableGetSuggestions and enableSearchByPlaceId. When true , sets both of these to true.                                                                                                                                                                                                                  |
| enableGetSuggestions?: boolean                                                                                                     | If false, indicates that search will only occur on enter key press. If true, indicates that the Geocoder will search on the input box  while it is being updated.                                                                                                                                                                                             |
| enableSearchByPlaceId?: boolean                                                                                                    | If true, searches by placeID                                                                                                                                                                                                                                                                                                                                  |
| omitSuggestionsWithoutPlaceId?: boolean                                                                                            | Omits suggestion that don't have a PlaceId (e.g. query string suggestions, such as "pizza near me")                                                                                                                                                                                                                                                           |
| placeholder?: string                                                                                                               | Overrides the string placeholder text in the input field                                                                                                                                                                                                                                                                                                      |
| placesIndex?: string                                                                                                               | The name of the place index resource                                                                                                                                                                                                                                                                                                                          |
| flyTo?: boolean or [FlyToOptions](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/)                         | If false, animating the map to a selected result is disabled. If true, animating the map will use the default animation parameters. If an object, it will be passed as options to the map flyTo or `fitBounds` method providing control over the animation of the transition. [Refer](https://maplibre.org/maplibre-gl-js/docs/API/type-aliases/FlyToOptions/) |
| zoom?: number                                                                                                                      | On geocoded result what zoom level should the map animate to when a bbox isn't found in the response. If a bbox is found the map will fit to the bbox.                                                                                                                                                                                                        |
| trackProximity?: boolean                                                                                                           | If true, the geocoder proximity will automatically update based on the map view.                                                                                                                                                                                                                                                                              |
| proximityMinZoom?: number                                                                                                          | If setting promiximity, this is the minimum zoom level at which to start taking it into account.                                                                                                                                                                                                                                                              |
| minLength?: number                                                                                                                 | Minimum number of characters to enter before results are shown.                                                                                                                                                                                                                                                                                               |
| reverseGeocode?: boolean                                                                                                           | If true, enable reverse geocoding mode. In reverse geocoding, search input is expected to be coordinates in the form lat, lon, with suggestions being the reverse geocodes.                                                                                                                                                                                   |
| limit?: number                                                                                                                     | Maximum number of results to show.                                                                                                                                                                                                                                                                                                                            |
| collapsed?: boolean                                                                                                                | If true, the geocoder control will collapse until hovered or in focus.                                                                                                                                                                                                                                                                                        |
| clearAndBlurOnEsc?: boolean                                                                                                        | If true, the geocoder control will clear it's contents and blur when user presses the escape key.                                                                                                                                                                                                                                                             |
| clearOnBlur?: boolean                                                                                                              | If true, the geocoder control will clear its value when the input blurs.                                                                                                                                                                                                                                                                                      |
| localGeocoderOnly?: boolean                                                                                                        | If true, indicates that the localGeocoder results should be the only ones returned to the user. If false, indicates that the localGeocoder results should be combined with those from the Maplibre API with the localGeocoder results ranked higher.                                                                                                          |
| debounceSearch?: number                                                                                                            | Sets the amount of time, in milliseconds, to wait before querying the server when a user types into the Geocoder input box. This parameter may be useful for reducing the total number of API calls made for a single query.                                                                                                                                  |
| language?: string                                                                                                                  | Specify the language to use for response text and query result weighting. Options are IETF language tags comprised of a mandatory ISO 639-1 language code and optionally one or more IETF subtags for country or script. More than one value can also be specified, separated by commas. Defaults to the browser's language settings.                         |
| reverseMode?: "distance" or "score"                                                                                                | If true, [`Markers`](https://maplibre.org/maplibre-gl-js/docs/API/classes/Marker/) will be added to the map at the location the top results for the query. If the value is an object, the marker will be constructed using these options. If false, no marker will be added to the map. Requires that options.maplibregl also be set.                         |
| getItemValue?: (item: [CarmenGeojsonFeature](https://maplibre.org/maplibre-gl-geocoder/types/CarmenGeojsonFeature.html)) => string | A function that specifies how the selected result should be rendered in the search bar. HTML tags in the output string will not be rendered. Defaults to (item) => item.place_name                                                                                                                                                                            |
| render?: (item: [CarmenGeojsonFeature](https://maplibre.org/maplibre-gl-geocoder/types/CarmenGeojsonFeature.html)) => string       | A function that specifies how the results should be rendered in the dropdown menu. Any HTML in the returned string will be rendered.                                                                                                                                                                                                                          |
| popupRender?: (item: [CarmenGeojsonFeature](https://maplibre.org/maplibre-gl-geocoder/types/CarmenGeojsonFeature.html)e) => string | A function that specifies how the results should be rendered in the popup menu. Any HTML in the returned string will be rendered.                                                                                                                                                                                                                             |
| filter?: (item: [CarmenGeojsonFeature](https://maplibre.org/maplibre-gl-geocoder/types/CarmenGeojsonFeature.html)) => boolean      | A function which accepts a CarmenGeojsonFeature to filter out results from the Geocoding API response before they are included in the suggestions list. Return true to keep the item, false otherwise.                                                                                                                                                        |

Refer [MaplibreGeocoderOptions](https://maplibre.org/maplibre-gl-geocoder/types/MaplibreGeocoderOptions.html) for additional usage information.

## Getting Help

The best way to interact with our team is through GitHub.
You can [open an issue](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/new/choose) and choose from one of our templates for
[bug reports](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/new?assignees=&labels=bug%2C+needs-triage&template=---bug-report.md&title=),
[feature requests](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/new?assignees=&labels=feature-request&template=---feature-request.md&title=)
or [guidance](https://github.com/aws-geospatial/amazon-location-for-maplibre-gl-geocoder/issues/new?assignees=&labels=guidance%2C+needs-triage&template=---questions---help.md&title=).
If you have a support plan with [AWS Support](https://aws.amazon.com/premiumsupport/), you can also create a new support case.

Please make sure to check out the following resources before opening an issue:

- Our [Changelog](CHANGELOG.md) for recent changes.

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
