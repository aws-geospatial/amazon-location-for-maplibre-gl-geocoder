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
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import maplibregl, { IControl } from "maplibre-gl";
import {
  CategoriesEnum,
  CountriesEnum,
  BoundingBox,
  Position,
  AmazonLocationGeocoderApi,
  PlacesGeocoderOptions,
} from "../common/types";

import {
  ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE,
  MAX_CATEGORY_FILTERS,
  MAX_COUNTRY_FILTERS,
} from "../common/constants";

export class AmazonLocationMaplibreGeocoder {
  // This is our MaplibreGeocoder instance which will manage the use of the API.
  private readonly maplibreGeocoder: MaplibreGeocoder = null;

  // These Manage the State of the Geocoder, which is used
  private filterCountries: CountriesEnum[] = [];
  private filterCategories: CategoriesEnum[] = [];
  private filterBBox: BoundingBox = null;
  private biasPosition: Position = null;
  private language = "en";

  // This is the state of the API that currently exist
  readonly amazonLocationApi: AmazonLocationGeocoderApi;

  // Since it is technically possible for a customer to define the AmazonLocationGeocoderApi themselves, check to make sure they have at least forward defined.
  public constructor(amazonLocationGeocoderApi: AmazonLocationGeocoderApi, options?) {
    this.amazonLocationApi = amazonLocationGeocoderApi;
    if (this.amazonLocationApi.forwardGeocode != undefined) {
      this.maplibreGeocoder = new MaplibreGeocoder(this.amazonLocationApi, {
        maplibregl: maplibregl,
        language: this.language,
        ...options,
      });
    } else {
      throw new Error(ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE);
    }
  }

  // Maplibre-gl-geocoder related stuff.
  public getPlacesGeocoder(): IControl {
    return this.maplibreGeocoder;
  }

  // Filtering Logic.
  public setCategoryFilter(filters: CategoriesEnum[]): boolean {
    if (filters.length <= MAX_CATEGORY_FILTERS) {
      this.filterCategories = filters;
      this.updateMaplibreGeocoderCategoryFilter();
      return true;
    }
    console.log(
      `Number of categories ${filters.length} exceeds max number of ${MAX_CATEGORY_FILTERS} at a time. No change to filter selection.`,
    );
    return false;
  }

  public addCategoryFilter(category: CategoriesEnum): boolean {
    if (this.filterCategories.length < MAX_CATEGORY_FILTERS) {
      this.filterCategories.push(category);
      this.updateMaplibreGeocoderCategoryFilter();
      return true;
    }
    console.log(
      `Number of categories is already at max filters of ${MAX_CATEGORY_FILTERS}. No change to filter selection. Remove a category before adding another.`,
    );
    return false;
  }

  public clearCategoryFilter(): void {
    this.filterCategories = [];
    this.updateMaplibreGeocoderCategoryFilter();
  }

  public getCategoryFilter() {
    return this.filterCategories;
  }

  private updateMaplibreGeocoderCategoryFilter() {
    this.maplibreGeocoder.setTypes(this.filterCategories.join(","));
  }

  public setCountryFilter(filters: CountriesEnum[]): boolean {
    if (filters.length <= MAX_COUNTRY_FILTERS) {
      this.filterCountries = filters;
      this.updateMaplibreGeocoderCountryFilter();
      return true;
    }
    console.log(
      `Number of countries ${filters.length} exceeds max number of ${MAX_COUNTRY_FILTERS} at a time. No change to filter selection.`,
    );
    return false;
  }

  public addCountryFilter(country: CountriesEnum): boolean {
    if (this.filterCountries.length < MAX_COUNTRY_FILTERS) {
      this.filterCountries.push(country);
      this.updateMaplibreGeocoderCountryFilter();
      return true;
    }
    console.log(
      `Number of countries is already at max filters of ${MAX_COUNTRY_FILTERS}. No change to filter selection. Remove a country before adding another.`,
    );
    return false;
  }

  public clearCountryFilter(): void {
    this.filterCountries = [];
    this.updateMaplibreGeocoderCountryFilter();
  }

  public getCountryFilter() {
    return this.filterCountries;
  }

  private updateMaplibreGeocoderCountryFilter() {
    this.maplibreGeocoder.setCountries(this.filterCountries.join(","));
  }

  // You cannot have a bias and a BBox in the same call, this will remove the bias and add the bbox.
  public setBoundingBox(boundingBox: BoundingBox): void {
    this.biasPosition = null;
    this.filterBBox = boundingBox;
    this.updateMaplibreGeocoderBoundingBox([
      this.filterBBox.longitudeSW,
      this.filterBBox.latitudeSW,
      this.filterBBox.longitudeNE,
      this.filterBBox.latitudeNE,
    ]);
  }

