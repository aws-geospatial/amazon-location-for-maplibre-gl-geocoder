import {
  GetPlaceCommand,
  GeoPlacesClient,
  SearchTextCommand,
  ReverseGeocodeCommand,
  SuggestCommand,
  AutocompleteCommand,
} from "@aws-sdk/client-geo-places";
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import { buildAmazonLocationMaplibreGeocoder } from "../index";
import { BoundingBox, CountriesEnum, Position } from "../../common/types";
import { MAX_COUNTRY_FILTERS } from "../../common/constants";

export interface AmazonLocationMaplibreGeocoderParams {
  mapName: string;
  placesName: string;
  region: string;
  apiKey?: string;
  identityPoolId?: string;
}

jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

jest.mock("@aws-sdk/client-geo-places");
jest.mock("@maplibre/maplibre-gl-geocoder");

describe("Creates APIs for Maplibre Geocoder using Amazon Location APIs", () => {
  const TEST_ERROR_MESSAGE = "This is a test error.";

  // @ts-expect-error Allow override of the mocked GeoPlacesClient.config so we can set the proper serviceId
  GeoPlacesClient.prototype.config = {
    serviceId: "Geo Places",
  };

  let clientMock: GeoPlacesClient;
  beforeEach(() => {
    clientMock = new GeoPlacesClient();
    (SuggestCommand as jest.Mock).mockClear();
    (SearchTextCommand as jest.Mock).mockClear();
    (ReverseGeocodeCommand as jest.Mock).mockClear();
    (GetPlaceCommand as jest.Mock).mockClear();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("apiGeocoder should be able to create an instance GIVEN valid config", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock);
    expect(geocoder).toBeDefined();
  });

  it.each([
    [undefined, undefined, undefined],
    [CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
    [undefined, undefined, undefined, undefined],
    [CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
  ])(
    "forwardGeocode returns some values in the expected format WHEN given credentials.",
    async (countries, bbox, biasPosition) => {
      const config = {
        query: "a map query",
        language: "en",
        countries: countries ? countries : "",
        proximity: biasPosition ? biasPosition : {},
        bbox: bbox ? bbox : [],
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock);
      jest.spyOn(GeoPlacesClient.prototype, "send").mockReturnValue({
        ResultItems: [
          {
            PlaceId: "MockPlaceId",
            PlaceType: "PointAddress",
            Title: "123 MockVille USA",
            Address: {
              Label: "123 MockVille USA",
            },
            Position: [-12.3, 12.3],
          },
        ],
      });

      const response = await geocoder.amazonLocationApi.forwardGeocode(config);

      expect(clientMock.send).toHaveBeenCalled();
      expect(response.features).toHaveLength(1);
      expect(response.features[0].geometry.coordinates[0]).toEqual(-12.3);
    },
  );

  it("forwardGeocode throws error WHEN error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock);
    jest.spyOn(GeoPlacesClient.prototype, "send").mockImplementation(() => {
      throw new Error(TEST_ERROR_MESSAGE);
    });

    try {
      await geocoder.amazonLocationApi.forwardGeocode(config);
    } catch (e) {
      expect(e.message).toContain(TEST_ERROR_MESSAGE);
    }
    expect(clientMock.send).toHaveBeenCalled();
  });

  it("reverseGeocode must return valid values WHEN given valid coordinates and WHEN given valid credentials", async () => {
    const config = {
      query: "a map query",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, { enableReverseGeocode: true });

    jest.spyOn(GeoPlacesClient.prototype, "send").mockReturnValue({
      ResultItems: [
        {
          PlaceId: "MockPlaceId",
          PlaceType: "PointAddress",
          Title: "123 MockVille USA",
          Address: {
            Label: "123 MockVille USA",
          },
          Position: [-12.3, 12.3],
        },
      ],
    });

    const response = await geocoder.amazonLocationApi.reverseGeocode(config);

    expect(clientMock.send).toHaveBeenCalled();
    expect(response.features).toHaveLength(1);
    expect(response.features[0].place_name).toEqual("123 MockVille USA");
  });

  it("reverseGeocode throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, { enableReverseGeocode: true });

    jest.spyOn(GeoPlacesClient.prototype, "send").mockImplementation(() => {
      throw new Error(TEST_ERROR_MESSAGE);
    });
    try {
      await geocoder.amazonLocationApi.reverseGeocode(config);
    } catch (e) {
      expect(e.message).toEqual(TEST_ERROR_MESSAGE);
    }
    expect(clientMock.send).toHaveBeenCalled();
  });

  it.each([
    [undefined, undefined, undefined],
    [CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
    [undefined, undefined, undefined, undefined],
    [CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
  ])(
    "getSuggestions API MUST respond with expected payload WHEN given valid credentials.",
    async (countries, bbox, biasPosition) => {
      const config = {
        query: "a map query",
        language: "en",
        countries: countries ? countries : "",
        proximity: biasPosition ? biasPosition : {},
        bbox: bbox ? bbox : [],
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        enableGetSuggestions: true,
      });

      jest.spyOn(GeoPlacesClient.prototype, "send").mockReturnValue({
        ResultItems: [
          {
            Title: "Cool Suggested Location",
            Place: {
              PlaceId: "AUS 16",
            },
          },
        ],
      });

      const response = await geocoder.amazonLocationApi.getSuggestions(config);

      expect(clientMock.send).toHaveBeenCalledWith(expect.any(SuggestCommand));
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions[0].placeId).toEqual("AUS 16");
    },
  );

  it("getSuggestions should send Autocomplete command when omitSuggestionsWithoutPlaceId is true", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableGetSuggestions: true,
      omitSuggestionsWithoutPlaceId: true,
    });
    jest.spyOn(GeoPlacesClient.prototype, "send").mockReturnValue({
      ResultItems: [
        {
          Title: "Cool Suggested Location",
          Address: {
            Label: "123 Cool Place Way",
          },
          PlaceId: "AUS 16",
        },
      ],
    });

    const response = await geocoder.amazonLocationApi.getSuggestions(config);

    expect(clientMock.send).toHaveBeenCalledWith(expect.any(AutocompleteCommand));
    expect(response.suggestions).toBeDefined();
    expect(response.suggestions[0].placeId).toEqual("AUS 16");
    expect(response.suggestions[0].text).toEqual("123 Cool Place Way");
  });

  it("getSuggestions throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableGetSuggestions: true,
    });
    jest.spyOn(GeoPlacesClient.prototype, "send").mockImplementation(() => {
      throw new Error(TEST_ERROR_MESSAGE);
    });

    try {
      await geocoder.amazonLocationApi.getSuggestions(config);
    } catch (e) {
      expect(e.message).toEqual(TEST_ERROR_MESSAGE);
    }
    expect(clientMock.send).toHaveBeenCalled();
  });

  it("getSuggestions with AutocompleteCommand throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableGetSuggestions: true,
      omitSuggestionsWithoutPlaceId: true,
    });
    jest.spyOn(GeoPlacesClient.prototype, "send").mockImplementation(() => {
      throw new Error(TEST_ERROR_MESSAGE);
    });

    try {
      await geocoder.amazonLocationApi.getSuggestions(config);
    } catch (e) {
      expect(e.message).toEqual(TEST_ERROR_MESSAGE);
    }
    expect(clientMock.send).toHaveBeenCalled();
  });

  it("searchByPlaceId should return data in expected format WHEN given valid credentials.", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableSearchByPlaceId: true,
    });
    jest.spyOn(GeoPlacesClient.prototype, "send").mockReturnValue({
      PlaceId: "MockPlaceId",
      PlaceType: "PointAddress",
      Position: [123, 456],
      Title: "123 MockVille USA",
    });

    const response = await geocoder.amazonLocationApi.searchByPlaceId(config);

    expect(response.place.place_name).toEqual("123 MockVille USA");
    expect(response.place.geometry.coordinates).toEqual([123, 456]);
  });

  it("searchByPlaceId throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableSearchByPlaceId: true,
    });

    jest.spyOn(GeoPlacesClient.prototype, "send").mockImplementation(() => {
      throw new Error(TEST_ERROR_MESSAGE);
    });

    try {
      await geocoder.amazonLocationApi.searchByPlaceId(config);
    } catch (e) {
      expect(e.message).toEqual(TEST_ERROR_MESSAGE);
    }
    expect(clientMock.send).toHaveBeenCalled();
  });

  it.each([
    [undefined, undefined, undefined],
    [
      [CountriesEnum["United States"]],
      {
        longitudeSW: 0,
        latitudeSW: 0,
        longitudeNE: 0,
        latitudeNE: 0,
      },
      undefined,
    ],
    [[CountriesEnum["United States"]], undefined, [0, 0]],
    [undefined, undefined, undefined, undefined],
    [
      [CountriesEnum["United States"]],
      {
        longitudeSW: 0,
        latitudeSW: 0,
        longitudeNE: 0,
        latitudeNE: 0,
      },
      undefined,
    ],
    [[CountriesEnum["United States"]], undefined, [0, 0]],
  ])(
    "I expect that I can get an IControl, MaplibreGeocoder WHEN I call createAmazonLocationGeocoder and WHEN I provide valid credentials.",
    async (countries, bbox, biasPosition) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        enableAll: true,
      });

      if (countries) {
        geocoder.setCountryFilter(countries);
      }
      if (bbox) {
        geocoder.setBoundingBox(bbox);
      }
      if (biasPosition) {
        geocoder.setBiasPosition(biasPosition);
      }

      const maplibreGeocoder = geocoder.getPlacesGeocoder();

      expect(maplibreGeocoder).toBeDefined();
    },
  );

  it.each([
    [
      [CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada],
      ["MEX", "USA", "CAN"],
    ],
    [Object.values(CountriesEnum), []],
    [
      [CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada],
      ["MEX", "USA", "CAN"],
    ],
    [Object.values(CountriesEnum), []],
  ])(
    "AmazonLocationMaplibreGeocoder should be able to add Country filters WHEN the number of filters is less than the max number of filters.",
    (filters: CountriesEnum[], expected: CountriesEnum[]) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        enableAll: true,
      });
      if (filters.length < MAX_COUNTRY_FILTERS) {
        expect(geocoder.setCountryFilter(filters)).toStrictEqual(true);
      } else {
        expect(geocoder.setCountryFilter(filters)).toStrictEqual(false);
      }
      expect(geocoder.getCountryFilter()).toStrictEqual(expected);
    },
  );

  it.each([
    [
      [CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada],
      ["MEX", "USA", "CAN"],
    ],
    [Object.values(CountriesEnum), Object.values(CountriesEnum).slice(0, MAX_COUNTRY_FILTERS)],
    [
      [CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada],
      ["MEX", "USA", "CAN"],
    ],
    [Object.values(CountriesEnum), Object.values(CountriesEnum).slice(0, MAX_COUNTRY_FILTERS)],
  ])(
    "AmazonLocationMaplibreGeocoder should be able to add Country filters one at a time WHILE the number of filters is less than the max number of filters.",
    (filters: CountriesEnum[], expected: CountriesEnum[]) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
        enableAll: true,
      });

      let count = 0;
      filters.forEach((filter) => {
        if (count < MAX_COUNTRY_FILTERS) {
          expect(geocoder.addCountryFilter(filter)).toEqual(true);
        } else {
          expect(geocoder.addCountryFilter(filter)).toEqual(false);
        }
        count = count + 1;
      });
      expect(geocoder.getCountryFilter()).toStrictEqual(expected);
    },
  );

  it("AmazonLocationMaplibreGeocoder should be able to clear the country filters after setting filters.", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableAll: true,
    });

    // Add some filters.
    const filter = [CountriesEnum["United States"], CountriesEnum.Mexico, CountriesEnum.Canada];
    geocoder.setCountryFilter(filter);
    // Confirm that we have the filter in place.
    expect(geocoder.getCountryFilter()).toStrictEqual(filter);

    // Now we clear the filter.
    geocoder.clearCountryFilter();
    // Now we should have empty string return.
    expect(geocoder.getCountryFilter()).toStrictEqual([]);
  });

  it("bias position and bounding box MUST be exclusive.", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableAll: true,
    });

    // Set up the bbox values and biasPosition values
    const bbox: BoundingBox = {
      longitudeSW: 0,
      latitudeSW: 0,
      longitudeNE: 0,
      latitudeNE: 0,
    };

    const biasPosition: Position = {
      longitude: 0,
      latitude: 0,
    };

    // Set bbox
    geocoder.setBoundingBox(bbox);
    expect(geocoder.getBoundingBox()).toStrictEqual(bbox);
    expect(geocoder.getBiasPosition()).toStrictEqual(null);

    // Set bias position
    geocoder.setBiasPosition(biasPosition);
    expect(geocoder.getBiasPosition()).toStrictEqual(biasPosition);
    expect(geocoder.getBoundingBox()).toStrictEqual(null);

    // Set bbox again
    geocoder.setBoundingBox(bbox);
    expect(geocoder.getBoundingBox()).toStrictEqual(bbox);
    expect(geocoder.getBiasPosition()).toStrictEqual(null);

    // clear bbox
    geocoder.clearBoundingBox();
    expect(geocoder.getBoundingBox()).toStrictEqual(null);
    expect(geocoder.getBiasPosition()).toStrictEqual(null);

    // set bias position again
    geocoder.setBiasPosition(biasPosition);
    expect(geocoder.getBiasPosition()).toStrictEqual(biasPosition);
    expect(geocoder.getBoundingBox()).toStrictEqual(null);

    // clear bias position.
    geocoder.clearBiasPosition();
    expect(geocoder.getBoundingBox()).toStrictEqual(null);
    expect(geocoder.getBiasPosition()).toStrictEqual(null);
  });

  it("Clear all filters MUST clear all filters.", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, {
      enableAll: true,
    });

    // set up filter values.
    const countryFilters = [CountriesEnum["United States"], CountriesEnum.Mexico, CountriesEnum.Canada];
    const bbox: BoundingBox = {
      longitudeSW: 0,
      latitudeSW: 0,
      longitudeNE: 0,
      latitudeNE: 0,
    };

    const biasPosition: Position = {
      longitude: 0,
      latitude: 0,
    };

    geocoder.setCountryFilter(countryFilters);
    geocoder.setBoundingBox(bbox);
    expect(geocoder.getCountryFilter()).toStrictEqual(countryFilters);
    expect(geocoder.getBoundingBox()).toStrictEqual(bbox);

    // Clear all filters
    geocoder.clearFilters();
    expect(geocoder.getCountryFilter()).toStrictEqual([]);
    expect(geocoder.getBoundingBox()).toStrictEqual(null);

    // Just bias position
    geocoder.setBiasPosition(biasPosition);
    expect(geocoder.getBiasPosition()).toStrictEqual(biasPosition);

    // Clear all filters
    geocoder.clearFilters();
    expect(geocoder.getBiasPosition()).toStrictEqual(null);
  });

  it("placeholder should be passed to MaplibreGeocoder when specified.", async () => {
    buildAmazonLocationMaplibreGeocoder(clientMock, {
      placeholder: "Test Placeholder",
    });

    expect(MaplibreGeocoder).toHaveBeenCalledTimes(1);

    // The options are the second argument to MaplibreGeocoder
    const options = MaplibreGeocoder.mock.calls[0][1];
    expect(options.placeholder).toStrictEqual("Test Placeholder");
  });
});
