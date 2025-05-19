// Copyright Amazon.com, Inc. or its affiliates. All Rights Reserved.
// SPDX-License-Identifier: Apache-2.0

import * as amazonLocationMaplibreGeocoder from ".";

describe("Exported class", () => {
  it("Should export AmazonLocationMaplibreGeocoder", () => {
    expect("AmazonLocationMaplibreGeocoder" in amazonLocationMaplibreGeocoder).toBe(true);
  });

  it("Should export buildAmazonLocationMaplibreGeocoder", () => {
    expect("buildAmazonLocationMaplibreGeocoder" in amazonLocationMaplibreGeocoder).toBe(true);
  });

  it("Should export PlacesGeocoderOptions", () => {
    expect("PlacesGeocoderOptions" in amazonLocationMaplibreGeocoder).toBe(true);
  });
});
