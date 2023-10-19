import { withAPIKey } from "@aws/amazon-location-utilities-auth-helper";
import {
  LocationClient,
  GetPlaceCommand,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForTextCommand,
  SearchPlaceIndexForSuggestionsCommand
} from "@aws/amazon-location-client";
import MaplibreGeocoder from '@maplibre/maplibre-gl-geocoder';
import maplibregl, { IControl } from 'maplibre-gl';
import {
  CategoriesEnum,
  CountriesEnum,
  BoundingBox,
  Position,
  AmazonLocationGeocoderApi
} from "../common/types";

import { MAX_CATEGORY_FILTERS, MAX_COUNTRY_FILTERS } from "../common/constants";

interface AmazonLocationCredentials {
  mapName: string;
  placesName: string;
  region: string;
  apiKey: string;
}

export class AmazonLocationMaplibreGeocoder {
  // Amazon Location Service:
  // These fields are required in order to Auth into the customers account, and use their needed resources.
  readonly mapName: string;
  readonly placesName: string;
  readonly region: string;
  readonly apiKey: string;

  // This is the AmazonLocationAuthHelper which is used for Authenticating the User.
  private amazonLocationAuthHelper = null;

  // This is our MaplibreGeocoder instance which will manage the use of the API.
  private maplibreGeocoder : MaplibreGeocoder = null;

  // These Manage the State of the Geocoder, which is used
  private filterCountries: CountriesEnum[] = [];
  private filterCategories: CategoriesEnum[] = [];
  private filterBBox: BoundingBox = null;
  private biasPosition: Position = null;
  private language = "en";
  private center = [-77.03674, 38.891602];

  // This is the stateful API that currently exist
  private AmazonLocationApi : AmazonLocationGeocoderApi = {};

  public constructor(credentials: AmazonLocationCredentials) {
    this.mapName = credentials.mapName;
    this.placesName = credentials.placesName;
    this.region = credentials.region;
    this.apiKey = credentials.apiKey;
  }

