# Local Deal Hunter — Ready-to-publish prototype

This folder is the complete static web/PWA prototype.

## Included
- Mobile-first interface
- Search
- Food, grocery, gas, everyday categories
- Sort by price, distance, savings
- Browser location permission
- Saved deals using local device storage
- PWA manifest/service worker
- Privacy Policy and Terms pages

## Before calling it a production price-comparison app
The current cards use clearly labeled sample data. Replace `sampleDeals` in `app.js` with data from legitimate APIs/feeds that you are authorized to use. Do not represent sample prices as live prices.

## Free hosting
Upload all files to a public static hosting service such as GitHub Pages, then enable Pages for the repository's main branch/root folder.

## Production checklist
1. Connect authorized live price/deal sources.
2. Add real geocoding/maps if needed.
3. Add retailer/source attribution and links.
4. Test location permissions on Android and desktop.
5. Update Privacy Policy and Terms to match every service actually used.
6. Test on multiple screen sizes.
7. Add analytics only if desired and disclose it in the privacy policy.
8. Add monetization only after verifying the relevant provider's requirements.
9. Package as an Android app only after the web version is stable.

## Important
This prototype is ready to upload as a website, but it is not yet a live price database. No app can honestly show current local prices without a current, authorized data source.
