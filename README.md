# Local Deal Hunter — Live Price Build

Local Deal Hunter uses the phone's location and live/observed price sources instead of fake sample prices.

## Current live sources

- Nourish public grocery preview: location-based grocery pricing when its public endpoint returns coverage.
- Open Food Facts + Open Prices: product-name search followed by real price observations tied to physical shops and dates.

## Important

No single free public API provides every current price for every U.S. grocery store, restaurant, gas station, and retailer. Commercial retailer-price APIs generally require an API key/account. For example, ShopSavvy provides retailer product, pricing, and availability data through its API. citeturn0search0

Open Prices is crowdsourced and therefore should be presented as an observed price, not a guaranteed current shelf price. citeturn0search2

This build deliberately does not invent prices when a live source has no coverage.

## GitHub Pages

Upload the files in this folder directly into the repository root. `index.html` must be in the root of the `main` branch.