  public async createAmazonLocationForwardGeocodeApi() {
    if (this.amazonLocationAuthHelper == null) {
      // We need to create the AuthHelper/Location Clients.
      this.amazonLocationAuthHelper = await withAPIKey(this.apiKey);
    }

    // Since 'this' does not exist in the context of the APIs we will need to have const values we pass through at point of creation.
    const placesName = this.placesName;
    const apiKey = this.apiKey;
    const region = this.region;
    const amazonLocationAuthHelper = this.amazonLocationAuthHelper;

    this.AmazonLocationApi.forwardGeocode = async function(config) {
        const features = [];
        try {
          // Set up parameters for search call.
          let params = {};
          params = {
            IndexName: placesName,
            Text: config.query,
            Key: apiKey,
            Language: config.language,
          };

          if (config.countries.length > 0) {
            params = {
              ...params,
              FilterCountries: config.countries.toString().split(','),
            };
          }

          if (config.types.length > 0) {
            params = {
              ...params,
              FilterCategories: config.types.toString().split(','),
            };
          }

          if (config.bbox.length > 0) {
            params = {
              ...params,
              FilterBBox: config.bbox,
            };
          }

          if (config.proximity.longitude != undefined && config.proximity.latitude != undefined) {
            params = {
              ...params,
              BiasPosition: [config.proximity.longitude, config.proximity.latitude]
            }
          }

          const client = new LocationClient({
            Region: region,
            ...amazonLocationAuthHelper.getLocationClientConfig(),
          });

          // Set up command to call SearchPlaceIndexForText API
          const command = new SearchPlaceIndexForTextCommand(params);
          const data = await client.send(command);

          // Convert the results to Carmen geojson to be returned to the MapLibre Geocoder
          for (const result of data.Results) {
            const feature = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: result.Place.Geometry.Point,
              },
              place_name: result.Place.Label,
              properties: {
                id: result.Place.PlaceId,
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
        return {
          features: features,
        };
    };
    return this.AmazonLocationApi;
  }

  public async createAmazonLocationReverseGeocodeApi() {
    // This will create just the Reverse Geocode Logic.
    if (this.amazonLocationAuthHelper == null) {
      this.amazonLocationAuthHelper = await withAPIKey(this.apiKey);
    }

    const placesName = this.placesName;
    const apiKey = this.apiKey;
    const region = this.region;
    const amazonLocationAuthHelper = this.amazonLocationAuthHelper;
    this.AmazonLocationApi.reverseGeocode = async function (config) {
        const features = [];
        try {
          const params = {
            IndexName: placesName,
            Text: config.query,
            Key: apiKey,
            Language: config.language,
          }
          const client = new LocationClient({
            Region: region,
            ...amazonLocationAuthHelper.getLocationClientConfig(),
          });

          // Set up the command to call SearchPlaceIndexForPosition
          const command = new SearchPlaceIndexForPositionCommand(params);
          const data = await client.send(command);

          // Iterate over the results, and convert to Carmen geojson to be returned.
          for (const result of data.Results) {
            const feature = {
              type: "Feature",
              geometry: {
                type: "Point",
                coordinates: result.Place.Geometry.Point,
              },
              place_name: result.Place.Label,
              properties: {
                id: result.Place.PlaceId,
              },
              text: result.Place.Label,
              place_type: ["place"],
              center: result.Place.Geometry.Point,
            };
            features.push(feature);
          }
        } catch (e) {
          console.error(`Failed to reverseGeocode with error: ${e}`);
        }
        return {
          features: features,
        };
    };
    return this.AmazonLocationApi;
  }

  public async createAmazonLocationGetSuggestions() {
    // This will create just Get Suggestions.
    if (this.amazonLocationAuthHelper == null) {
      this.amazonLocationAuthHelper = await withAPIKey(this.apiKey);
    }

    const amazonLocationAuthHelper = this.amazonLocationAuthHelper;
    const placesName = this.placesName;
    const apiKey = this.apiKey;
    const region = this.region;
    this.AmazonLocationApi.getSuggestions = async function (config) {
        const suggestions = [];
        try {
          // Set up parameters for search call
          let params = {};
          params = {
            IndexName: placesName,
            Text: config.query,
            Key: apiKey,
            Language: config.language,
          };

          if (config.countries.length > 0) {
            params = {
              ...params,
              FilterCountries: config.countries.toString().split(','),
            };
          }

          if (config.types.length > 0) {
            params = {
              ...params,
              FilterCategories: config.types.toString().split(','),
            };
          }

          if (config.bbox.length > 0) {
            params = {
              ...params,
              FilterBBox: config.bbox,
            };
          }

          if (config.proximity.longitude != undefined && config.proximity.latitude != undefined) {
            params = {
              ...params,
              BiasPosition: [config.proximity.longitude, config.proximity.latitude]
            }
          }

          const client = new LocationClient({
            Region: region,
            ...amazonLocationAuthHelper.getLocationClientConfig(),
          });

          // Set up a command to call SearchPlaceIndexForSuggestions API
          const command = new SearchPlaceIndexForSuggestionsCommand(params);
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
    return this.AmazonLocationApi;
  }

  public async createAmazonLocationSearchPlaceById() {
    if (this.amazonLocationAuthHelper == null) {
      // If we have not created the AuthHelper object, we will need it before proceeding.
      this.amazonLocationAuthHelper = await withAPIKey(this.apiKey.toString());
    }

    const placesName = this.placesName;
    const apiKey = this.apiKey;
    const region = this.region;
    const amazonLocationAuthHelper = this.amazonLocationAuthHelper;
    this.AmazonLocationApi.searchByPlaceId = async function (config) {
        let feature;
        try {
          // Set up parameters for search call
          const params = {
            IndexName: placesName,
            Text: config.query,
            Key: apiKey,
            Language: config.language,
          }
          const client = new LocationClient({
            Region: region,
            ...amazonLocationAuthHelper.getLocationClientConfig(),
          });

          // Set up command to call GetPlace API with a place Id of a selected suggestion
          const command = new GetPlaceCommand(params);
          const data = await client.send(command);

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
        return {
          place: feature,
        };
    };
    return this.AmazonLocationApi;
  }

  public async createAmazonLocationPlacesSearch() {
    await this.createAmazonLocationForwardGeocodeApi();
    await this.createAmazonLocationReverseGeocodeApi();
    await this.createAmazonLocationGetSuggestions();
    await this.createAmazonLocationSearchPlaceById();
    return this.AmazonLocationApi;
  }

  // Maplibre-gl-geocoder related stuff.
  public createAmazonLocationGeocoder(options?: any): IControl {
    if(this.AmazonLocationApi.forwardGeocode != undefined
    || this.AmazonLocationApi.reverseGeocode != undefined
    || this.AmazonLocationApi.searchByPlaceId != undefined
    || this.AmazonLocationApi.getSuggestions != undefined) {
      this.maplibreGeocoder = new MaplibreGeocoder(this.AmazonLocationApi, {
        maplibregl: maplibregl,
        // showResultMarkers: { element: createDefaultIcon() },
        // marker: { element: createDefaultIcon() },
        // autocomplete temporarily disabled by default until CLI is updated
        showResultsWhileTyping: options?.autocomplete,
        // showResultsWhileTyping: options?.autocomplete === false ? false : true,
        ...options,
      });

      this.updateMaplibreGeocoderCategoryFilter();
      this.updateMaplibreGeocoderCountryFilter();

      // Default bias position is empty mapping to fulfill requirements.
      this.updateMaplibreGeocoderBiasPosition({});
      if (this.biasPosition != null) {
        this.updateMaplibreGeocoderBiasPosition(this.biasPosition);
      }

      // Default BoundingBox is empty array to fulfill requirements.
      this.updateMaplibreGeocoderBoundingBox([]);
      if (this.filterBBox != null) {
        this.updateMaplibreGeocoderBoundingBox([
          this.filterBBox.longitudeSW,
          this.filterBBox.latitudeSW,
          this.filterBBox.longitudeNE,
          this.filterBBox.latitudeNE,
        ]);
      }
    } else  {
      console.log("Please create AmazonLocationApi before creating the geocoder.");
    }

    return this.maplibreGeocoder;
  }

  // Filtering Logic.
  public addCategoryFilters(filters: CategoriesEnum[]): CategoriesEnum[] {
    if (filters.length <= MAX_CATEGORY_FILTERS) {
      this.filterCategories = filters;
      this.updateMaplibreGeocoderCategoryFilter();
    } else {
      console.log(
        `Number of categories ${filters.length} exceeds max number of ${MAX_CATEGORY_FILTERS} at a time. No change to filter selection.`,
      );
    }
    return this.filterCategories;
  }

  public addCategoryFilter(category: CategoriesEnum): CategoriesEnum[] {
    if (this.filterCategories.length < MAX_CATEGORY_FILTERS) {
      this.filterCategories.push(category);
      this.updateMaplibreGeocoderCategoryFilter();
    } else {
      console.log(
        `Number of categories is already at max filters of ${MAX_CATEGORY_FILTERS}. No change to filter selection. Remove a category before adding another.`,
      );
    }
    return this.filterCategories;
  }

  public clearCategoryFilters(): void {
    this.filterCategories = [];
    this.updateMaplibreGeocoderCategoryFilter();
  }

  public getCategoryFilter() {
    if (this.maplibreGeocoder != null) {
      return this.maplibreGeocoder.getTypes();
    }
    return this.filterCategories;
  }

  private updateMaplibreGeocoderCategoryFilter() {
    if (this.maplibreGeocoder != null) {
      this.maplibreGeocoder.setTypes(this.filterCategories.join(","));
    }
  }

  public addCountryFilters(filters: CountriesEnum[]): CountriesEnum[] {
    if (filters.length <= MAX_COUNTRY_FILTERS) {
      this.filterCountries = filters;
      this.updateMaplibreGeocoderCountryFilter();
    } else {
      console.log(
        `Number of categories ${filters.length} exceeds max number of ${MAX_COUNTRY_FILTERS} at a time. No change to filter selection.`,
      );
    }
    return this.filterCountries;
  }

  public addCountryFilter(country: CountriesEnum): CountriesEnum[] {
    if (this.filterCountries.length < MAX_COUNTRY_FILTERS) {
      this.filterCountries.push(country);
      this.updateMaplibreGeocoderCountryFilter();
    } else {
      console.log(
        `Number of countries is already at max filters of ${MAX_COUNTRY_FILTERS}. No change to filter selection. Remove a country before adding another.`,
      );
    }
    return this.filterCountries;
  }

  public clearCountryFilter(): void {
    this.filterCountries = [];
    this.updateMaplibreGeocoderCountryFilter();
  }

  public getCountryFilter() {
    if (this.maplibreGeocoder != null) {
      return this.maplibreGeocoder.getCountries();
    }
    return this.filterCountries;
  }

  private updateMaplibreGeocoderCountryFilter() {
    if (this.maplibreGeocoder != null) {
      this.maplibreGeocoder.setCountries(this.filterCountries.join(","));
    }
  }

  // You cannot have a bias and a BBox in the same call, this will remove the bias and add the bbox.
  public setBoundingBox(boundingBox: BoundingBox): void {
    this.biasPosition = null;
    this.filterBBox = boundingBox;
    this.updateMaplibreGeocoderBoundingBox([this.filterBBox.longitudeSW,
      this.filterBBox.latitudeSW,
      this.filterBBox.longitudeNE,
      this.filterBBox.latitudeNE,]);
  }

  public clearBoundingBox(): void {
    this.filterBBox = null;
    this.updateMaplibreGeocoderBoundingBox([]);
  }

  public getBoundingBox() {
    if (this.maplibreGeocoder != null) {
      return this.maplibreGeocoder.getBbox();
    }
    return this.filterBBox;
  }

  private updateMaplibreGeocoderBoundingBox(BBox : number[]) {
    if (this.maplibreGeocoder != null) {
      this.maplibreGeocoder.setBbox(BBox);
      this.maplibreGeocoder.setProximity({}); // clears the proximity since we can only use one.
    }
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

  public getBiasPosition() {
    if (this.maplibreGeocoder != null) {
      return this.maplibreGeocoder.getProximity();
    }
    return this.biasPosition;
  }

  private updateMaplibreGeocoderBiasPosition(position) {
    if (this.maplibreGeocoder != null) {
      this.maplibreGeocoder.setProximity(position);
      this.maplibreGeocoder.setBbox([]); // clears Bbox since we can only have one or the other.
    }
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
