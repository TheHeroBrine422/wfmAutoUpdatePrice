const axios = require('axios');

excludeList = [
  "Ash Prime Set",
  "Atlas Prime Set",
  "Banshee Prime Set",
  "Chroma Prime Set",
  "Equinox Prime Set",
  "Frost Prime Set",
  "Gara Prime Set",
  "Garuda Prime Set",
  "Harrow Prime Set",
  "Hydroid Prime Set",
  "Inaros Prime Set",
  "Ivara Prime Set",
  "Limbo Prime Set",
  "Loki Prime Set",
  "Mesa Prime Set",
  "Mirage Prime Set",
  "Nekros Prime Set",
  "Nezha Prime Set",
  "Nidus Prime Set",
  "Nyx Prime Set",
  "Octavia Prime Set",
  "Rhino Prime Set",
  "Saryn Prime Set",
  "Titania Prime Set",
  "Trinity Prime Set",
  "Valkyr Prime Set",
  "Volt Prime Set",
  "Wukong Prime Set",
  "Zephyr Prime Set",

  "Burston Prime Set",
  "Braton Prime Set",
  "Bronco Prime Set",
  "Gram Prime Set",
  "Karyst Prime Set",
  "Pyrana Prime Set",
  "Reaper Prime Set",
  "Redeemer Prime Set",
  "Rubico Prime Set",
  "Scindo Prime Set",
  "Soma Prime Set",
  "Vectis Prime Set",

  "Helios Prime Set",
  "Carrier Prime Set",
  "Dethcube Prime Set",

  "Lex Prime Set"
];

function delay(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

(async () => {
  items = await axios({
    "method": 'get',
    'url': 'https://api.warframe.market/v1/items',
  })

  items = items.data.payload.items
  primeItems = []
  sum = 0;

  for (var i = 0; i < items.length; i++) {
    if (items[i].item_name.includes("Prime Set") && excludeList.indexOf(items[i].item_name) < 0) {
      primeItems.push(items[i])
    }
  }

  for (var i = 0; i < primeItems.length; i++) {
    console.log(i+"/"+primeItems.length + " - "+primeItems[i].item_name)
    await delay(400)
    delete primeItems[i].id
    delete primeItems[i].thumb
    itemOrders = await axios({
      "method": "get",
      "url": "https://api.warframe.market/v1/items/" + primeItems[i].url_name + "/orders",
    })
    itemOrders = itemOrders.data.payload.orders

    for (var j = 0; j < itemOrders.length; j++) { // filter out invalid orders (user status, platform, only sell orders)
      if (itemOrders[j].user.status != 'ingame' || itemOrders[j].order_type == 'buy' || itemOrders[j].platform != 'pc') {
        itemOrders.splice(j, 1)
        j--
      }
    }

    itemOrders.sort((a, b) => parseFloat(a.platinum) - parseFloat(b.platinum));

    primeItems[i].lowestSellOrder = itemOrders[0].platinum
    sum += itemOrders[0].platinum
  }

  primeItems.sort((a, b) => parseFloat(a.lowestSellOrder) - parseFloat(b.lowestSellOrder));

  console.table(primeItems)
  console.log("Total price of all items: "+sum)
})();
