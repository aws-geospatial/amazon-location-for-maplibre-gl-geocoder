import {
  GetPlaceCommand,
  LocationClient,
  SearchPlaceIndexForPositionCommand,
  SearchPlaceIndexForSuggestionsCommand,
  SearchPlaceIndexForTextCommand,
} from "@aws-sdk/client-location";
import { withAPIKey, withIdentityPoolId } from "@aws/amazon-location-utilities-auth-helper";
import MaplibreGeocoder from "@maplibre/maplibre-gl-geocoder";
import { AmazonLocationMaplibreGeocoder, buildAmazonLocationMaplibreGeocoder } from "./index";
import { BoundingBox, CategoriesEnum, CountriesEnum, Position } from "../common/types";
import {
  ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE,
  MAX_CATEGORY_FILTERS,
  MAX_COUNTRY_FILTERS,
} from "../common/constants";

export interface AmazonLocationMaplibreGeocoderParams {
  mapName: string;
  placesName: string;
  region: string;
  apiKey?: string;
  identityPoolId?: string;
}

jest.spyOn(console, "warn").mockImplementation(() => {});
jest.spyOn(console, "error").mockImplementation(() => {});

jest.mock("@aws-sdk/client-location");
jest.mock("@aws/amazon-location-utilities-auth-helper");
jest.mock("@maplibre/maplibre-gl-geocoder");

