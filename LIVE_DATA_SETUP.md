# Live-data setup

This build uses the browser's location permission and is structured to request location-specific live grocery data.

## Current live connector
- Nourish public price preview: `https://mynourish.app/api/v1/public/prices?lat=LAT&lng=LNG`
- Nourish documents this endpoint as returning a small sample of real scraped grocery prices and supporting `lat`/`lng` filters.
- The app does not invent prices when the live endpoint fails.

## Production connector
For full catalog coverage, use a provider account/key on a server-side proxy. Never put a private API key directly in browser JavaScript.

Good candidates include:
- Nourish for store-level grocery prices.
- Kroger's developer API for Kroger-family products/stores where applicable.
- A licensed product/offer provider for broader retail coverage.
- A licensed gas-price data provider for fuel.

## Important
There is no single free public API that legally provides every nearby US retailer's current price, stock, restaurant deal, and gas price. A real production app therefore needs multiple authorized data sources. Each provider's terms, rate limits, attribution and coverage must be followed.
