export const MAX_CATEGORY_FILTERS = 10;
export const MAX_COUNTRY_FILTERS = 100;

export const CONSTRUCTOR_ERROR_MESSAGE =
  "In order to authenticate you need to provide either an API Key OR IdentityPoolId.";

export const BAD_BUILDER_CONFIG_ERROR_MESSAGE = "PlacesName is required to be defined within options";

export const ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE =
  "If you wish to use AmazonLocation APIs with MaplibreGeocoder please use the buildAmazonLocationMaplibreGeocoder function. Otherwise manually define at least the forwardGeocode api";

export const UNKNOWN_CLIENT_ERROR_MESSAGE =
  "Unknown client. The placesClient must be either a GeoPlacesClient or LocationClient.";

export const LOCATION_CLIENT_WITHOUT_PLACES_INDEX_ERROR_MESSAGE =
  "Using amazon-location-for-maplibre-gl-geocoder with LocationClient requires you also provide the placesIndex in the options parameter.";