describe("Creates APIs for Maplibre Geocoder using Amazon Location APIs", () => {
  const PLACES_NAME = "places.name";
  const TEST_ERROR_MESSAGE = "This is a test error.";

  let clientMock;
  beforeEach(() => {
    clientMock = new LocationClient();
    (SearchPlaceIndexForTextCommand as jest.Mock).mockClear();
    (SearchPlaceIndexForPositionCommand as jest.Mock).mockClear();
    (SearchPlaceIndexForSuggestionsCommand as jest.Mock).mockClear();
    (GetPlaceCommand as jest.Mock).mockClear();

    (withAPIKey as jest.Mock).mockReturnValueOnce({
      getLocationClientConfig: () => {
        return {
          signer: { someSigner: "signer" },
          credentials: { someCredentials: "credentials" },
        };
      },
    });

    (withIdentityPoolId as jest.Mock).mockReturnValueOnce({
      getLocationClientConfig: () => {
        return {
          signer: { someSigner: "signer" },
          credentials: { someCredentials: "credentials" },
        };
      },
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it("AmazonLocationMaplibreGeocoder should throw error if you try to initialized it without passing in api's", () => {
    try {
      new AmazonLocationMaplibreGeocoder({});
    } catch (e) {
      expect(e.message).toStrictEqual(ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE);
    }
  });

  it("apiGeocoder should be able to create an instance GIVEN valid config", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME);
    expect(geocoder).toBeDefined();
  });

  it.each([
    [undefined, undefined, undefined, undefined],
    [CategoriesEnum.CoffeeShop, CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`],
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
    [undefined, undefined, undefined, undefined],
    [CategoriesEnum.CoffeeShop, CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`],
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
  ])(
    "forwardGeocode returns some values in the expected format WHEN given credentials.",
    async (categories, countries, bbox, biasPosition) => {
      const config = {
        query: "a map query",
        language: "en",
        types: categories ? categories : "",
        countries: countries ? countries : "",
        proximity: biasPosition ? biasPosition : {},
        bbox: bbox ? bbox : [],
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME);
      jest.spyOn(LocationClient.prototype, "send").mockReturnValue({
        Results: [
          {
            Place: {
              AddressNumber: "1800",
              Country: "USA",
              Geometry: {
                Point: [-123, 45],
              },
              Label: "A fake place",
              PostalCode: "12345",
              Street: "1st Street",
              Type: "Feature",
              PlaceId: "Small Ville",
            },
          },
        ],
      });

      const response = await geocoder.amazonLocationApi.forwardGeocode(config);

      expect(clientMock.send).toHaveBeenCalled();
      expect(response.features).toHaveLength(1);
      expect(response.features[0].geometry.coordinates[0]).toEqual(-123);
    },
  );

  it("forwardGeocode throws error WHEN error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      types: "",
      countries: "",
      proximity: {},
      bbox: [],
    };
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME);
    jest.spyOn(LocationClient.prototype, "send").mockImplementation(() => {
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
      language: "en",
      types: "",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, { enableReverseGeocode: true });

    jest.spyOn(LocationClient.prototype, "send").mockReturnValue({
      Results: [
        {
          Place: {
            AddressNumber: "1800",
            Country: "USA",
            Geometry: {
              Point: [-123, 45],
            },
            Label: "A fake place",
            PostalCode: "12345",
            Street: "1st Street",
            Type: "Feature",
          },
          PlaceId: "Small Ville",
        },
      ],
    });

    const response = await geocoder.amazonLocationApi.reverseGeocode(config);

    expect(clientMock.send).toHaveBeenCalled();
    expect(response.features).toHaveLength(1);
    expect(response.features[0].place_name).toEqual("A fake place");
  });

  it("reverseGeocode throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      types: "",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, { enableReverseGeocode: true });

    jest.spyOn(LocationClient.prototype, "send").mockImplementation(() => {
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
    [undefined, undefined, undefined, undefined],
    [CategoriesEnum.CoffeeShop, CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`],
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
    [undefined, undefined, undefined, undefined],
    [CategoriesEnum.CoffeeShop, CountriesEnum["United States"], [0, 0, 0, 0], undefined],
    [
      [`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`],
      [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`],
      undefined,
      {
        longitude: 0,
        latitude: 0,
      },
    ],
  ])(
    "getSuggestions API MUST respond with expected payload WHEN given valid credentials.",
    async (categories, countries, bbox, biasPosition) => {
      const config = {
        query: "a map query",
        language: "en",
        types: categories ? categories : "",
        countries: countries ? countries : "",
        proximity: biasPosition ? biasPosition : {},
        bbox: bbox ? bbox : [],
      };

      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
        enableGetSuggestions: true,
      });

      jest.spyOn(LocationClient.prototype, "send").mockReturnValue({
        Results: [
          {
            Text: "Cool Suggested Location",
            PlaceId: "AUS 16",
          },
        ],
      });

      const response = await geocoder.amazonLocationApi.getSuggestions(config);

      expect(clientMock.send).toHaveBeenCalled();
      expect(response.suggestions).toBeDefined();
      expect(response.suggestions[0].placeId).toEqual("AUS 16");
    },
  );

  it("getSuggestions throws error when error is encountered", async () => {
    const config = {
      query: "a map query",
      language: "en",
      types: "",
      countries: "",
      proximity: {},
      bbox: [],
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      enableGetSuggestions: true,
    });
    jest.spyOn(LocationClient.prototype, "send").mockImplementation(() => {
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
      query: "A_PLACE_ID",
      language: "en",
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      enableSearchByPlaceId: true,
    });
    jest.spyOn(LocationClient.prototype, "send").mockReturnValue({
      Place: {
        AddressNumber: "123 Small Town",
        Categories: ["Test"],
        Country: "USA",
        Geometry: {
          Point: [123, 456],
        },
        Label: "Small Town",
      },
    });

    const response = await geocoder.amazonLocationApi.searchByPlaceId(config);

    expect(response.place.place_name).toEqual("Small Town");
    expect(response.place.geometry.coordinates).toEqual([123, 456]);
    expect(response.place.properties.PlaceId).toStrictEqual("A_PLACE_ID");
  });

  it("searchByPlaceId throws error when error is encountered", async () => {
    const config = {
      query: "A_PLACE_ID",
      language: "en",
    };

    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      enableSearchByPlaceId: true,
    });

    jest.spyOn(LocationClient.prototype, "send").mockImplementation(() => {
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
    [undefined, undefined, undefined, undefined],
    [
      [CategoriesEnum.CoffeeShop],
      [CountriesEnum["United States"]],
      {
        longitudeSW: 0,
        latitudeSW: 0,
        longitudeNE: 0,
        latitudeNE: 0,
      },
      undefined,
    ],
    [[CategoriesEnum.CoffeeShop], [CountriesEnum["United States"]], undefined, [0, 0]],
    [undefined, undefined, undefined, undefined],
    [
      [CategoriesEnum.CoffeeShop],
      [CountriesEnum["United States"]],
      {
        longitudeSW: 0,
        latitudeSW: 0,
        longitudeNE: 0,
        latitudeNE: 0,
      },
      undefined,
    ],
    [[CategoriesEnum.CoffeeShop], [CountriesEnum["United States"]], undefined, [0, 0]],
  ])(
    "I expect that I can get an IControl, MaplibreGeocoder WHEN I call createAmazonLocationGeocoder and WHEN I provide valid credentials.",
    async (categories, countries, bbox, biasPosition) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
        enableAll: true,
      });

      if (categories) {
        geocoder.setCategoryFilter(categories);
      }
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

  it("We expect the creation of the AmazonLocationMaplibreGeocoder to fail if no APIs have been created.", () => {
    try {
      new AmazonLocationMaplibreGeocoder({});
    } catch (e) {
      expect(e.message).toEqual(ATTEMPTING_TO_MANUALLY_CREATE_ERROR_MESSAGE);
    }
  });

  it.each([
    [[CategoriesEnum.CoffeeShop], [CategoriesEnum.CoffeeShop]],
    [
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
    ],
    [
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
    ],
    [Object.values(CategoriesEnum), []],
    [[CategoriesEnum.CoffeeShop], [CategoriesEnum.CoffeeShop]],
    [
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
    ],
    [
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
    ],
    [Object.values(CategoriesEnum), []],
  ])(
    "AmazonLocationMaplibreGeocoder should be able to add Category filters WHEN the number of filters is less than the max number of filters.",
    (filters: CategoriesEnum[], expected: CategoriesEnum[]) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
        enableAll: true,
      });
      if (filters.length < MAX_CATEGORY_FILTERS) {
        expect(geocoder.setCategoryFilter(filters)).toStrictEqual(true);
      } else {
        expect(geocoder.setCategoryFilter(filters)).toStrictEqual(false);
      }
      expect(geocoder.getCategoryFilter()).toStrictEqual(expected);
    },
  );

  it.each([
    [[CategoriesEnum.CoffeeShop], [CategoriesEnum.CoffeeShop]],
    [
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
      [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop],
    ],
    [
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
      [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction],
    ],
    [Object.values(CategoriesEnum), Object.values(CategoriesEnum).slice(0, MAX_CATEGORY_FILTERS)],
  ])(
    "AmazonLocationMaplibreGeocoder should be able to add Category filters individually until there are too many.",
    async (filters: CategoriesEnum[], expected: CategoriesEnum[]) => {
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
        enableAll: true,
      });
      let count = 0;
      filters.forEach((filter) => {
        if (count < MAX_CATEGORY_FILTERS) {
          expect(geocoder.addCategoryFilter(filter)).toEqual(true);
        } else {
          expect(geocoder.addCategoryFilter(filter)).toEqual(false);
        }
        count = count + 1;
      });
      expect(geocoder.getCategoryFilter()).toStrictEqual(expected);
    },
  );

  it("AmazonLocationMaplibreGeocoder should be able to clear the category filters after setting filters.", () => {
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      enableAll: true,
    });

    // Add some filters.
    const filter = [CategoriesEnum.CoffeeShop, CategoriesEnum.Bar, CategoriesEnum.Bakery];
    geocoder.setCategoryFilter(filter);
    // Confirm that we have the filter in place.
    expect(geocoder.getCategoryFilter()).toStrictEqual(filter);

    // Now we clear the filter.
    geocoder.clearCategoryFilter();
    // Now we should have empty string return.
    expect(geocoder.getCategoryFilter()).toStrictEqual([]);
  });

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
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
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
      const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
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
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
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
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
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
    const geocoder = buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      enableAll: true,
    });

    // set up filter values.
    const categoryFilters = [CategoriesEnum.CoffeeShop, CategoriesEnum.Bar, CategoriesEnum.Bakery];
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

    geocoder.setCategoryFilter(categoryFilters);
    geocoder.setCountryFilter(countryFilters);
    geocoder.setBoundingBox(bbox);
    expect(geocoder.getCategoryFilter()).toStrictEqual(categoryFilters);
    expect(geocoder.getCountryFilter()).toStrictEqual(countryFilters);
    expect(geocoder.getBoundingBox()).toStrictEqual(bbox);

    // Clear all filters
    geocoder.clearFilters();
    expect(geocoder.getCategoryFilter()).toStrictEqual([]);
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
    buildAmazonLocationMaplibreGeocoder(clientMock, PLACES_NAME, {
      placeholder: "Test Placeholder",
    });

    expect(MaplibreGeocoder).toHaveBeenCalledTimes(1);

    // The options are the second argument to MaplibreGeocoder
    const options = MaplibreGeocoder.mock.calls[0][1];
    expect(options.placeholder).toStrictEqual("Test Placeholder");
  });
});
