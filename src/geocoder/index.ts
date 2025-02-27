import { GeoPlacesClient } from "@aws-sdk/client-geo-places";

import { LocationClient } from "@aws-sdk/client-location";

import { default as MaplibreGeocoder, MaplibreGeocoderApi } from "@maplibre/maplibre-gl-geocoder";

import maplibregl, { IControl } from "maplibre-gl";
import { CategoriesEnum, CountriesEnum, BoundingBox, Position, PlacesGeocoderOptions } from "../common/types";

import {
  ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE,
  LOCATION_CLIENT_WITHOUT_PLACES_INDEX_ERROR_MESSAGE,
  MAX_CATEGORY_FILTERS,
  MAX_COUNTRY_FILTERS,
  UNKNOWN_CLIENT_ERROR_MESSAGE,
} from "../common/constants";
import { getApiDefinitionsGeoPlaces } from "./utils/api-definitions-geoplaces";
import { getApiDefinitionsLocation } from "./utils/api-definitions-location";

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
  readonly amazonLocationApi: MaplibreGeocoderApi;

  // Since it is technically possible for a customer to define the MaplibreGeocoderApi themselves, check to make sure they have at least forwardGeocode defined.
  public constructor(amazonLocationGeocoderApi: MaplibreGeocoderApi, options?) {
    this.amazonLocationApi = amazonLocationGeocoderApi;
    if (this.amazonLocationApi.forwardGeocode != undefined) {
      // When this module is bundled, we use the maplibre imported as maplibregl, since that's what it will be bundled with
      // But if this is used in browser, then maplibre will be imported dynamically in the browser as well, and that is
      // we need to use, otherwise there will typecheck mismatches between the maplibre-gl that was bundled vs. the one
      // imported in the browser, even if they are the same version.
      // For example, maplibregl.LngLatBounds will have a different signature between the two maplibre's, so its internal
      // logic for converting a LngLatBounds will fail an explicit instance type check.
      let maplibre = maplibregl;
      if (typeof window == "object" && window.maplibregl) {
        maplibre = window.maplibregl;
      }

      this.maplibreGeocoder = new MaplibreGeocoder(this.amazonLocationApi, {
        maplibregl: maplibre,
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
    this.updateMaplibreGeocoderBoundingBox(null);
  }

  public getBoundingBox() {
    return this.filterBBox;
  }

  private updateMaplibreGeocoderBoundingBox(BBox: [number, number, number, number]) {
    this.maplibreGeocoder.setBbox(BBox);
    this.maplibreGeocoder.setProximity(null); // clears the proximity since we can only use one.
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
    this.maplibreGeocoder.setBbox(null); // clears Bbox since we can only have one or the other.
  }

  // This function will clear all filters at once.
  public clearFilters(): void {
    this.filterCategories = [];
    this.filterCountries = [];
    this.filterBBox = null;
    this.biasPosition = null;
    this.updateMaplibreGeocoderCategoryFilter();
    this.updateMaplibreGeocoderCountryFilter();
    this.updateMaplibreGeocoderBoundingBox(null);
    this.updateMaplibreGeocoderBiasPosition({});
  }
}

/*
 * geoPlacesClient
 * - GeoPlacesClient
 * - optional
 *
 * locationClient
 * - LocationClient
 * - optional
 *
 * indexName
 * - string
 * - Place index resource to use.
 * - optional (required if you are using locationClient)
 *
 * options
 * - PlacesGeocoderOptions
 * - Object of 4 booleans, enableAll, enable*Api to define which API's you would like enabled in the geocoder.
 * - Optional
 */
export function buildAmazonLocationMaplibreGeocoder(
  placesClient: GeoPlacesClient | LocationClient,
  options?: PlacesGeocoderOptions,
) {
  let maplibreApis: MaplibreGeocoderApi;

  // Setup the API definitions based on which type of client was passed in.
  // Checking the serviceId will work for both bundled or browser use-case, whereas if we
  // check against instanceof GeoPlacesClient | LocationClient, it will fail to recognize
  // if the clients were imported separately in the browser.
  if (placesClient.config.serviceId == "Geo Places") {
    maplibreApis = getApiDefinitionsGeoPlaces(placesClient as GeoPlacesClient, options);
  } else if (placesClient.config.serviceId == "Location") {
    console.warn("We have an instance of LocationClient");
    if (options && options.placesIndex) {
      maplibreApis = getApiDefinitionsLocation(placesClient as LocationClient, options.placesIndex, options);
    } else {
      throw new Error(LOCATION_CLIENT_WITHOUT_PLACES_INDEX_ERROR_MESSAGE);
    }
  } else {
    throw new Error(UNKNOWN_CLIENT_ERROR_MESSAGE);
  }

  let maplibreglgeocoderOptions = {};

  maplibreglgeocoderOptions = {
    ...maplibreglgeocoderOptions,
    reverseGeocode: true,
  };

  if (options) {
    maplibreglgeocoderOptions = {
      ...maplibreglgeocoderOptions,
      ...(options.enableAll || options.enableGetSuggestions ? { showResultsWhileTyping: true } : {}),
      ...(options.placeholder ? { placeholder: options.placeholder } : {}),

      ...(options.flyTo !== undefined ? { flyTo: options.flyTo } : {}),
      ...(options.zoom !== undefined ? { zoom: options.zoom } : {}),
      ...(options.trackProximity !== undefined ? { trackProximity: options.trackProximity } : {}),
      ...(options.proximityMinZoom !== undefined ? { proximityMinZoom: options.proximityMinZoom } : {}),
      ...(options.showResultsWhileTyping !== undefined
        ? { showResultsWhileTyping: options.showResultsWhileTyping }
        : {}),
      ...(options.minLength !== undefined ? { minLength: options.minLength } : {}),
      ...(options.reverseGeocode !== undefined ? { reverseGeocode: options.reverseGeocode } : {}),
      ...(options.limit !== undefined ? { limit: options.limit } : {}),
      ...(options.collapsed !== undefined ? { collapsed: options.collapsed } : {}),
      ...(options.clearAndBlurOnEsc !== undefined ? { clearAndBlurOnEsc: options.clearAndBlurOnEsc } : {}),
      ...(options.clearOnBlur !== undefined ? { clearOnBlur: options.clearOnBlur } : {}),
      ...(options.localGeocoderOnly !== undefined ? { localGeocoderOnly: options.localGeocoderOnly } : {}),
      ...(options.debounceSearch !== undefined ? { debounceSearch: options.debounceSearch } : {}),
      ...(options.language !== undefined ? { language: options.language } : {}),
      ...(options.reverseMode !== undefined ? { reverseMode: options.reverseMode } : {}),
      ...(options.getItemValue ? { getItemValue: options.getItemValue } : {}),
      ...(options.render ? { render: options.render } : {}),
      ...(options.popupRender ? { popupRender: options.popupRender } : {}),
      ...(options.filter ? { filter: options.filter } : {}),
    };
  }

  const renderFunction = getRenderFunction();
  maplibreglgeocoderOptions = {
    ...maplibreglgeocoderOptions,
    render: renderFunction,
  };

  return new AmazonLocationMaplibreGeocoder(maplibreApis, maplibreglgeocoderOptions);
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

function removeWhiteSpace(str: string) {
  return str.replace(/\s/g, "");
}
