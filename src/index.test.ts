import * as amazonLocationMaplibreGeocoder from ".";

describe("Exported class", () => {
  it("Should export AmazonLocationMaplibreGeocoder", () => {
    expect("AmazonLocationMaplibreGeocoder" in amazonLocationMaplibreGeocoder).toBe(true);
  });

  it("Should export buildAmazonLocationMaplibreGeocoder", () => {
    expect("buildAmazonLocationMaplibreGeocoder" in amazonLocationMaplibreGeocoder).toBe(true);
  });
});
