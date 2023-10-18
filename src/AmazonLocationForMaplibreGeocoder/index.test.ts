import {
    GetPlaceCommand,
    LocationClient,
    SearchPlaceIndexForPositionCommand,
    SearchPlaceIndexForSuggestionsCommand,
    SearchPlaceIndexForTextCommand
} from "@aws/amazon-location-client";
import {withAPIKey} from "@aws/amazon-location-utilities-auth-helper";
import {AmazonLocationMaplibreGeocoder} from "./index";
import {BoundingBox, CategoriesEnum, CountriesEnum, Position} from "../common/types";
import {MAX_COUNTRY_FILTERS} from "../common/constants";

jest.mock("@aws/amazon-location-client");
jest.mock("@aws/amazon-location-utilities-auth-helper");

describe("Creates APIs for Maplibre Geocoder using Amazon Location APIs", () => {
  const API_KEY = "api.key";
  const MAP_NAME = "map.name";
  const PLACES_NAME = "places.name";
  const REGION = "us-east-1";

  const TEST_ERROR_MESSAGE = "This is a test error.";

  let clientMock;
  let sdkAuthHelperMock;
  beforeEach(() => {
      clientMock = new LocationClient();
      (SearchPlaceIndexForTextCommand as jest.Mock).mockClear();
      (SearchPlaceIndexForPositionCommand as jest.Mock).mockClear();
      (SearchPlaceIndexForSuggestionsCommand as jest.Mock).mockClear();
      (GetPlaceCommand as jest.Mock).mockClear();

      (withAPIKey as jest.Mock).mockClear();
  });

  it("client should be defined", () => {
      expect(clientMock).toBeDefined();
  });



  it(
    "AmazonLocationMaplibreGeocoder should be able to construct an object, " +
      "and createAmazonLocationPlacesSearch should return API for MaplibreGeocoder ",
    async () => {
        const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
            mapName: MAP_NAME,
            placesName: PLACES_NAME,
            region: REGION,
            apiKey: API_KEY,
        });
        (withAPIKey as jest.Mock).mockReturnValueOnce([{}]);
      expect(await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch()).toBeDefined();
    },
  );

  it.each([[undefined, undefined, undefined, undefined],
      [CategoriesEnum.CoffeeShop,CountriesEnum["United States"], {longitudeSW: 0,
          latitudeSW: 0,
          longitudeNE: 0,
          latitudeNE: 0}, undefined],
      [[`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`], [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`], undefined, [0, 0]]])
  ("forwardGeocode returns some values in the expected format.",
      async (categories? : CategoriesEnum[], countries? : CountriesEnum[], bbox?: BoundingBox, biasPosition?: Position) => {
      const config = {
          query: "a map query",
          language: "en",
          types: categories ? categories : "",
          countries: countries ? countries : "",
          proximity: biasPosition ? biasPosition : {},
          bbox: bbox ? bbox : []
      };

      (withAPIKey as jest.Mock).mockReturnValueOnce({
          getLocationClientConfig: () => {
              return {
                  signer: {someSigner: "signer"},
                  credentials: {someCredentials: "credentials"}
              };
          }});
      const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
          mapName: MAP_NAME,
          placesName: PLACES_NAME,
          region: REGION,
          apiKey: API_KEY,
      });

          const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send').mockReturnValue(
          {
              Results: [{
                  Place: {
                      AddressNumber: '1800',
                      Country: 'USA',
                      Geometry: {
                          Point: [-123, 45],
                      },
                      Label: 'A fake place',
                      PostalCode: '12345',
                      Street: '1st Street',
                      Type: "Feature",
                      PlaceId: "Small Ville"
                  }
              }]});

      const forwardGeocoderApi = await amazonLocationMaplibreGeocoder.createAmazonLocationForwardGeocodeApi();
      const response = await forwardGeocoderApi.forwardGeocode(config);

      expect(clientMock.send).toHaveBeenCalled();
      expect(response.features).toHaveLength(1);
      expect(response.features[0].geometry).toBeDefined();
  });

    it("forwardGeocode throws error when error is encountered",
        async () => {
            const config = {
                query: "a map query",
                language: "en",
                types: "",
                countries: "",
                proximity: {},
                bbox: []
            };

            (withAPIKey as jest.Mock).mockReturnValueOnce({
                getLocationClientConfig: () => {
                    return {
                        signer: {someSigner: "signer"},
                        credentials: {someCredentials: "credentials"}
                    };
                }});
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });

            const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send')
                .mockImplementation(() => {
                    throw new Error(TEST_ERROR_MESSAGE);
                });

            const forwardGeocoderApi = await amazonLocationMaplibreGeocoder.createAmazonLocationForwardGeocodeApi();
            try {
                await forwardGeocoderApi.forwardGeocode(config);
            } catch (e : Error) {
                expect(e.message).toEqual(TEST_ERROR_MESSAGE);
            }
            expect(clientMock.send).toHaveBeenCalled();
        });

  it("reverseGeocode must return valid values when given valid coordinates", async () => {
      const config = {
          query: "a map query",
          language: "en",
          types: "",
          countries: "",
          proximity: {},
          bbox: []
      };

      (withAPIKey as jest.Mock).mockReturnValueOnce({
          getLocationClientConfig: () => {
              return {
                  signer: {someSigner: "signer"},
                  credentials: {someCredentials: "credentials"}
              };
          }});
      const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
          mapName: MAP_NAME,
          placesName: PLACES_NAME,
          region: REGION,
          apiKey: API_KEY,
      });

      const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send').mockReturnValue(
          {
              Results: [{
                  Place: {
                      AddressNumber: '1800',
                      Country: 'USA',
                      Geometry: {
                          Point: [-123, 45],
                      },
                      Label: 'A fake place',
                      PostalCode: '12345',
                      Street: '1st Street',
                      Type: "Feature",
                      PlaceId: "Small Ville"
                  }
              }]});

      const reverseGeocodeApi = await amazonLocationMaplibreGeocoder.createAmazonLocationReverseGeocodeApi();
      const response = await reverseGeocodeApi.reverseGeocode(config);

      expect(clientMock.send).toHaveBeenCalled();
      expect(response.features).toHaveLength(1);
      expect(response.features[0].properties.id).toEqual("Small Ville");
  });

    it("reverseGeocode throws error when error is encountered",
        async () => {
            const config = {
                query: "a map query",
                language: "en",
                types: "",
                countries: "",
                proximity: {},
                bbox: []
            };

            (withAPIKey as jest.Mock).mockReturnValueOnce({
                getLocationClientConfig: () => {
                    return {
                        signer: {someSigner: "signer"},
                        credentials: {someCredentials: "credentials"}
                    };
                }});
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });

            const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send')
                .mockImplementation(() => {
                    throw new Error(TEST_ERROR_MESSAGE);
                });

            const reverseGeocoderApi = await amazonLocationMaplibreGeocoder.createAmazonLocationReverseGeocodeApi();
            try {
                await reverseGeocoderApi.reverseGeocode(config);
            } catch (e : Error) {
                expect(e.message).toEqual(TEST_ERROR_MESSAGE);
            }
            expect(clientMock.send).toHaveBeenCalled();
        });

  it.each([[undefined, undefined, undefined, undefined],
      [CategoriesEnum.CoffeeShop,CountriesEnum["United States"], {longitudeSW: 0,
          latitudeSW: 0,
          longitudeNE: 0,
          latitudeNE: 0}, undefined],
      [[`${CategoriesEnum.CoffeeShop},${CategoriesEnum.Bar}`], [`${CountriesEnum["United States"]},${CountriesEnum.Mexico}`], undefined, [0, 0]]])
  ("getSuggestions API MUST respond with expected payload.",
      async (categories? : string , countries? : string, bbox?: BoundingBox, biasPosition?: Position) => {
        const config = {
            query: "a map query",
            language: "en",
            types: categories ? categories : "",
            countries: countries ? countries : "",
            proximity: biasPosition ? biasPosition : {},
            bbox: bbox ? bbox : []
        };

        (withAPIKey as jest.Mock).mockReturnValueOnce({
            getLocationClientConfig: () => {
                return {
                    signer: {someSigner: "signer"},
                    credentials: {someCredentials: "credentials"}
                };
            }});
        const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
            mapName: MAP_NAME,
            placesName: PLACES_NAME,
            region: REGION,
            apiKey: API_KEY,
        });

        const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send').mockReturnValue(
            {
                Results: [{
                    Text: "Cool Suggested Location",
                    PlaceId: "AUS 16"
                }]});

        const getSuggestionsAPI = await amazonLocationMaplibreGeocoder.createAmazonLocationGetSuggestions();
        const response = await getSuggestionsAPI.getSuggestions(config);

        expect(clientMock.send).toHaveBeenCalled();
        expect(response.suggestions).toBeDefined();
        expect(response.suggestions[0].placeId).toEqual("AUS 16");
    });

    it("getSuggestions throws error when error is encountered",
        async () => {
            const config = {
                query: "a map query",
                language: "en",
                types: "",
                countries: "",
                proximity: {},
                bbox: []
            };

            (withAPIKey as jest.Mock).mockReturnValueOnce({
                getLocationClientConfig: () => {
                    return {
                        signer: {someSigner: "signer"},
                        credentials: {someCredentials: "credentials"}
                    };
                }});
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });

            const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send')
                .mockImplementation(() => {
                    throw new Error(TEST_ERROR_MESSAGE);
                });

            const getSuggestionsApi = await amazonLocationMaplibreGeocoder.createAmazonLocationGetSuggestions();
            try {
                await getSuggestionsApi.getSuggestions(config);
            } catch (e : Error) {
                expect(e.message).toEqual(TEST_ERROR_MESSAGE);
            }
            expect(clientMock.send).toHaveBeenCalled();
        });

  it("searchByPlaceId should return data in expected format.", async () => {
      const config = {
          query: "a map query",
          language: "en",
          types: "",
          countries: "",
          proximity: {},
          bbox: []
      };

      (withAPIKey as jest.Mock).mockReturnValueOnce({
          getLocationClientConfig: () => {
              return {
                  signer: {someSigner: "signer"},
                  credentials: {someCredentials: "credentials"}
              };
          }});
      const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
          mapName: MAP_NAME,
          placesName: PLACES_NAME,
          region: REGION,
          apiKey: API_KEY,
      });

      const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send').mockReturnValue(
          {
              Place: {
                  AddressNumber: '1800',
                  Country: 'USA',
                  Geometry: {
                      Point: [-123, 45],
                  },
                  Label: 'A fake place',
                  PostalCode: '12345',
                  Street: '1st Street',
                  Type: "Feature",
                  PlaceId: "Small Ville"
              }});

      const searchByPlaceId = await amazonLocationMaplibreGeocoder.createAmazonLocationSearchPlaceById();
      const response = await searchByPlaceId.searchByPlaceId(config);

      expect(response.place).toBeDefined();
      expect(response.place.geometry.coordinates).toEqual([-123, 45]);
  });

    it("searchByPlaceId throws error when error is encountered",
        async () => {
            const config = {
                query: "a map query",
                language: "en",
                types: "",
                countries: "",
                proximity: {},
                bbox: []
            };

            (withAPIKey as jest.Mock).mockReturnValueOnce({
                getLocationClientConfig: () => {
                    return {
                        signer: {someSigner: "signer"},
                        credentials: {someCredentials: "credentials"}
                    };
                }});
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });

            const clientSendSpy = jest.spyOn(LocationClient.prototype, 'send')
                .mockImplementation(() => {
                    throw new Error(TEST_ERROR_MESSAGE);
                });

            const searchForPlaceId = await amazonLocationMaplibreGeocoder.createAmazonLocationSearchPlaceById();
            try {
                await searchForPlaceId.searchByPlaceId(config);
            } catch (e : Error) {
                expect(e.message).toEqual(TEST_ERROR_MESSAGE);
            }
            expect(clientMock.send).toHaveBeenCalled();
        });

  it.each([[undefined, undefined, undefined, undefined],
      [[CategoriesEnum.CoffeeShop],[CountriesEnum["United States"]], {longitudeSW: 0,
          latitudeSW: 0,
          longitudeNE: 0,
          latitudeNE: 0}, undefined],
      [[CategoriesEnum.CoffeeShop], [CountriesEnum["United States"]], undefined, [0, 0]]])
  ("I expect that I can get an IControl, MaplibreGeocoder WHEN I call createAmazonLocationGeocoder",
      async (categories? : CategoriesEnum[], countries? : CountriesEnum[], bbox?: BoundingBox, biasPosition?: Position) => {
      (withAPIKey as jest.Mock).mockReturnValueOnce({
          getLocationClientConfig: () => {
              return {
                  signer: {someSigner: "signer"},
                  credentials: {someCredentials: "credentials"}
              };
          }});
      const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
          mapName: MAP_NAME,
          placesName: PLACES_NAME,
          region: REGION,
          apiKey: API_KEY,
      });

      if(categories) {
          amazonLocationMaplibreGeocoder.addCategoryFilters(categories);
      }
      if(countries) {
          amazonLocationMaplibreGeocoder.addCountryFilters(countries);
      }
      if(bbox) {
          amazonLocationMaplibreGeocoder.setBoundingBox(bbox);
      }
      if(biasPosition) {
          amazonLocationMaplibreGeocoder.setBiasPosition(biasPosition);
      }

      // Set up  the API
      await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
      const maplibreGeocoder = amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

      expect(maplibreGeocoder).toBeDefined();
  });

    it("maplibreGeocoder should be undefined IF I try to create the geocoder WHEN I have NOT create the APIs",
        () => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });

            const maplibreGeocoder = amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

            expect(maplibreGeocoder).toEqual(null);
        })

  it.each([
      [[CategoriesEnum.CoffeeShop], [CategoriesEnum.CoffeeShop]],
      [[CategoriesEnum.Bar, CategoriesEnum.CoffeeShop], [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop]],
      [[CategoriesEnum.Bar, CategoriesEnum.TouristAttraction], [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction]],
      [[CategoriesEnum.CoffeeShop, CategoriesEnum.Zoo, CategoriesEnum.Aquarium, CategoriesEnum.ATM, CategoriesEnum.Airport, CategoriesEnum.Bakery], []]
  ])(
      "AmazonLocationMaplibreGeocoder should be able to add Category filters WHEN the number of filters is less than the max number of filters.",
      async (filters : CategoriesEnum[], expected : CategoriesEnum[]) => {
          const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
              mapName: MAP_NAME,
              placesName: PLACES_NAME,
              region: REGION,
              apiKey: API_KEY,
          });
          await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
          amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();
          expect(amazonLocationMaplibreGeocoder.addCategoryFilters(filters)).toStrictEqual(expected);
          expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual(expected.join(","));
      });

    it.each([
        [[CategoriesEnum.CoffeeShop], [CategoriesEnum.CoffeeShop]],
        [[CategoriesEnum.Bar, CategoriesEnum.CoffeeShop], [CategoriesEnum.Bar, CategoriesEnum.CoffeeShop]],
        [[CategoriesEnum.Bar, CategoriesEnum.TouristAttraction], [CategoriesEnum.Bar, CategoriesEnum.TouristAttraction]],
        [[CategoriesEnum.CoffeeShop, CategoriesEnum.Zoo, CategoriesEnum.Aquarium, CategoriesEnum.ATM, CategoriesEnum.Airport, CategoriesEnum.Bakery], [CategoriesEnum.CoffeeShop, CategoriesEnum.Zoo, CategoriesEnum.Aquarium, CategoriesEnum.ATM, CategoriesEnum.Airport]]
    ])(
        "AmazonLocationMaplibreGeocoder should be able to add Category filters individually until there are too many.",
        async (filters : CategoriesEnum[], expected : CategoriesEnum[]) => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });
            await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
            amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();
            filters.forEach((filter) => {
                amazonLocationMaplibreGeocoder.addCategoryFilter(filter);
            })
            expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual(expected.join(","));
        });

    it("AmazonLocationMaplibreGeocoder should be able to clear the category filters after setting filters.",
        async () => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });
            await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
            amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

            // Add some filters.
            const filter = [CategoriesEnum.CoffeeShop, CategoriesEnum.Bar, CategoriesEnum.Bakery];
            amazonLocationMaplibreGeocoder.addCategoryFilters(filter);
            // Confirm that we have the filter in place.
            expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual(filter.join(","));

            // Now we clear the filter.
            amazonLocationMaplibreGeocoder.clearCategoryFilters();
            // Now we should have empty string return.
            expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual("");
        })

    it.each([
        [[CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada], ["MEX", "USA", "CAN"]],
        [Object.values(CountriesEnum), []]
    ])(
        "AmazonLocationMaplibreGeocoder should be able to add Country filters WHEN the number of filters is less than the max number of filters.",
        async (filters : CountriesEnum[], expected : CountriesEnum[]) => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });
            await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
            amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();
            expect(amazonLocationMaplibreGeocoder.addCountryFilters(filters)).toStrictEqual(expected);
            expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual(expected.join(","));
        });

    it.each([
        [[CountriesEnum.Mexico, CountriesEnum["United States"], CountriesEnum.Canada], ["MEX", "USA", "CAN"]],
        [Object.values(CountriesEnum), Object.values(CountriesEnum).slice(0, MAX_COUNTRY_FILTERS)]
    ])(
        "AmazonLocationMaplibreGeocoder should be able to add Country filters one at a time WHILE the number of filters is less than the max number of filters.",
        async (filters : CountriesEnum[], expected : CountriesEnum[]) => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });
            await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
            amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

            filters.forEach((filter) => {
                amazonLocationMaplibreGeocoder.addCountryFilter(filter);
            })
            expect(amazonLocationMaplibreGeocoder.addCountryFilters(filters)).toStrictEqual(expected);
            expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual(expected.join(","));
        });

    it("AmazonLocationMaplibreGeocoder should be able to clear the country filters after setting filters.",
        async () => {
            const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
                mapName: MAP_NAME,
                placesName: PLACES_NAME,
                region: REGION,
                apiKey: API_KEY,
            });
            await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
            amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

            // Add some filters.
            const filter = [CountriesEnum["United States"], CountriesEnum.Mexico, CountriesEnum.Canada];
            amazonLocationMaplibreGeocoder.addCountryFilters(filter);
            // Confirm that we have the filter in place.
            expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual(filter.join(","));

            // Now we clear the filter.
            amazonLocationMaplibreGeocoder.clearCountryFilter();
            // Now we should have empty string return.
            expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual("");
        });

    it("bias position and bounding box MUST be exclusive.", async () => {
        const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
            mapName: MAP_NAME,
            placesName: PLACES_NAME,
            region: REGION,
            apiKey: API_KEY,
        });
        await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();
        amazonLocationMaplibreGeocoder.createAmazonLocationGeocoder();

        // Set up the bbox values and biasPosition values
        const bbox : BoundingBox = {
            longitudeSW: 0,
            latitudeSW: 0,
            longitudeNE: 0,
            latitudeNE: 0
        }

        const bboxAry = [0, 0, 0, 0];

        const biasPosition : Position = {
            longitude: 0,
            latitude: 0
        }

        // Set bbox
        amazonLocationMaplibreGeocoder.setBoundingBox(bbox);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual(bboxAry);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual({});

        // Set bias position
        amazonLocationMaplibreGeocoder.setBiasPosition(biasPosition);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual(biasPosition);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual([]);

        // Set bbox again
        amazonLocationMaplibreGeocoder.setBoundingBox(bbox);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual(bboxAry);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual({});

        // clear bbox
        amazonLocationMaplibreGeocoder.clearBoundingBox();
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual([]);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual({});

        // set bias position again
        amazonLocationMaplibreGeocoder.setBiasPosition(biasPosition);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual(biasPosition);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual([]);

        // clear bias position.
        amazonLocationMaplibreGeocoder.clearBiasPosition();
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual([]);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual({});
    });

    it("Clear all filters MUST clear all filters.", async () => {
        const amazonLocationMaplibreGeocoder = new AmazonLocationMaplibreGeocoder({
            mapName: MAP_NAME,
            placesName: PLACES_NAME,
            region: REGION,
            apiKey: API_KEY,
        });
        await amazonLocationMaplibreGeocoder.createAmazonLocationPlacesSearch();

        // set up filter values.
        const categoryFilters = [CategoriesEnum.CoffeeShop, CategoriesEnum.Bar, CategoriesEnum.Bakery];
        const countryFilters = [CountriesEnum["United States"], CountriesEnum.Mexico, CountriesEnum.Canada];
        const bbox : BoundingBox = {
            longitudeSW: 0,
            latitudeSW: 0,
            longitudeNE: 0,
            latitudeNE: 0
        }

        const biasPosition : Position = {
            longitude: 0,
            latitude: 0
        }

        amazonLocationMaplibreGeocoder.addCategoryFilters(categoryFilters)
        amazonLocationMaplibreGeocoder.addCountryFilters(countryFilters);
        amazonLocationMaplibreGeocoder.setBoundingBox(bbox);
        expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual(categoryFilters);
        expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual(countryFilters);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual(bbox);

        // Clear all filters
        amazonLocationMaplibreGeocoder.clearFilters();
        expect(amazonLocationMaplibreGeocoder.getCategoryFilter()).toStrictEqual([]);
        expect(amazonLocationMaplibreGeocoder.getCountryFilter()).toStrictEqual([]);
        expect(amazonLocationMaplibreGeocoder.getBoundingBox()).toStrictEqual(null);

        // Just bias position
        amazonLocationMaplibreGeocoder.setBiasPosition(biasPosition);
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual(biasPosition);

        // Clear all filters
        amazonLocationMaplibreGeocoder.clearFilters();
        expect(amazonLocationMaplibreGeocoder.getBiasPosition()).toStrictEqual(null);

    });
});
