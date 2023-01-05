const express = require('express')
var redis = require('redis')
require('dotenv').config()
const bodyParser = require('body-parser')
const serverHelper = require("./helpers/serverHelper.js")

let redisClient;

(async () => {
  process.env.REDIS_TLS_URL ?
    redisClient = redis.createClient({
      url: process.env.REDIS_TLS_URL,
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
    const returned = await redisClient.get("propdata")
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

app.get("/getETRData", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    let data = []
    const returned = await redisClient.get("etrdata")
    if (returned) {
      data = JSON.parse(returned)
    }
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

app.get("/getFinalData", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    let data = []
    const returned = await redisClient.get("finaldata")
    if (returned) {
      data = JSON.parse(returned)
    }
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

app.get("/getAverages", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    const data = await serverHelper.assemblePlayerAverages()
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

app.get("/getInjuries", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    let data = []
    // const returned = await redisClient.get("injuryData")
    // if (returned) {
    //   data= JSON.parse(returned)
    // } else {
      data = await serverHelper.getInjuryInfo(redisClient)
    // }
    res.status(200).json(data)
  } else {
    res.status(401).json("Endpoint forbidden")
  }
});

app.post("/acceptETR", async(req, res) => {
  if (req.headers["dk-secret"] === process.env.DK_SECRET) {
    if (req.body) {
      let data = []
      const returned = await redisClient.get("propdata")
      let finalData = []
      if (returned) {
        console.log("got returned propdata")
        data = JSON.parse(returned)
        const averageData = await serverHelper.assemblePlayerAverages()
        finalData = await serverHelper.registerETRStuff(req.body.chunkedETRData, data, redisClient, averageData)
        console.log("done registering")
      }
      await redisClient.set("etrdata", JSON.stringify(req.body), {'EX': 3600})
      res.status(200).json(finalData)
    } else {
      res.status(200).json("No JSON body passed, no token searched.")
    }
  } else {
    res.status(401).json("Endpoint forbidden")
  }
})

setInterval(async () => {
  const date = new Date();
  console.log(`Current hour: ${date.getHours()}`)
  if (date.getHours() < 5 || date.getHours() >= 15) {  
    serverHelper.search(redisClient)
  } else {
    console.log("Out of hours!")
  }
}, 300000);

setInterval(async () => {
  const date = new Date();
  console.log(`Current hour: ${date.getHours()}`)
  if (date.getHours() >= 14) {  
    serverHelper.getInjuryInfo(redisClient)
  } else {
    console.log("Out of hours!")
  }
}, 72000);

const port = process.env.PORT || 8081;
app.listen(port);

console.log(`DK Cacher listening on ${port}`);