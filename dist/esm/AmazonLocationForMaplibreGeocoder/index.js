import { withAPIKey } from '@aws/amazon-location-utilities-auth-helper';
import { amazonLocationClient } from '@aws/amazon-location-client';
import { MAX_CATEGORY_FILTERS, MAX_COUNTRY_FILTERS } from "../common/constants";
export class AmazonLocationMaplibreGeocoder {
    constructor(credentials) {
        // This is the AmazonLocationAuthHelper which is used for Authenticating the User.
        this.amazonLocationAuthHelper = null;
        // These Manage the State of the Geocoder, which is used
        this.filterCountries = [];
        this.filterCategories = [];
        this.filterBBox = null;
        this.biasPosition = null;
        this.language = 'en';
        this.center = [-77.03674, 38.891602];
        // This is the stateful API that currently exist
        this.AmazonLocationApi = {};
        this.mapName = credentials.mapName;
        this.placesName = credentials.placesName;
        this.region = credentials.region;
        this.apiKey = credentials.apiKey;
    }
    async createAmazonLocationForwardGeocodeApi() {
        if (this.amazonLocationAuthHelper == null) {
            // We need to create the AuthHelper/Location Clients.
            this.amazonLocationAuthHelper = await withAPIKey(this.apiKey.toString());
        }
        this.AmazonLocationApi = Object.assign({ forwardGeocode: async (config) => {
                const features = [];
                try {
                    // Set up parameters for search call.
                    let params = {};
                    params = {
                        IndexName: this.placesName,
                        Text: config.query,
                        Language: this.language,
                        Key: this.apiKey,
                    };
                    // need a way to determine if we need to add in the additional filters or not..
                    if (this.filterCountries.length > 0) {
                        params = Object.assign({ FilterCountries: this.filterCountries }, params);
                    }
                    if (this.filterCategories.length > 0) {
                        params = Object.assign({ FilterCategories: this.filterCategories }, params);
                    }
                    if (this.filterBBox != null) {
                        params = Object.assign({ FilterBBox: [this.filterBBox.longitudeSW,
                                this.filterBBox.latitudeSW,
                                this.filterBBox.longitudeNE,
                                this.filterBBox.latitudeNE] }, params);
                    }
                    if (this.biasPosition != null) {
                        params = Object.assign({ BiasPosition: [this.biasPosition.longitude, this.biasPosition.latitude] }, params);
                    }
                    const client = new amazonLocationClient.LocationClient(Object.assign({ Region: this.region }, this.amazonLocationAuthHelper.getLocationClientConfig()));
                    // Set up command to call SearchPlaceIndexForText API
                    const command = new amazonLocationClient.SearchPlaceIndexForTextCommand(params);
                    const data = await client.send(command);
                    // Convert the results to Carmen geojson to be returned to the MapLibre Geocoder
                    for (let result of data.Results) {
                        let feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: result.Place.Geometry.Point
                            },
                            place_name: result.Place.Label,
                            properties: {
                                id: result.Place.PlaceId
                            },
                            text: result.Place.Label,
                            place_type: ['place'],
                            center: result.Place.Geometry.Point
                        };
                        features.push(feature);
                    }
                }
                catch (e) {
                    console.error(`Failed to forwardGeocode with error: ${e}`);
                }
                return {
                    features: features
                };
            } }, this.AmazonLocationApi);
        return this.AmazonLocationApi;
    }
    async createAmazonLocationReverseGeocodeApi() {
        // This will create just the Reverse Geocode Logic.
        if (this.amazonLocationAuthHelper == null) {
            this.amazonLocationAuthHelper = await withAPIKey(this.apiKey);
        }
        this.AmazonLocationApi = {
            reverseGeocode: async (config) => {
                const features = [];
                try {
                    let params = {
                        IndexName: this.placesName,
                        Key: this.apiKey,
                        Position: config.query,
                        Language: this.language
                    };
                    const client = new amazonLocationClient.LocationClient(Object.assign({ Region: this.region }, this.amazonLocationAuthHelper.getLocationClientConfig()));
                    // Set up the command to call SearchPlaceIndexForPosition
                    const command = new amazonLocationClient.SearchPlaceIndexForPositionCommand(params);
                    const data = await client.send(command);
                    // Iterate over the results, and convert to Carmen geojson to be returned.
                    for (let result of data.Results) {
                        let feature = {
                            type: 'Feature',
                            geometry: {
                                type: 'Point',
                                coordinates: result.Place.Geometry.Point
                            },
                            place_name: result.Place.Label,
                            properties: {
                                id: result.Place.PlaceId
                            },
                            text: result.Place.Label,
                            place_type: ['place'],
                            center: result.Place.Geometry.Point
                        };
                        features.push(feature);
                    }
                }
                catch (e) {
                    console.error(`Failed to reverseGeocode with error: ${e}`);
                }
                return {
                    features: features
                };
            }
        };
    }
    async createAmazonLocationGetSuggestions() {
        // This will create just Get Suggestions.
        if (this.amazonLocationAuthHelper == null) {
            this.amazonLocationAuthHelper = await withAPIKey(this.apiKey);
        }
        this.AmazonLocationApi = Object.assign({ getSuggestions: async (config) => {
                const suggestions = [];
                try {
                    // Set up parameters for search call
                    let params = {};
                    params = {
                        IndexName: this.placesName,
                        PlaceId: config.query,
                        Key: this.apiKey,
                        Language: this.language
                    };
                    if (this.filterCountries.length > 0) {
                        params = Object.assign({ FilterCountries: this.filterCountries }, params);
                    }
                    if (this.filterCategories.length != 0) {
                        params = Object.assign({ FilterCategories: this.filterCategories }, params);
                    }
                    if (this.filterBBox != null) {
                        params = Object.assign({ FilterBBox: [this.filterBBox.longitudeSW,
                                this.filterBBox.latitudeSW,
                                this.filterBBox.longitudeNE,
                                this.filterBBox.latitudeNE] }, params);
                    }
                    if (this.biasPosition != null) {
                        params = Object.assign({ BiasPosition: [this.biasPosition.longitude, this.biasPosition.latitude] }, params);
                    }
                    console.log("Here is the params: ", params);
                    const client = new amazonLocationClient.LocationClient(Object.assign({ Region: this.region }, this.amazonLocationAuthHelper.getLocationClientConfig()));
                    // Set up a command to call SearchPlaceIndexForSuggestions API
                    const command = new amazonLocationClient.SearchPlaceIndexForSuggestionsCommand(params);
                    const data = await client.send(command);
                    // Iterate over data.Results and return all suggestions and their place ids
                    for (let result of data.Results) {
                        let suggestionWithPlace = {
                            text: result.Text,
                            placeId: result.PlaceId
                        };
                        suggestions.push(suggestionWithPlace);
                    }
                }
                catch (e) {
                    console.error(`Failed to getSuggestions with error: ${e}`);
                }
                return {
                    suggestions: suggestions
                };
            } }, this.AmazonLocationApi);
        return this.AmazonLocationApi;
    }
    async createAmazonLocationSearchPlaceById() {
        if (this.amazonLocationAuthHelper == null) {
            // If we have not created the AuthHelper object, we will need it before proceeding.
            this.amazonLocationAuthHelper = await withAPIKey(this.apiKey.toString());
        }
        this.AmazonLocationApi = Object.assign({ searchByPlaceId: async (config) => {
                var feature;
                try {
                    // Set up parameters for search call
                    let params = {};
                    params = {
                        IndexName: this.placesName,
                        PlaceId: config.query,
                        Key: this.apiKey,
                        Language: this.language
                    };
                    const client = new amazonLocationClient.LocationClient(Object.assign({ region: this.region }, this.amazonLocationAuthHelper.getLocationClientConfig()));
                    // Set up command to call GetPlace API with a place Id of a selected suggestion
                    const command = new amazonLocationClient.GetPlaceCommand(params);
                    const data = await client.send(command);
                    feature = {
                        type: 'Feature',
                        geometry: {
                            type: 'Point',
                            coordinates: data.Place.Geometry.Point
                        },
                        place_name: data.Place.Label,
                        text: data.Place.Label,
                        center: data.Place.Geometry.Point
                    };
                }
                catch (e) {
                    console.error(`Failed to searchByPlaceId with error: ${e}`);
                }
                return {
                    place: feature
                };
            } }, this.AmazonLocationApi);
        return this.AmazonLocationApi;
    }
    async createAmazonLocationPlacesSearch() {
        await this.createAmazonLocationForwardGeocodeApi();
        await this.createAmazonLocationReverseGeocodeApi();
        await this.createAmazonLocationGetSuggestions();
        await this.createAmazonLocationSearchPlaceById();
        return this.AmazonLocationApi;
    }
    // Parameter logic.
    getParameters(config) {
        let params = {
            IndexName: this.placesName,
            Text: config.query,
            Key: this.apiKey,
            Language: this.language
        };
        return params;
    }
    getFilteredParameters(config) {
        let params = {};
        params = Object.assign({}, this.getParameters(config));
        if (this.filterCountries.length > 0) {
            params = Object.assign({ FilterCountries: this.filterCountries }, params);
        }
        if (this.filterCategories.length != 0) {
            params = Object.assign({ FilterCategories: this.filterCategories }, params);
        }
        if (this.filterBBox != null) {
            params = Object.assign({ FilterBBox: [this.filterBBox.longitudeSW,
                    this.filterBBox.latitudeSW,
                    this.filterBBox.longitudeNE,
                    this.filterBBox.latitudeNE] }, params);
        }
        if (this.biasPosition != null) {
            params = Object.assign({ BiasPosition: [this.biasPosition.longitude, this.biasPosition.latitude] }, params);
        }
    }
    // Filtering Logic.
    addCategoryFilters(filters) {
        if (filters.length <= MAX_CATEGORY_FILTERS) {
            this.filterCategories = filters;
        }
        else {
            console.log(`Number of categories ${filters.length} exceeds max number of 5 at a time. No change to filter selection.`);
        }
        return this.filterCategories;
    }
    addCategoryFilter(category) {
        if (this.filterCategories.length < MAX_COUNTRY_FILTERS) {
            this.filterCategories.push(category);
        }
        else {
            console.log(`Number of categories is already at max filters of 5. No change to filter selection. Remove a category before adding another.`);
        }
        return this.filterCategories;
    }
    clearCategoryFilters() {
        this.filterCategories = [];
    }
    addCountryFilters(filters) {
        if (filters.length <= MAX_COUNTRY_FILTERS) {
            this.filterCountries = filters;
        }
        else {
            console.log(`Number of categories ${filters.length} exceeds max number of 50 at a time. No change to filter selection.`);
        }
        return this.filterCountries;
    }
    addCountryFilter(country) {
        if (this.filterCountries.length < MAX_COUNTRY_FILTERS) {
            this.filterCountries.push(country);
        }
        else {
            console.log(`Number of countries is already at max filters of 50. No change to filter selection. Remove a country before adding another.`);
        }
        return this.filterCountries;
    }
    clearCountryFilter() {
        this.filterCountries = [];
    }
    // You cannot have a bias and a BBox in the same call, this will remove the bias and add the bbox.
    setBoundingBox(boundingBox) {
        this.biasPosition = null;
        this.filterBBox = boundingBox;
    }
    clearBoundingBox() {
        this.filterBBox = null;
    }
    setBiasPosition(position) {
        this.filterBBox = null;
        this.biasPosition = position;
    }
    clearBiasPosition() {
        this.biasPosition = null;
    }
    // This function will clear all filters at once.
    clearFilters() {
        this.filterCategories = [];
        this.filterCountries = [];
        this.filterBBox = null;
        this.biasPosition = null;
    }
}
