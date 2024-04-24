# amazon-location-for-maplibre-gl-geocoder

This library is used to simplify the process of using [Amazon Location Service](https://aws.amazon.com/location/) with [maplibre-gl-geocoder](https://github.com/maplibre/maplibre-gl-geocoder) in JavaScript Applications.

## Installation

Install this library from NPM for usage with modules:

```console
npm install @aws/amazon-location-for-maplibre-gl-geocoder
```

You can also import HTML and CSS files for usage directly in the browser.

```html
<script src="https://www.unpkg.com/@aws/amazon-location-for-maplibre-gl-geocoder@1"></script>
<link href="www.unpkg.com/@aws/amazon-location-for-maplibre-geocoder@1/dist/amazon-location-for-mlg-styles.css" rel="stylesheet" />
```

## Usage

### Usage with Module

This example uses the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) to get a LocationClient to provide to the library, and [AuthHelper](https://github.com/aws-geospatial/amazon-location-utilities-auth-helper-js) for authenticating the LocationClient. It enables all API's for the geocoder.

```javascript
// Import MapLibre GL JS
import maplibregl from "maplibre-gl";
// Import from the AWS JavaScript SDK V3
import { LocationClient } from "@aws-sdk/client-location";
// Import the utility functions
import { withIdentityPoolId } from "@aws/amazon-location-utilities-auth-helper";
// Import the AmazonLocationWithMaplibreGeocoder
import {
  buildAmazonLocationMaplibreGeocoder,
  AmazonLocationMaplibreGeocoder,
} from "@aws/amazon-location-for-maplibre-gl-geocoder";

const identityPoolId = "<Identity Pool ID>";
const mapName = "<Map Name>";
const region = "<Region>"; // region containing Amazon Location resource
const placeIndex = "<PlaceIndexName>"; // Name of your places resource in your AWS Account.

// Create an authentication helper instance using credentials from Cognito
const authHelper = await withIdentityPoolId("<Identity Pool ID>");

const client = new LocationClient({
  region: "<Region>", // Region containing Amazon Location resources
  ...authHelper.getLocationClientConfig(), // Configures the client to use credentials obtained via Amazon Cognito
});

// Render the map
const map = new maplibregl.Map({
  container: "map",
  center: [-123.115898, 49.295868],
  zoom: 10,
  style: `https://maps.geo.${region}.amazonaws.com/maps/v0/maps/${mapName}/style-descriptor`,
  ...authHelper.getMapAuthenticationOptions(),
});

// Gets an instnace of the AmazonLocationMaplibreGeocoder Object.
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, placeIndex, { enableAll: true });

// Now we can add the Geocoder to the map.
map.addControl(amazonLocationMaplibreGeocoder.getPlacesGeocoder());
```

### Usage with a browser

Utility functions are available under the `amazonLocationAuthHelper` global.

> Some of these example use the Amazon Location Client. The Amazon Location Client is based on the [AWS SDK for JavaScript V3](https://github.com/aws/aws-sdk-js-v3) and allows for making calls to Amazon Location through a script referenced in an HTML file.

This example uses the Amazon Location Client to make a request that that authenticates using Amazon Cognito.

```html
<!-- Import thw Amazon Location For Maplibre Geocoder -->
<script src="https://www.unpkg.com/@aws/amazon-location-for-maplibre-geocoder@1"></script>
<!-- Import the Amazon Location Client -->
<script src="https://www.unpkg.com/@aws/amazon-location-client@1"></script>
<!-- Import the utility library -->
<script src="https://www.unpkg.com/@aws/amazon-location-utilities-auth-helper@1"></script>
```

```javascript
const identityPoolId = "<Identity Pool ID>";
const mapName = "<Map Name>";
const region = "<Region>"; // region containing Amazon Location resource

// Create an authentication helper instance using credentials from Cognito
const authHelper = await amazonLocationAuthHelper.withIdentityPoolId(identityPoolId);

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
  placesName,
  { enableAll: true },
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

Creates an instance of the AmazonLocationMaplibreGeocder which is the entry point to the other all other calls.

```javascript
const amazonLocationMaplibreGeocoder = buildAmazonLocationMaplibreGeocoder(client, placesIndex, { enableAll: true });
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

## Contributing

See [CONTRIBUTING](CONTRIBUTING.md#security-issue-notifications) for more information.

## License

This project is licensed under the Apache-2.0 License.
