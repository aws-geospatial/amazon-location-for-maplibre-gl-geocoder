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
