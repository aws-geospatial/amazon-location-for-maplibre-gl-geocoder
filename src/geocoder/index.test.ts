import { buildAmazonLocationMaplibreGeocoder } from "./index";
import { LocationClient } from "@aws-sdk/client-location";
import { GeoPlacesClient } from "@aws-sdk/client-geo-places";

// Spy on console.warn so we can verify it gets called in warning cases
jest.spyOn(console, "warn").mockImplementation(() => {});

describe("AmazonLocationMaplibreGeocoder Index Tests", () => {
  const PLACES_NAME = "places.name";
  let clientMock: LocationClient;
  let geoPlacesClientMock: GeoPlacesClient;

  beforeEach(() => {
    clientMock = new LocationClient({});
    geoPlacesClientMock = new GeoPlacesClient({});
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe("Options Initialization", () => {
    it("should initialize with default options", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
      });

      expect(geocoder).toBeDefined();
      expect(console.warn).toHaveBeenCalledTimes(1);
      // Verify default options are set
      expect(geocoder.getPlacesGeocoder().options.reverseGeocode).toBe(true);
    });

    it("should initialize with custom options", () => {
      const options = {
        placesIndex: PLACES_NAME,
        flyTo: {
          speed: 1.2,
          zoom: 14,
        },
        placeholder: "Search places...",
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, options);
      const geocoderOptions = geocoder.getPlacesGeocoder().options;

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(geocoderOptions.flyTo.speed).toBe(1.2);
      expect(geocoderOptions.flyTo.zoom).toBe(14);
      expect(geocoderOptions.placeholder).toBe("Search places...");
    });

    it("should initialize with GeoPlaces client with default options", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(geoPlacesClientMock);

      expect(geocoder).toBeDefined();

      // LocationClient warning won't be called since we initialized with a GeoPlacesClient
      expect(console.warn).toHaveBeenCalledTimes(0);

      // Verify default options are set
      expect(geocoder.getPlacesGeocoder().options.reverseGeocode).toBe(true);
    });

    it("should initialize with GeoPlaces client with enableAll", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(geoPlacesClientMock, {
        enableAll: true,
      });

      expect(geocoder).toBeDefined();

      // LocationClient warning won't be called since we initialized with a GeoPlacesClient
      expect(console.warn).toHaveBeenCalledTimes(0);

      // Verify all options are set
      expect(geocoder.getPlacesGeocoder().options.reverseGeocode).toBe(true);
      expect(geocoder.amazonLocationApi.forwardGeocode).toBeDefined();
      expect(geocoder.amazonLocationApi.reverseGeocode).toBeDefined();
      expect(geocoder.amazonLocationApi.getSuggestions).toBeDefined();
      expect(geocoder.amazonLocationApi.searchByPlaceId).toBeDefined();
    });
  });

  // Assert on default values when an option is undefined or omitted :https://maplibre.org/maplibre-gl-geocoder/types/MaplibreGeocoderOptions.html
  describe("Options Validation", () => {
    it("should handle undefined options gracefully", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
        flyTo: undefined,
        proximityMinZoom: undefined,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);

      const geocoderOptions = geocoder.getPlacesGeocoder().options;
      expect(geocoderOptions.flyTo).toBe(true);
      expect(geocoderOptions.proximityMinZoom).toBe(9);
      expect(geocoderOptions.reverseGeocode).toBe(true);
    });

    it("should handle empty options object", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);

      const geocoderOptions = geocoder.getPlacesGeocoder().options;
      expect(geocoderOptions.reverseGeocode).toBe(true);
      expect(geocoderOptions.flyTo).toBe(true);
      expect(geocoderOptions.proximityMinZoom).toBe(9);
    });
  });

  describe("Feature Flag Options", () => {
    it("should enable features based on enableAll flag", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
        enableAll: true,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);

      const geocoderOptions = geocoder.getPlacesGeocoder().options;
      expect(geocoderOptions.showResultsWhileTyping).toBe(true);
    });

    it("should enable specific features individually", () => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
        enableGetSuggestions: true,
        enableSearchByPlaceId: false,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);

      const geocoderOptions = geocoder.getPlacesGeocoder().options;
      expect(geocoderOptions.showResultsWhileTyping).toBe(true);
    });
  });

  describe("MapLibre Specific Options", () => {
    it("should handle maplibre specific options", () => {
      const options = {
        placesIndex: PLACES_NAME,
        zoom: 10,
        trackProximity: true,
        minLength: 3,
        collapsed: true,
        clearAndBlurOnEsc: true,
        clearOnBlur: true,
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, options);
      const geocoderOptions = geocoder.getPlacesGeocoder().options;

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(geocoderOptions.zoom).toBe(10);
      expect(geocoderOptions.trackProximity).toBe(true);
      expect(geocoderOptions.minLength).toBe(3);
      expect(geocoderOptions.collapsed).toBe(true);
      expect(geocoderOptions.clearAndBlurOnEsc).toBe(true);
      expect(geocoderOptions.clearOnBlur).toBe(true);
    });

    it("should handle language and locale options", () => {
      const options = {
        placesIndex: PLACES_NAME,
        language: "fr",
        reverseMode: "distance",
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, options);
      const geocoderOptions = geocoder.getPlacesGeocoder().options;

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(geocoderOptions.language).toBe("fr");
      expect(geocoderOptions.reverseMode).toBe("distance");
    });
  });

  describe("Custom Render Functions", () => {
    it("should use custom render function when provided", () => {
      const customRender = jest.fn();

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
        render: customRender,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(geocoder.getPlacesGeocoder().options.render).toBeDefined();
    });

    it("should use custom popup render function when provided", () => {
      const customPopupRender = jest.fn();

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        placesIndex: PLACES_NAME,
        popupRender: customPopupRender,
      });

      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(geocoder.getPlacesGeocoder().options.popupRender).toBeDefined();
    });
  });
});
