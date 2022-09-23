require("dotenv").config();
const got = require("got");
const { Client, Intents, MessageEmbed } = require("discord.js");

let sku = "X000004787006";

let previouslyInStock = false;

const client = new Client({
  intents: [
    Intents.FLAGS.GUILDS, //adds server functionality
    Intents.FLAGS.GUILD_MESSAGES, //gets messages from our bot.
  ],
});

client.once("ready", async () => {
  console.log("Ready!");
  await main();
});

function delay(delayInms) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(2);
    }, delayInms);
  });
}

async function main() {
  while (true) {
    await checkAvaliable();
    await delay(10000);
  }
}

async function checkAvaliable() {
  let res;

  let headers = {
    accept: "*/*",
    "accept-language": "en-US,en;q=0.9",
    "cache-control": "no-cache",
    "content-type": "application/json",
    pragma: "no-cache",
    "sec-ch-ua":
      '"Google Chrome";v="105", "Not)A;Brand";v="8", "Chromium";v="105"',
    "sec-ch-ua-mobile": "?0",
    "sec-ch-ua-platform": '"macOS"',
    "sec-fetch-dest": "empty",
    "sec-fetch-mode": "cors",
    "sec-fetch-site": "same-site",
    store: "arcteryx_en",
    "x-country-code": "gb",
    "x-is-checkout": "false",
    "x-jwt": "",
    Referer: "https://arcteryx.com/",
    "Referrer-Policy": "strict-origin-when-cross-origin",
  };

  let payload = {
    query:
      "query gqlGetProductInventoryBySkus($productSkus: [String!]) {\n  products(filter: { sku: { in: $productSkus } }, pageSize: 500) {\n    items {\n      name\n      sku\n      ...on ConfigurableProduct {\n        variants {\n          product {\n            sku\n            quantity_available\n          }\n        }\n      }\n    }\n  }\n}",
    variables: { productSkus: ["X000004787"] },
  };

  console.log(payload);
  try {
    res = await got.post(`https://mcprod.arcteryx.com/graphql`, {
      headers,
      json: payload,
    });

    let obj = JSON.parse(res.body).data.products.items[0].variants;

    console.log(obj);

    let product = await obj.find((el) => el.product.sku === sku);

    let found = product.product;

    if (found.quantity_available != 0) {
      if (!previouslyInStock) {
        console.log("Instock");
        await discordMessage();
        previouslyInStock = true;
      }
    } else {
      console.log("OOS");
      previouslyInStock = false;
    }
  } catch (err) {
    console.log(err);
  }
}

async function discordMessage() {
  const channel = client.channels.cache.get(process.env.DISCORD_CHANNEL);

  const embed = new MessageEmbed()
    .setColor("#fd2973")
    .setTitle("THE FUCKING ARCTERYX IS IN STOCK")
    .setURL(`https://arcteryx.com/gb/en/shop/mens/beta-lt-jacket`)
    .setTimestamp()
    .setFooter({
      text: "Made by Roo#7777",
      iconURL:
        "https://i.ibb.co/VDMp2Bx/0e58a19b5a24f0542691313ff5106e40-1.png",
    });

  channel.send({ content: "<@181094829500006400>", embeds: [embed] });
}

client.login(process.env.DISCORD_TOKEN);