  public clearBoundingBox(): void {
    this.filterBBox = null;
    this.updateMaplibreGeocoderBoundingBox([]);
  }

  public getBoundingBox() {
    return this.filterBBox;
  }

  private updateMaplibreGeocoderBoundingBox(BBox: number[]) {
    this.maplibreGeocoder.setBbox(BBox);
    this.maplibreGeocoder.setProximity({}); // clears the proximity since we can only use one.
  }

  public setBiasPosition(position: Position): void {
    this.filterBBox = null;
    this.biasPosition = position;
    this.updateMaplibreGeocoderBiasPosition(position);
  }

  public clearBiasPosition() {
    this.biasPosition = null;
    this.updateMaplibreGeocoderBiasPosition({});
  }

  // We always return our managed version.
  public getBiasPosition() {
    return this.biasPosition;
  }

  private updateMaplibreGeocoderBiasPosition(position): void {
    this.maplibreGeocoder.setProximity(position);
    this.maplibreGeocoder.setBbox([]); // clears Bbox since we can only have one or the other.
  }

  // This function will clear all filters at once.
  public clearFilters(): void {
    this.filterCategories = [];
    this.filterCountries = [];
    this.filterBBox = null;
    this.biasPosition = null;
    this.updateMaplibreGeocoderCategoryFilter();
    this.updateMaplibreGeocoderCountryFilter();
    this.updateMaplibreGeocoderBoundingBox([]);
    this.updateMaplibreGeocoderBiasPosition({});
  }
}

/*
 * amazonLocationClient
 *  - LocationClient
 *  - required
 *
 * indexName
 * - string
 * - Place index resource to use.
 * - required
 *
 * options
 * - PlacesGeocderOptions
 * - Object of 4 booleans, enableAll, enable*Api to define which API's you would like enabled in the geocoder.
 * - Optional
 */
export function buildAmazonLocationMaplibreGeocoder(
  amazonLocationClient: LocationClient,
  indexName: string,
  options?: PlacesGeocoderOptions,
) {
  const locationClient = amazonLocationClient;

  const amazonLocationGeocoderApi: AmazonLocationGeocoderApi = {};

  // maplibre-gl-geocoder always requires we have defined forwardGeocode.
  amazonLocationGeocoderApi.forwardGeocode = createAmazonLocationForwardGeocodeApi(locationClient, indexName);

  let maplibreglgeocoderOptions = {};

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.reverseGeocode = createAmazonLocationReverseGeocodeApi(locationClient, indexName);
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(locationClient, indexName);
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(locationClient, indexName);
      maplibreglgeocoderOptions = {
        ...maplibreglgeocoderOptions,
        reverseGeocode: true,
        showResultsWhileTyping: true,
      };
    } else {
      if (options.enableReverseGeocode) {
        amazonLocationGeocoderApi.reverseGeocode = createAmazonLocationReverseGeocodeApi(locationClient, indexName);
        maplibreglgeocoderOptions = {
          ...maplibreglgeocoderOptions,
          reverseGeocode: true,
        };
      }

      if (options.enableSearchByPlaceId) {
        amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(locationClient, indexName);
      }

      if (options.enableGetSuggestions) {
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(locationClient, indexName);
        maplibreglgeocoderOptions = {
          ...maplibreglgeocoderOptions,
          showResultsWhileTyping: true,
        };
      }
    }
  }

  return new AmazonLocationMaplibreGeocoder(amazonLocationGeocoderApi, maplibreglgeocoderOptions);
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
        searchPlaceIndexForTextParams.FilterCategories = config.types.toString().split(",");
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
            ...result.Place,
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
    return { features: features };
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
            ...result.Place,
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
    return { features: features };
  };
}

function createAmazonLocationSearchPlaceById(amazonLocationClient: LocationClient, customerPlacesName: string) {
  // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
  const placesName = customerPlacesName;
  const client = amazonLocationClient;
  return async function (config) {
    let feature;
    try {
      // Set up parameters for search call
      const getPlaceParams: GetPlaceCommandInput = {
        IndexName: placesName,
        PlaceId: config.query,
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
        text: data.Place.Label,
        center: data.Place.Geometry.Point,
      };
    } catch (e) {
      console.error(`Failed to searchByPlaceId with error: ${e}`);
    }
    return { place: feature };
  };
}

function createAmazonLocationGetSuggestions(amazonLocationClient: LocationClient, customerPlacesName: string) {
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
        searchPlaceIndexForSuggestionsParams.FilterCategories = config.types.toString().split(",");
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
