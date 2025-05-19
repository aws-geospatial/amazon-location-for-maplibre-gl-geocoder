// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import {
  LocationClient,
  GetPlaceCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForSuggestionsCommand,
  GetPlaceCommandInput,
  SearchPlaceIndexForPositionCommandInput,
  SearchPlaceIndexForSuggestionsCommandInput,
  SearchPlaceIndexForTextCommandInput,
} from "@aws-sdk/client-location";
import { MaplibreGeocoderApi, MaplibreGeocoderFeatureResults } from "@maplibre/maplibre-gl-geocoder";
import { PlacesGeocoderOptions } from "../../common/types";

export function getApiDefinitionsLocation(
  locationClient: LocationClient,
  placesIndex: string,
  options?: PlacesGeocoderOptions,
): MaplibreGeocoderApi {
  const placesClient: LocationClient = locationClient;

  // maplibre-gl-geocoder always requires we have defined forwardGeocode and reverseGeocode
  const amazonLocationGeocoderApi: MaplibreGeocoderApi = {
    forwardGeocode: createAmazonLocationForwardGeocodeApi(placesClient, placesIndex),
    reverseGeocode: createAmazonLocationReverseGeocodeApi(placesClient, placesIndex),
  };

  const omitSuggestionsWithoutPlaceId = options?.omitSuggestionsWithoutPlaceId || false;

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(placesClient, placesIndex);
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(
        placesClient,
        placesIndex,
        omitSuggestionsWithoutPlaceId,
      );
    } else {
      if (options.enableSearchByPlaceId) {
        amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(placesClient, placesIndex);
      }

      if (options.enableGetSuggestions) {
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(
          placesClient,
          placesIndex,
          omitSuggestionsWithoutPlaceId,
        );
      }
    }
  }

  return amazonLocationGeocoderApi;
}

function createAmazonLocationForwardGeocodeApi(amazonLocationClient: LocationClient, customerPlacesName: string) {
  // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
  const placesName = customerPlacesName;
  const client = amazonLocationClient;

  return async function (config) {
    const features = [];
    try {
      // Set up parameters for search call.
      const searchPlaceIndexForTextParams: SearchPlaceIndexForTextCommandInput = {
        IndexName: placesName,
        Text: config.query,
        // Maplibre-gl-geocoder stores the language value as an array of language codes. Amazon Location only supports a single language at a time.
        Language: config.language[0],
      };

      if (config.countries) {
        searchPlaceIndexForTextParams.FilterCountries = config.countries.toString().split(",");
      }

      if (config.types) {
        // Convert the string into an array broken by the comma's.
        const categories = config.types.toString().split(",");

        // Add a white space in the middle of all strings that were multiple words.
        for (const index in categories) {
          categories[index] = addWhiteSpace(categories[index]);
        }
        searchPlaceIndexForTextParams.FilterCategories = categories;
      }

      if (config.bbox) {
        if (config.bbox.length == 4) {
          searchPlaceIndexForTextParams.FilterBBox = config.bbox;
        }
      }

      if (config.proximity) {
        if (config.proximity.length == 2) {
          searchPlaceIndexForTextParams.BiasPosition = config.proximity;
        }
      }

      // Set up command to call SearchPlaceIndexForText API
      const command = new SearchPlaceIndexForTextCommand(searchPlaceIndexForTextParams);
      const data = await client.send(command);

      // Convert the results to Carmen geojson for maplibre-gl-geocoder defined here: https://github.com/maxenceyrowah/carmen/blob/master/carmen-geojson.md
      for (const result of data.Results) {
        const feature = {
          type: "Feature",
          geometry: {
            type: "Point",
            coordinates: result.Place.Geometry.Point,
          },
          place_name: result.Place.Label,
          properties: {
            ...result,
          },
          text: result.Place.Label,
          place_type: ["place"],
          center: result.Place.Geometry.Point,
        };
        features.push(feature);
      }
    } catch (e) {
      console.error(`Failed to forwardGeocode with error: ${e}`);
    }
    return { features: features } as MaplibreGeocoderFeatureResults;
  };
}

