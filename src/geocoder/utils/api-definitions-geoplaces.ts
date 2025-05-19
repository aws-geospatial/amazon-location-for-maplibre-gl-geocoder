// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  GeoPlacesClient,
  AutocompleteCommand,
  SearchTextCommand,
  ReverseGeocodeCommand,
  SuggestCommand,
  GetPlaceCommand,
  AutocompleteCommandInput,
  AutocompleteAdditionalFeature,
  SearchTextCommandInput,
  SearchTextAdditionalFeature,
  ReverseGeocodeCommandInput,
  ReverseGeocodeAdditionalFeature,
  SuggestCommandInput,
  SuggestAdditionalFeature,
  GetPlaceCommandInput,
  GetPlaceAdditionalFeature,
  AutocompleteCommandOutput,
  GetPlaceCommandOutput,
  SuggestCommandOutput,
  SearchTextCommandOutput,
  ReverseGeocodeCommandOutput,
} from "@aws-sdk/client-geo-places";
import { PlacesGeocoderOptions } from "../../common/types";
import { MaplibreGeocoderApi, MaplibreGeocoderFeatureResults } from "@maplibre/maplibre-gl-geocoder";

export function getApiDefinitionsGeoPlaces(
  geoPlacesClient: GeoPlacesClient,
  options?: PlacesGeocoderOptions,
): MaplibreGeocoderApi {
  const placesClient: GeoPlacesClient = geoPlacesClient;

  // maplibre-gl-geocoder always requires we have defined forwardGeocode and reverseGeocode
  const amazonLocationGeocoderApi: MaplibreGeocoderApi = {
    forwardGeocode: createAmazonLocationForwardGeocodeApiGeoPlaces(
      placesClient,
      options?.forwardGeocodeAdditionalFeatures,
    ),
    reverseGeocode: createAmazonLocationReverseGeocodeApiGeoPlaces(
      placesClient,
      options?.reverseGeocodeAdditionalFeatures,
    ),
  };

  const omitSuggestionsWithoutPlaceId = options?.omitSuggestionsWithoutPlaceId || false;

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceByIdGeoPlaces(
        placesClient,
        options?.searchByPlaceIdAdditionalFeatures,
      );
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestionsGeoPlaces(
        placesClient,
        omitSuggestionsWithoutPlaceId,
      );
    } else {
      if (options.enableSearchByPlaceId) {
        amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceByIdGeoPlaces(
          placesClient,
          options?.searchByPlaceIdAdditionalFeatures,
        );
      }

      if (options.enableGetSuggestions) {
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestionsGeoPlaces(
          placesClient,
          omitSuggestionsWithoutPlaceId,
        );
      }
    }
  }

  return amazonLocationGeocoderApi;
}

function createAmazonLocationForwardGeocodeApiGeoPlaces(
  amazonLocationClient: GeoPlacesClient,
  additionalFeatures?: SearchTextAdditionalFeature[],
) {
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
        AdditionalFeatures: additionalFeatures || [
          SearchTextAdditionalFeature.CONTACT,
          SearchTextAdditionalFeature.TIME_ZONE,
        ],
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

function createAmazonLocationReverseGeocodeApiGeoPlaces(
  amazonLocationClient: GeoPlacesClient,
  additionalFeatures?: ReverseGeocodeAdditionalFeature[],
) {
  return async function (config) {
    const features = [];
    try {
      const reverseGeocodeParams: ReverseGeocodeCommandInput = {
        QueryPosition: config.query,
        Language: config.language ? config.language : undefined,
        MaxResults: config.limit ? config.limit : undefined,
        AdditionalFeatures: additionalFeatures || [ReverseGeocodeAdditionalFeature.TIME_ZONE],
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

function createAmazonLocationSearchPlaceByIdGeoPlaces(
  amazonLocationClient: GeoPlacesClient,
  additionalFeatures?: GetPlaceAdditionalFeature[],
) {
  return async function (config) {
    let feature;
    let result: GetPlaceCommandOutput;

    try {
      if (config.query) {
        const input: GetPlaceCommandInput = {
          PlaceId: config.query,
          AdditionalFeatures: additionalFeatures || [
            GetPlaceAdditionalFeature.CONTACT,
            GetPlaceAdditionalFeature.TIME_ZONE,
          ],
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

function createAmazonLocationSuggestCommand(amazonLocationClient: GeoPlacesClient) {
  return async function (config) {
    const suggestions = [];
    try {
      const suggestParams: SuggestCommandInput = {
        QueryText: config.query,
        BiasPosition: config.proximity ? config.proximity : undefined,
        Language: config.language[0],
        AdditionalFeatures: [SuggestAdditionalFeature.CORE],
      };

      const command = new SuggestCommand(suggestParams);
      const results: SuggestCommandOutput = await amazonLocationClient.send(command);

      if (results.ResultItems) {
        for (const result of results.ResultItems) {
          const suggestionWithPlace = {
            text: result.Query ? result.Title : result.Place.Address?.Label,
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

function createAmazonLocationAutocompleteCommand(amazonLocationClient: GeoPlacesClient) {
  return async function (config) {
    const suggestions = [];
    try {
      const suggestParams: AutocompleteCommandInput = {
        QueryText: config.query,
        BiasPosition: config.proximity ? config.proximity : undefined,
        Language: config.language[0],
        AdditionalFeatures: [AutocompleteAdditionalFeature.CORE],
      };

      const command = new AutocompleteCommand(suggestParams);
      const results: AutocompleteCommandOutput = await amazonLocationClient.send(command);

      if (results.ResultItems) {
        for (const result of results.ResultItems) {
          const suggestionWithPlace = {
            text: result.Address?.Label,
            placeId: result.PlaceId,
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

function createAmazonLocationGetSuggestionsGeoPlaces(
  amazonLocationClient: GeoPlacesClient,
  omitSuggestionsWithoutPlaceId: boolean,
) {
  // If the user wants to omit suggestions without a PlaceId, then use
  // the Autocomplete API instead of Suggest, since Suggest includes query text results
  return omitSuggestionsWithoutPlaceId
    ? createAmazonLocationAutocompleteCommand(amazonLocationClient)
    : createAmazonLocationSuggestCommand(amazonLocationClient);
}
