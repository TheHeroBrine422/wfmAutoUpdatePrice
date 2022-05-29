# Warframe Market Auto Price Update Script

requires axios.

Settings file should be included at Settings.json Example file included below with comments. Remove everything after the //. Example file is also included in the repo called SettingsEx.json

The price generation works by taking the lowest sell orders that are currently ingame. The number of these are determined based on the ordersConsideredPercentage. It then takes the minimum and maximum price of the valid orders. It then generates a price to be added to the minimum price. This is based difference between min and max price multiplied by addedPricePercentage. This value is then limited out by maxAddedPrice. This value plus minPrice is then the final price after being limited by the minPossiblePrice.

The price generation might be easier to understand in code rather then words so it is included on lines roughly 120 - 145.

```
{
  "minPossiblePrice": 7,             // minimum possible price
  "maxAddedPrice": 5,                // max price added to minPrice
  "addedPricePercentage": 0.2,       // multiplied by difference between minPrice and maxPrice to generate addedPrice
  "ordersConsideredPercentage": 0.3, // percentage of valid orders considered for minPrice and maxPrice
  "email": "",                       // warframe market email
  "password": ""                     // warframe market password
}
```
### TODO:

* pricing of ranked items such as mods. currently these are just ignored.