function createAmazonLocationReverseGeocodeApi(amazonLocationClient: LocationClient, customerPlacesName: string) {
  // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
  const placesName = customerPlacesName;
  const client = amazonLocationClient;
  return async function (config) {
    const features = [];
    try {
      const searchPlaceIndexForPositionParams: SearchPlaceIndexForPositionCommandInput = {
        Position: config.query,
        IndexName: placesName,
        // Maplibre-gl-geocoder stores the language value as an array of language codes. Amazon Location only supports a single language at a time.
        Language: config.language[0],
      };

      // Set up the command to call SearchPlaceIndexForPosition
      const command = new SearchPlaceIndexForPositionCommand(searchPlaceIndexForPositionParams);
      const data = await client.send(command);

      // Convert the results to Carmen geojson for maplibre-gl-geocoder defined here: https://github.com/maxenceyrowah/carmen/blob/master/carmen-geojson.md
      for (const result of data.Results) {
        const feature = {
          type: "Feature",
          id: result.PlaceId,
          geometry: {
            type: "Point",
            coordinates: result.Place.Geometry.Point,
          },
          place_name: result.Place.Label,
          properties: {
            ...result,
          },
          text: result.Place.Label,
          place_type: ["place"],
          center: result.Place.Geometry.Point,
        };
        features.push(feature);
      }
      // Converts the results to a collection of results.
    } catch (e) {
      console.error(`Failed to reverseGeocode with error: ${e}`);
    }
    return { features: features } as MaplibreGeocoderFeatureResults;
  };
}

function createAmazonLocationSearchPlaceById(amazonLocationClient: LocationClient, customerPlacesName: string) {
  // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
  const placesName = customerPlacesName;
  const client = amazonLocationClient;
  return async function (config) {
    let feature;
    const placeId = config.query;
    try {
      // Set up parameters for search call
      const getPlaceParams: GetPlaceCommandInput = {
        IndexName: placesName,
        PlaceId: placeId,
        // Maplibre-gl-geocoder stores the language value as an array of language codes. Amazon Location only supports a single language at a time.
        Language: config.language[0],
      };

      // Set up command to call GetPlace API with a place Id of a selected suggestion
      const command = new GetPlaceCommand(getPlaceParams);
      const data = await client.send(command);
      // Convert the results to Carmen geojson for maplibre-gl-geocoder defined here: https://github.com/maxenceyrowah/carmen/blob/master/carmen-geojson.md
      feature = {
        type: "Feature",
        geometry: {
          type: "Point",
          coordinates: data.Place.Geometry.Point,
        },
        place_name: data.Place.Label,
        properties: {
          ...data,
          PlaceId: placeId,
        },
        text: data.Place.Label,
        center: data.Place.Geometry.Point,
      };
    } catch (e) {
      console.error(`Failed to searchByPlaceId with error: ${e}`);
    }
    return { place: feature };
  };
}

function createAmazonLocationGetSuggestions(
  amazonLocationClient: LocationClient,
  customerPlacesName: string,
  omitSuggestionsWithoutPlaceId: boolean,
) {
  // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
  const placesName = customerPlacesName;
  const client = amazonLocationClient;
  return async function (config) {
    const suggestions = [];
    try {
      // Set up parameters for search call
      const searchPlaceIndexForSuggestionsParams: SearchPlaceIndexForSuggestionsCommandInput = {
        IndexName: placesName,
        Text: config.query,
        // Maplibre-gl-geocoder stores the language value as an array of language codes. Amazon Location only supports a single language at a time.
        Language: config.language[0],
      };

      if (config.countries) {
        searchPlaceIndexForSuggestionsParams.FilterCountries = config.countries.toString().split(",");
      }

      if (config.types) {
        // Convert the string into an array broken by the comma's.
        const categories = config.types.toString().split(",");

        // Add a white space in the middle of all strings that were multiple words.
        for (const index in categories) {
          categories[index] = addWhiteSpace(categories[index]);
        }
        searchPlaceIndexForSuggestionsParams.FilterCategories = categories;
      }

      if (config.bbox) {
        if (config.bbox.length == 4) {
          searchPlaceIndexForSuggestionsParams.FilterBBox = config.bbox;
        }
      }

      if (config.proximity) {
        if (config.proximity.length == 2) {
          searchPlaceIndexForSuggestionsParams.BiasPosition = config.proximity;
        }
      }

      // Set up a command to call SearchPlaceIndexForSuggestions API
      const command = new SearchPlaceIndexForSuggestionsCommand(searchPlaceIndexForSuggestionsParams);
      const data = await client.send(command);
      // Iterate over data.Results and return all suggestions and their place ids
      for (const result of data.Results) {
        // Skip suggestions that don't have a PlaceId (query suggestions) if specified
        if (omitSuggestionsWithoutPlaceId && !result.PlaceId) {
          continue;
        }

        const suggestionWithPlace = {
          text: result.Text,
          placeId: result.PlaceId,
        };
        suggestions.push(suggestionWithPlace);
      }
    } catch (e) {
      console.error(`Failed to getSuggestions with error: ${e}`);
    }

    return {
      suggestions: suggestions,
    };
  };
}

function addWhiteSpace(str) {
  // Special exception for single category.
  if (str == "ATM") {
    return str;
  }
  return str.replace(/([A-Z])/g, " $1").trim();
}
