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
      parseObject(options);

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
    console.warn(
      `Number of categories ${filters.length} exceeds max number of ${MAX_CATEGORY_FILTERS} at a time. No change to filter selection.`,
    );
    return false;
  }

  public addCategoryFilter(category: string): boolean {
    if (this.filterCategories.length < MAX_CATEGORY_FILTERS) {
      const fixedStr = removeWhiteSpace(category);
      const enumCategory = CategoriesEnum[removeWhiteSpace(category) as keyof typeof CategoriesEnum];
      if (enumCategory) {
        this.filterCategories.push(CategoriesEnum[fixedStr as keyof typeof CategoriesEnum]);
        this.updateMaplibreGeocoderCategoryFilter();
        return true;
      } else {
        console.warn(
          `String: ${category}, is not a valid Category Filter. Please check the accepted Category Filters, and try again.`,
        );
      }
    } else {
      console.warn(
        `Number of categories is already at max filters of ${MAX_CATEGORY_FILTERS}. No change to filter selection. Remove a category before adding another.`,
      );
    }
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
    console.warn(
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
    console.warn(
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

  const omitSuggestionsWithoutPlaceId = options?.omitSuggestionsWithoutPlaceId || false;

  const amazonLocationGeocoderApi: AmazonLocationGeocoderApi = {};

  // maplibre-gl-geocoder always requires we have defined forwardGeocode.
  amazonLocationGeocoderApi.forwardGeocode = createAmazonLocationForwardGeocodeApi(locationClient, indexName);

  let maplibreglgeocoderOptions = {};

  if (options) {
    if (options.enableAll) {
      amazonLocationGeocoderApi.reverseGeocode = createAmazonLocationReverseGeocodeApi(locationClient, indexName);
      amazonLocationGeocoderApi.searchByPlaceId = createAmazonLocationSearchPlaceById(locationClient, indexName);
      amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(
        locationClient,
        indexName,
        omitSuggestionsWithoutPlaceId,
      );
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
        amazonLocationGeocoderApi.getSuggestions = createAmazonLocationGetSuggestions(
          locationClient,
          indexName,
          omitSuggestionsWithoutPlaceId,
        );
        maplibreglgeocoderOptions = {
          ...maplibreglgeocoderOptions,
          showResultsWhileTyping: true,
        };
      }
    }

    if (options.placeholder) {
      maplibreglgeocoderOptions = {
        ...maplibreglgeocoderOptions,
        placeholder: options.placeholder,
      };
    }
  }

  const renderFunction = getRenderFunction();
  maplibreglgeocoderOptions = {
    ...maplibreglgeocoderOptions,
    render: renderFunction,
  };

  return new AmazonLocationMaplibreGeocoder(amazonLocationGeocoderApi, maplibreglgeocoderOptions);
}

function parseObject(obj) {
  for (const key in obj) {
    if (obj[key] instanceof Object) {
      parseObject(obj[key]);
    }
  }
}

function removeWhiteSpace(str: string) {
  return str.replace(/\s/g, "");
}

function addWhiteSpace(str) {
  // Special exception for single category.
  if (str == "ATM") {
    return str;
  }
  return str.replace(/([A-Z])/g, " $1").trim();
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
        properties: {
          ...data,
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

function getRenderFunction() {
  return function (item) {
    // Gather the key items
    const geometry = item.geometry ? item.geometry : undefined;
    const placeId = item.placeId ? item.placeId : "";
    const text = item.text ? item.text : "";

    // Let's calc the substring that we are matching with.
    const separateIndex = text != "" ? text.indexOf(",") : -1;
    const title = separateIndex > -1 ? text.substring(0, separateIndex) : text;
    const address = separateIndex > 1 ? text.substring(separateIndex + 1).trim() : null;

    // If we have a placeId or a geometry we have a specific location, and we would like to use the pin icon.
    if (placeId || geometry) {
      // Check to see if we have title + address or just a title.
      if (address) {
        return (
          '<div class="mlg-option-container">' +
          '<svg class="mlg-icon" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.21875,20.96875 C7.21875,21.5402344 6.75898437,22 6.1875,22 C5.61601562,22 5.15625,21.5402344 5.15625,20.96875 L5.15625,12.2890625 C2.23007813,11.7992188 0,9.25546875 0,6.1875 C0,2.77019531 2.77019531,0 6.1875,0 C9.60351562,0 12.375,2.77019531 12.375,6.1875 C12.375,9.25546875 10.1449219,11.7992188 7.21875,12.2890625 L7.21875,20.96875 Z M6.1875,2.0625 C3.87148437,2.0625 2.0625,3.90929687 2.0625,6.1875 C2.0625,8.46484375 3.87148437,10.3125 6.1875,10.3125 C8.46484375,10.3125 10.3125,8.46484375 10.3125,6.1875 C10.3125,3.90929687 8.46484375,2.0625 6.1875,2.0625 Z" fill="#687078"/></svg>' +
          '<div class="mlg-option-details">' +
          '<div class="mlg-place-name">' +
          title +
          "</div>" +
          '<div class="mlg-address">' +
          address +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }
      return (
        '<div class="mlg-option-container">' +
        '<svg class="mlg-icon" viewBox="0 0 24 32" xmlns="http://www.w3.org/2000/svg"><path d="M7.21875,20.96875 C7.21875,21.5402344 6.75898437,22 6.1875,22 C5.61601562,22 5.15625,21.5402344 5.15625,20.96875 L5.15625,12.2890625 C2.23007813,11.7992188 0,9.25546875 0,6.1875 C0,2.77019531 2.77019531,0 6.1875,0 C9.60351562,0 12.375,2.77019531 12.375,6.1875 C12.375,9.25546875 10.1449219,11.7992188 7.21875,12.2890625 L7.21875,20.96875 Z M6.1875,2.0625 C3.87148437,2.0625 2.0625,3.90929687 2.0625,6.1875 C2.0625,8.46484375 3.87148437,10.3125 6.1875,10.3125 C8.46484375,10.3125 10.3125,8.46484375 10.3125,6.1875 C10.3125,3.90929687 8.46484375,2.0625 6.1875,2.0625 Z" fill="#687078"/></svg>' +
        '<div class="mlg-option-details">' +
        '<div class="mlg-place-name">' +
        title +
        "</div>" +
        '<div class="mlg-address">' +
        "Search Nearby" +
        "</div>" +
        "</div>" +
        "</div>"
      );
      // We do not appear to have a specific place, we would like to use the magnify glass icon.
    } else {
      if (address) {
        return (
          '<div class="mlg-option-container">' +
          '<svg class="mlg-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2,8 C2,4.691 4.691,2 8,2 C11.309,2 14,4.691 14,8 C14,11.309 11.309,14 8,14 C4.691,14 2,11.309 2,8 M17.707,16.293 L14.312,12.897 C15.365,11.543 16,9.846 16,8 C16,3.589 12.411,0 8,0 C3.589,0 0,3.589 0,8 C0,12.411 3.589,16 8,16 C9.846,16 11.543,15.365 12.897,14.312 L16.293,17.707 C16.488,17.902 16.744,18 17,18 C17.256,18 17.512,17.902 17.707,17.707 C18.098,17.316 18.098,16.684 17.707,16.293" fill="#687078"/></svg>' +
          '<div class="mlg-option-details">' +
          '<div class="mlg-place-name">' +
          title +
          "</div>" +
          '<div class="mlg-address">' +
          address +
          "</div>" +
          "</div>" +
          "</div>"
        );
      }
      return (
        '<div class="mlg-option-container">' +
        '<svg class="mlg-icon" viewBox="0 0 24 32" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M2,8 C2,4.691 4.691,2 8,2 C11.309,2 14,4.691 14,8 C14,11.309 11.309,14 8,14 C4.691,14 2,11.309 2,8 M17.707,16.293 L14.312,12.897 C15.365,11.543 16,9.846 16,8 C16,3.589 12.411,0 8,0 C3.589,0 0,3.589 0,8 C0,12.411 3.589,16 8,16 C9.846,16 11.543,15.365 12.897,14.312 L16.293,17.707 C16.488,17.902 16.744,18 17,18 C17.256,18 17.512,17.902 17.707,17.707 C18.098,17.316 18.098,16.684 17.707,16.293" fill="#687078"/></svg>' +
        '<div class="mlg-option-details">' +
        '<div class="mlg-place-name">' +
        title +
        "</div>" +
        '<div class="mlg-address">' +
        "Search Nearby" +
        "</div>" +
        "</div>" +
        "</div>"
      );
    }
  };
}
