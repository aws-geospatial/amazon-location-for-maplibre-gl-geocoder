import {
  GeoPlacesClient,
  SearchTextCommand,
  ReverseGeocodeCommand,
  SuggestCommand,
  GetPlaceCommand,
  SearchTextCommandInput,
  ReverseGeocodeCommandInput,
  SuggestCommandInput,
  GetPlaceCommandInput,
  GetPlaceCommandOutput,
  SuggestCommandOutput,
  SearchTextCommandOutput,
  ReverseGeocodeCommandOutput,
} from "@aws-sdk/client-geo-places";
import { PlacesGeocoderOptions } from "../../common/types";
import { MaplibreGeocoderApi, MaplibreGeocoderFeatureResults } from "@maplibre/maplibre-gl-geocoder";

export function getApiDefinitionsV2(
  geoPlacesClient: GeoPlacesClient,
  options?: PlacesGeocoderOptions,
): MaplibreGeocoderApi {
  const placesClient: GeoPlacesClient = geoPlacesClient;

  // maplibre-gl-geocoder always requires we have defined forwardGeocode and reverseGeocode
  const amazonLocationGeocoderApi: MaplibreGeocoderApi = {
    forwardGeocode: createAmazonLocationForwardGeocodeApiV2(placesClient),
    reverseGeocode: createAmazonLocationReverseGeocodeApiV2(placesClient),
  };

  const omitSuggestionsWithoutPlaceId = options?.omitSuggestionsWithoutPlaceId || false;

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceByIdV2(placesClient);
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestionsV2(
        placesClient,
        omitSuggestionsWithoutPlaceId,
      );
    } else {
      if (options.enableSearchByPlaceId) {
        amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceByIdV2(placesClient);
      }

      if (options.enableGetSuggestions) {
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestionsV2(
          placesClient,
          omitSuggestionsWithoutPlaceId,
        );
      }
    }
  }

  return amazonLocationGeocoderApi;
}

function createAmazonLocationForwardGeocodeApiV2(amazonLocationClient: GeoPlacesClient) {
  return async function (config) {
    const features = [];
    try {
      const searchTextParams: SearchTextCommandInput = {
        QueryText: config.query,
        BiasPosition: config.proximity ? config.proximity : undefined,
        MaxResults: config.limit ? config.limit : 5,
        Filter: {
          BoundingBox: config.bbox ? config.bbox : undefined,
          IncludeCountries: config.filterCountries ? config.filterCountries : undefined,
        },
        Language: config.language[0],
      };

      // Countries are stored as a comma seperated string in Maplibre-gl-geocoder
      if (config.countries) {
        searchTextParams.Filter.IncludeCountries = config.countries.toString().split(",");
      }

      const command = new SearchTextCommand(searchTextParams);
      const data: SearchTextCommandOutput = await amazonLocationClient.send(command);

      if (data.ResultItems) {
        for (const result of data.ResultItems) {
          const position = result.Position;
          const address = result.Address;
          const label = address ? address.Label : null;
          const placeType = result.PlaceType;

          if (position && address && label) {
            const feature = {
              type: "Feature",
              id: result.PlaceId,
              geometry: {
                type: "Point",
                coordinates: position,
              },
              place_name: label,
              properties: {
                ...result,
              },
              text: label,
              place_type: [placeType],
              center: position,
            };
            features.push(feature);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }
    return { features: features } as MaplibreGeocoderFeatureResults;
  };
}

function createAmazonLocationReverseGeocodeApiV2(amazonLocationClient: GeoPlacesClient) {
  return async function (config) {
    const features = [];
    try {
      const reverseGeocodeParams: ReverseGeocodeCommandInput = {
        QueryPosition: config.query,
        Language: config.language ? config.language : undefined,
        MaxResults: config.limit ? config.limit : undefined,
      };

      const command = new ReverseGeocodeCommand(reverseGeocodeParams);
      const results: ReverseGeocodeCommandOutput = await amazonLocationClient.send(command);

      if (results.ResultItems) {
        for (const result of results.ResultItems) {
          const place = result.Address;
          if (place && result.Position) {
            const point = result.Position;
            const feature = {
              type: "Feature",
              id: result.PlaceId,
              geometry: {
                type: "Point",
                coordinates: point,
              },
              place_name: result.Title,
              properties: {
                ...result,
              },
              text: result.Title,
              place_type: ["place"],
              center: point,
            };
            features.push(feature);
          }
        }
      }
    } catch (e) {
      console.error(`Failed to reverseGeocode with error: ${e}`);
    }
    return { features: features } as MaplibreGeocoderFeatureResults;
  };
}

function createAmazonLocationSearchPlaceByIdV2(amazonLocationClient: GeoPlacesClient) {
  return async function (config) {
    let feature;
    let result: GetPlaceCommandOutput;

    try {
      if (config.query) {
        const input: GetPlaceCommandInput = {
          PlaceId: config.query,
        };
        const command: GetPlaceCommand = new GetPlaceCommand(input);
        result = await amazonLocationClient.send(command);
      }

      feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: result.Position,
        },
        place_name: result.Title,
        properties: {
          ...result,
        },
        text: result.Title,
        center: result.Position,
      };
    } catch (e) {
      console.error(`Failed to searchByPlaceId with error: ${e}`);
    }
    return { place: feature };
  };
}

function createAmazonLocationGetSuggestionsV2(
  amazonLocationClient: GeoPlacesClient,
  omitSuggestionsWithoutPlaceId: boolean,
) {
  return async function (config) {
    const suggestions = [];
    try {
      const suggestParams: SuggestCommandInput = {
        QueryText: config.query,
        BiasPosition: config.proximity ? config.proximity : undefined,
        Language: config.language[0],
      };

      const command = new SuggestCommand(suggestParams);
      const results: SuggestCommandOutput = await amazonLocationClient.send(command);

      if (results.ResultItems) {
        for (const result of results.ResultItems) {
          // Skip Query suggestions, since they don't have a PlaceId
          if (omitSuggestionsWithoutPlaceId && result.Query) {
            continue;
          }
          const suggestionWithPlace = {
            text: result.Title,
            placeId: result.Place?.PlaceId || null,
          };
          suggestions.push(suggestionWithPlace);
        }
      }
    } catch (e) {
      console.error(`Failed to getSuggestions with error: ${e}`);
    }

    return {
      suggestions: suggestions,
    };
  };
}
