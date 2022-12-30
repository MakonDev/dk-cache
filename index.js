const express = require('express')
var redis = require('redis')
require('dotenv').config()
const bodyParser = require('body-parser')
const serverHelper = require("./helpers/serverHelper.js")

let redisClient;

(async () => {
  process.env.REDIS_URL ?
    redisClient = redis.createClient({
      url: process.env.REDIS_URL,
      socket: {
        tls: true,
        rejectUnauthorized: false
      }
    }) :
    redisClient = redis.createClient()

  redisClient.on("error", (error) => console.error(`Error : ${error}`));

  await redisClient.connect();
})();

redisClient.on('connect', async function() {
  //await refreshHelper.getLatestETHPrice(redisClient)
  console.log('Connected!'); // Connected!
});

const app = express();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.get("/ping", async(req, res) => {
  res.status(200).json("I'm here!")
})

app.get("/getData", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    let data = []
    const returned = await redisClient.get("data")
    if (returned) {
      data = JSON.parse(returned)
    }
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

app.get("/syncData", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    const data = await serverHelper.search(redisClient)
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

setInterval(async () => {
  const date = new Date();
  console.log(`Current hour: ${date.getHours()}`)
  if (date.getHours() >= 17 && date.getHours() <= 23) {  
    const delay = Math.floor(Math.random() * (900000 - 10000 + 1)) + 10000;
    console.log(`Delaying ${delay/1000/60} Minutes`)
    await sleep(delay)
    console.log("Done syncing latest tokens")
  } else {
    console.log("Not the right time of day!")
  }
}, 1800000);

const port = process.env.PORT || 8081;
app.listen(port);

console.log(`DK Cacher listening on ${port}`);