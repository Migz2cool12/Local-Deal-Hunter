# Live Data Setup

The app now tries two browser-accessible live/observed sources:

1. Nourish public grocery preview using the user's latitude/longitude.
2. Open Food Facts product search + Open Prices observations for the searched item.

The app never uses fake sample prices.

For broad U.S. retailer coverage (Walmart, Target, Kroger, Costco, etc.) and reliable current prices, add a commercial data provider such as ShopSavvy or another authorized retailer-price provider. API credentials should be kept on a server/serverless function rather than placed in public GitHub Pages JavaScript. ShopSavvy advertises product, pricing, and availability data across many retailers. citeturn0search0

GitHub Pages can host the front end, but it cannot safely store private API secrets. A later production architecture can use GitHub Pages + a serverless API proxy.
