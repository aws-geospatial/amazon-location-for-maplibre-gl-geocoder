import { CategoriesEnum, CountriesEnum, AmazonLocationBoundingBox, AmazonLocationPosition } from "../common/types";
interface AmazonLocationCredentials {
    mapName: string;
    placesName: string;
    region: string;
    apiKey: string;
}
export declare class AmazonLocationMaplibreGeocoder {
    readonly mapName: string;
    readonly placesName: string;
    readonly region: string;
    readonly apiKey: string;
    private amazonLocationAuthHelper;
    private filterCountries;
    private filterCategories;
    private filterBBox;
    private biasPosition;
    private language;
    private center;
    private AmazonLocationApi;
    constructor(credentials: AmazonLocationCredentials);
    createAmazonLocationForwardGeocodeApi(): Promise<{}>;
    createAmazonLocationReverseGeocodeApi(): Promise<void>;
    createAmazonLocationGetSuggestions(): Promise<{}>;
    createAmazonLocationSearchPlaceById(): Promise<{}>;
    createAmazonLocationPlacesSearch(): Promise<{}>;
    private getParameters;
    private getFilteredParameters;
    addCategoryFilters(filters: CategoriesEnum[]): CategoriesEnum[];
    addCategoryFilter(category: CategoriesEnum): CategoriesEnum[];
    clearCategoryFilters(): void;
    addCountryFilters(filters: CountriesEnum[]): CountriesEnum[];
    addCountryFilter(country: CountriesEnum): CountriesEnum[];
    clearCountryFilter(): void;
    setBoundingBox(boundingBox: AmazonLocationBoundingBox): void;
    clearBoundingBox(): void;
    setBiasPosition(position: AmazonLocationPosition): void;
    clearBiasPosition(): void;
    clearFilters(): void;
}
export {};
