const axios = require('axios')
const fs = require('fs')

Settings = JSON.parse(fs.readFileSync("Settings.json"))

function delay(milisec) {
    return new Promise(resolve => {
        setTimeout(() => { resolve('') }, milisec);
    })
}

/*
API Data Objects:
Self Orders (https://api.warframe.market/v1/profile/Hero422/orders):
{
  quantity: 3,
  last_update: '2021-11-20T19:58:11.876+00:00',
  mod_rank: 0,
  platinum: 25,
  order_type: 'sell',
  region: 'en',
  item: {
    mod_max_rank: 5,
    id: '56a7b2851133f656cb085d8d',
    url_name: 'bladed_rounds',
    icon: 'icons/en/Bladed_Rounds.ef8baaa32b793cfea6ede28f48ec2dd9.png',
    thumb: 'icons/en/thumbs/Bladed_Rounds.ef8baaa32b793cfea6ede28f48ec2dd9.128x128.png',
    icon_format: 'port',
    tags: [ 'rifle', 'mod', 'uncommon', 'primary' ],
    sub_icon: null,
    en: { item_name: 'Bladed Rounds' },
    ru: { item_name: 'Патроны С Лезвиями' },
    ko: { item_name: '블레이디드 라운즈' },
    fr: { item_name: 'Salves De Lames' },
    sv: { item_name: 'Bladed Rounds' },
    de: { item_name: 'Messergeschoss' },
    'zh-hant': { item_name: '尖刃彈頭' },
    'zh-hans': { item_name: '尖刃弹头' },
    pt: { item_name: 'Bladed Rounds' },
    es: { item_name: 'Municiones De Hoja' },
    pl: { item_name: 'Pociski-ostrza' }
  },
  id: '6115ea0705d44403c42b7fe7',
  platform: 'pc',
  creation_date: '2021-08-13T03:41:59.586+00:00',
  visible: false
}


Other Orders (https://api.warframe.market/v1/items/{url_name}/orders):
{
 quantity: 6,
 platinum: 50,
 order_type: 'sell',
 visible: true,
 user: {
   reputation: 827,
   region: 'en',
   last_seen: '2022-05-27T08:18:34.541+00:00',
   ingame_name: 'Bullet_0818',
   avatar: 'user/avatar/5d7a4325d773050411f79fbf.png?25def3686966ef22294b5e229ff8d3b4',
   id: '5d7a4325d773050411f79fbf',
   status: 'offline'
 },
 platform: 'pc',
 region: 'en',
 creation_date: '2021-12-23T14:36:03.000+00:00',
 last_update: '2022-04-13T17:19:08.000+00:00',
 id: '61c4895362c5130da338b396',
 mod_rank: 5
}
*/

;
(async () => {
  totalPrice = 0
  auth = await axios({
    "method": 'post',
    'url': 'https://api.warframe.market/v1/auth/signin',
    "data": {
      "auth_type": 'header',
      "email": Settings.email,
      "password": Settings.password
    },
    "headers": {
      "Authorization": "JWT",
      "language": "en",
      "accept": "application/json",
      "platform": "pc",
      "auth_type": "header"
    }
  })
  user = auth.data.payload.user
  JWT = auth.headers.authorization

  orders = await axios({
    "method": "get",
    "url": "https://api.warframe.market/v1/profile/" + user.ingame_name + "/orders",
    "headers": {
      "Authorization": JWT,
      "language": "en",
      "accept": "application/json",
      "platform": "pc"
    }
  })
  orders = orders.data.payload.sell_orders

  for (var i = 0; i < orders.length; i++) {
    if (orders[i].mod_rank == 0 || orders[i].mod_rank == null) { // ignore ranked up mods which will not be accurately priced.
      await delay(Settings.delayBetweenItem)
      console.log(i+"/"+orders.length+" - "+orders[i].item.en.item_name)
      try {
        itemOrders = await axios({
          "method": "get",
          "url": "https://api.warframe.market/v1/items/" + orders[i].item.url_name + "/orders",
          "headers": {
            "Authorization": JWT,
            "language": "en",
            "accept": "application/json",
            "platform": "pc"
          }
        })
        itemOrders = itemOrders.data.payload.orders

        for (var j = 0; j < itemOrders.length; j++) { // filter out invalid orders (user status, platform, only sell orders)
          if (itemOrders[j].user.status != 'ingame' || itemOrders[j].order_type == 'buy' || itemOrders[j].platform != 'pc' || itemOrders[j].user.ingame_name == user.ingame_name) {
            itemOrders.splice(j, 1)
            j--
          }
        }

        itemOrders.sort((a, b) => parseFloat(a.platinum) - parseFloat(b.platinum)); // sort based on price

        ordersConsidered = Math.min(2, Math.ceil(Settings.ordersConsideredPercentage * itemOrders.length)) // remove extra high priced orders
        for (var j = ordersConsidered; j < itemOrders.length; j++) {
          itemOrders.splice(j, 1)
          j--
        }

        minPrice = Infinity // calculate stats to use for calculating price.
        maxPrice = -Infinity
        for (var j = 0; j < itemOrders.length; j++) {
          if (minPrice > itemOrders[j].platinum) {
            minPrice = itemOrders[j].platinum
          }
          if (maxPrice < itemOrders[j].platinum) {
            maxPrice = itemOrders[j].platinum
          }
        }

        price = Math.ceil(Math.max(Settings.minPossiblePrice, minPrice + Math.min(Settings.maxAddedPrice, ((maxPrice - minPrice) * Settings.addedPricePercentage)))) // calculate price

        data = { // generate data object
          "order_id": orders[i].id,
          "platinum": price,
          "quantity": orders[i].quantity,
          "visible": true
        }
        if (orders[i].mod_rank != null) { // rank is only needed if item is a mod.
          data.rank = orders[i].mod_rank
        }

        totalPrice += price*orders[i].quantity

        console.log(data)
        await axios({
          "method": "put",
          "url": "https://api.warframe.market/v1/profile/orders/" + orders[i].id,
          "headers": {
            "Authorization": JWT,
            "language": "en",
            "accept": "application/json",
            "platform": "pc"
          },
          "data": data
        })
      } catch (error) {
        console.log(error)
        console.log(itemOrders)
        console.log(price)
        console.log(minPrice)
        console.log(maxPrice)
        console.log(ordersConsidered)
        console.log(error.response.data.error)
        console.log(orders[i].item.en.item_name)
        console.log("Something went wrong. Printed Debug data.")
      }
    }
  }
  console.log("Total Price of All Orders: "+totalPrice)
})();
