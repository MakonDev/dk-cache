require('dotenv').config()
const axios = require("axios");
var moment = require('moment-timezone');
const jsdom = require("jsdom");
const { JSDOM } = jsdom;

// Points, Rebounds, Assists, Threes, Combos, Blocks/Steal ("Blocks ", "Steals ", "Steals + Blocks"), Turnovers
const gameCategoriesWeWant = [1215, 1216, 1217, 1218, 583, 1219, 1220]
const blocksStealsNames = ["Blocks ", "Steals ", "Steals + Blocks"]
const comboSubcategoryNames = ["Pts + Reb + Ast","Pts + Reb","Pts + Ast","Ast + Reb"]

function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

const assemblePlayerAverages = async () => {
  const pages = [1,2,3,4,5]
  let players = []

  for (const page of pages) {
    const url = `https://basketball.realgm.com/nba/stats/2023/Averages/All/points/All/desc/${page}/Last_5_Games`
    const resp = await axios.get(url)
    const dom = new JSDOM(resp.data)
    //const tbodys = Array.from(dom.window.document.querySelectorAll('tbody'))
    const table = dom.window.document.evaluate("/html/body/div[2]/div[3]/div/table", dom.window.document, null, 9, null).singleNodeValue
    const table_rows = Array.from(table.querySelectorAll(`tr`))
    table_rows.forEach((row) => {
      let player = {}
      const tds = Array.from(row.querySelectorAll('td'))
      for (const index of [...Array(tds.length).keys()]) {
        if (index === 1) {
          try {
            player["name"] =  tds[index].textContent
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 5) {
          try {
            player["points"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 9) {
          try {
            player["threes"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 17) {
          try {
            player["rebounds"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 18) {
          try {
            player["assists"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 19) {
          try {
            player["steals"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 20) {
          try {
            player["blocks"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 21) {
          try {
            player["turnovers"] = Number(tds[index].textContent)
          } catch (e) {
            console.log(e)
            continue
          }
        } else if (index === 2) {
          try {
            //use for other stuff
            player["bs"] = Number((Number(tds[19].textContent) + Number(tds[20].textContent)).toFixed(2))
            player["pra"] = Number((Number(tds[5].textContent) + Number(tds[17].textContent) + Number(tds[18].textContent)).toFixed(2))
            player["pr"] = Number((Number(tds[5].textContent) + Number(tds[18].textContent)).toFixed(2))
            player["pa"] = Number((Number(tds[5].textContent) + Number(tds[17].textContent)).toFixed(2))
            player["ar"] = Number((Number(tds[17].textContent) + Number(tds[18].textContent)).toFixed(2))
          } catch (e) {
            // console.log(e)
            continue
          }
        }
      }
      if (
        Object.keys(player).includes("name") &&
        Object.keys(player).includes("points") &&
        Object.keys(player).includes("assists") &&
        Object.keys(player).includes("rebounds") &&
        Object.keys(player).includes("threes") &&
        Object.keys(player).includes("steals") &&
        Object.keys(player).includes("blocks") &&
        Object.keys(player).includes("turnovers") &&
        Object.keys(player).includes("bs") &&
        Object.keys(player).includes("pra") &&
        Object.keys(player).includes("pr") &&
        Object.keys(player).includes("pa") &&
        Object.keys(player).includes("ar") 
        // !players.filter((singlePlayer) => singlePlayer.name)
      ) {
        // console.log(`Player: ${Object.keys(player)}`)
        players.push(player)
      }
    })
  }
  console.log(`Done with ${players.length} players.`)
  return players
}

const searchDKForEvents = async () => {
  const url = 'https://sportsbook-us-nh.draftkings.com//sites/US-NH-SB/api/v5/eventgroups/42648?format=json'
    
  let resp = []
  await axios.get(url)
  .then((response) => {
    resp = response.data.eventGroup.events
  }).catch((error) => {
    console.error("Error retrieving events: ", error)
  });

  return resp
}

const searchDKEventForProps = async (eventID) => {
  const url = `https://sportsbook-us-nh.draftkings.com//sites/US-NH-SB/api/v3/event/${eventID}?format=json`

  let resp = []
  await axios.get(url)
  .then((response) => {
    resp = response.data
  }).catch((error) => {
    console.error("Error retrieving single event: ", error)
  });

  return resp
}

module.exports = {
  registerETRStuff: async function(chunkedETRData, propData, client, avgData) {
    // do the finalData combinations
    let finalData = []
    for (const playerChunk of chunkedETRData) {
      let playerChunkData = {}
      playerChunkData["player"] = playerChunk.player
      playerChunkData["team1"] = playerChunk.team1
      playerChunkData["team2"] = playerChunk.team2
      playerChunkData["minutes"] = playerChunk.minutes

      // average data
      const averagePlayerData = avgData.find((player) => player.name.toUpperCase() === playerChunk.player.toUpperCase())

      // points
      let playerCategoryData = propData.points.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["points"] = {
          projection: Number(playerChunk.points),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.points : -1
        }
      } else {
        playerChunkData["points"] = {
          projection: Number(playerChunk.points),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.points : -1
        }
      }
      // assists
      playerCategoryData = propData.assists.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["assists"] = {
          projection: Number(playerChunk.assists),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.assists : -1
        }
      } else {
        playerChunkData["assists"] = {
          projection: (playerChunk.assists),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.assists : -1
        }
      }
      // threes
      playerCategoryData = propData.threes.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["threes"] = {
          projection: Number(playerChunk.threes),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.threes : -1
        }
      } else {
        playerChunkData["threes"] = {
          projection: Number(playerChunk.threes),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.threes : -1
        }
      }
      // rebounds
      playerCategoryData = propData.rebounds.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["rebounds"] = {
          projection: Number(playerChunk.rebounds),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.rebounds : -1
        }
      } else {
        playerChunkData["rebounds"] = {
          projection: Number(playerChunk.rebounds),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.rebounds : -1
        }
      }
      // turnovers
      playerCategoryData = propData.turnovers.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["turnovers"] = {
          projection: Number(playerChunk.turnovers),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.turnovers : -1
        }
      } else {
        playerChunkData["turnovers"] = {
          projection: Number(playerChunk.turnovers),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.turnovers : -1
        }
      }
      // blocks
      playerCategoryData = propData.blocks.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["blocks"] = {
          projection: Number(playerChunk.blocks),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.blocks : -1
        }
      } else {
        playerChunkData["blocks"] = {
          projection: Number(playerChunk.blocks),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.blocks : -1
        }
      }
      // steals
      playerCategoryData = propData.steals.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["steals"] = {
          projection: Number(playerChunk.steals),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.steals : -1
        }
      } else {
        playerChunkData["steals"] = {
          projection: Number(playerChunk.steals),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.steals : -1
        }
      }
      // blocksNsteals
      playerCategoryData = propData.blocksNsteals.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["blocksNsteals"] = {
          projection: (Number(playerChunk.steals) + Number(playerChunk.blocks)).toFixed(2),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.bs : -1
        }
      } else {
        playerChunkData["blocksNsteals"] = {
          projection: (Number(playerChunk.steals) + Number(playerChunk.blocks)).toFixed(2),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.bs : -1
        }
      }
      // PRA
      playerCategoryData = propData.PRA.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["PRA"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.assists) + Number(playerChunk.rebounds)).toFixed(2),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.pra : -1
        }
      } else {
        playerChunkData["PRA"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.assists) + Number(playerChunk.rebounds)).toFixed(2),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.pra : -1
        }
      }
      // PR
      playerCategoryData = propData.PR.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["PR"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.rebounds)).toFixed(2),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.pr : -1
        }
      } else {
        playerChunkData["PR"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.rebounds)).toFixed(2),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.pr : -1
        }
      }
      // PA
      playerCategoryData = propData.PA.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["PA"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.assists)).toFixed(2),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.pa : -1
        }
      } else {
        playerChunkData["PA"] = {
          projection: (Number(playerChunk.points) + Number(playerChunk.assists)).toFixed(2),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.pa : -1
        }
      }
      // AR
      playerCategoryData = propData.AR.filter((line) => line.player.toUpperCase() === playerChunk.player.toUpperCase())
      if (playerCategoryData.length > 0) {
        playerChunkData["AR"] = {
          projection: (Number(playerChunk.assists) + Number(playerChunk.rebounds)).toFixed(2),
          line: Number(playerCategoryData[0].outcomes[0].line),
          overOdds: playerCategoryData[0].outcomes[0].odds,
          underOdds: playerCategoryData[0].outcomes[1].odds,
          date: playerCategoryData[0].date,
          average: averagePlayerData ? averagePlayerData.ar : -1
        }
      } else {
        playerChunkData["AR"] = {
          projection: (Number(playerChunk.assists) + Number(playerChunk.rebounds)).toFixed(2),
          line: -1,
          overOdds: "N/A",
          underOdds: "N/A",
          date: "N/A",
          average: averagePlayerData ? averagePlayerData.ar : -1
        }
      }
      finalData.push(playerChunkData)
    }
    console.log(`Done with ${finalData.length} final data points`)
    await client.set("finaldata", JSON.stringify(finalData), {'EX': 42000})
    return finalData
  },
  search: async function(client) {
    const dkEvents = await searchDKForEvents()
    const filteredEvents = dkEvents.map((event) => {
      return (
        {
          id: event.eventId,
          name: `${event.teamShortName1} @ ${event.teamShortName2}`,
          date: event.startDate
        }
      )
    })
    let propData = {
      turnovers: [],
      points: [],
      rebounds: [],
      assists: [],
      threes: [],
      blocks: [],
      steals: [],
      blocksNsteals: [],
      PRA: [],
      PR: [],
      PA: [],
      AR: []
    }
    for await (let event of filteredEvents) {
      const date = new Date(event.date.slice(0,23)+"Z")
      const time = date.getTime()
      const mom = moment(time).tz('America/New_York').format('YYYY-MM-DD HH:mm')
      const currentdate = new Date()
      const currenttime = date.getTime()
      console.log(mom)
      console.log(event.name)
      console.log("")
      if (moment(currenttime).tz('America/New_York').date() === moment(time).tz('America/New_York').date()) {
        const firstEvent = await searchDKEventForProps(event.id)
        const eventCategories = firstEvent.eventCategories
        for (let category of gameCategoriesWeWant) {
          const cat = eventCategories.filter((propType) => propType.categoryId === category)
          // turnovers
          if (category === 1220 && cat.length > 0) {
            if (cat[0].componentizedOffers.length > 0 && cat[0].componentizedOffers[0].offers) {
              const offers = cat[0].componentizedOffers[0].offers[0]
              const turnoverPropData = offers.map((offer) => {
                return (
                  {
                    player: offer.label.split(" Turnovers")[0],
                    open: offer.isOpen,
                    suspended: offer.isSuspended,
                    date: mom,
                    game: event.name,
                    team1: event.teamShortName1,
                    team2: event.teamShortName2,
                    outcomes: [
                      {
                        label: offer.outcomes[0].label,
                        odds: offer.outcomes[0].oddsAmerican,
                        line: offer.outcomes[0].line
                      },
                      {
                        label: offer.outcomes[1].label,
                        odds: offer.outcomes[1].oddsAmerican,
                        line: offer.outcomes[1].line
                      }
                    ]
                  }
                )
              })
              propData.turnovers.push(turnoverPropData)
            }
          } 
          // points
          else if (category === 1215 && cat.length > 0) {
            if (cat[0].componentizedOffers.length > 0 && cat[0].componentizedOffers[0].offers) {
              const offers = cat[0].componentizedOffers[0].offers[0]
              const pointsPropData = offers.map((offer) => {
                return (
                  {
                    player: offer.label.split(" Points")[0],
                    open: offer.isOpen,
                    suspended: offer.isSuspended,
                    date: mom,
                    game: event.name,
                    team1: event.teamShortName1,
                    team2: event.teamShortName2,
                    outcomes: [
                      {
                        label: offer.outcomes[0].label,
                        odds: offer.outcomes[0].oddsAmerican,
                        line: offer.outcomes[0].line
                      },
                      {
                        label: offer.outcomes[1].label,
                        odds: offer.outcomes[1].oddsAmerican,
                        line: offer.outcomes[1].line
                      }
                    ]
                  }
                )
              })
              propData.points.push(pointsPropData)
            }
          }
          // rebounds
          else if (category === 1216 && cat.length > 0) {
            if (cat[0].componentizedOffers.length > 0 && cat[0].componentizedOffers[0].offers) {
              const offers = cat[0].componentizedOffers[0].offers[0]
              const reboundsPropData = offers.map((offer) => {
                return (
                  {
                    player: offer.label.split(" Rebounds")[0],
                    open: offer.isOpen,
                    suspended: offer.isSuspended,
                    date: mom,
                    game: event.name,
                    team1: event.teamShortName1,
                    team2: event.teamShortName2,
                    outcomes: [
                      {
                        label: offer.outcomes[0].label,
                        odds: offer.outcomes[0].oddsAmerican,
                        line: offer.outcomes[0].line
                      },
                      {
                        label: offer.outcomes[1].label,
                        odds: offer.outcomes[1].oddsAmerican,
                        line: offer.outcomes[1].line
                      }
                    ]
                  }
                )
              })
              propData.rebounds.push(reboundsPropData)
            }
          }
          // assists
          else if (category === 1217 && cat.length > 0) {
            if (cat[0].componentizedOffers.length > 0 && cat[0].componentizedOffers[0].offers) {
              const offers = cat[0].componentizedOffers[0].offers[0]
              const assistsPropData = offers.map((offer) => {
                return (
                  {
                    player: offer.label.split(" Assists")[0],
                    open: offer.isOpen,
                    suspended: offer.isSuspended,
                    date: mom,
                    game: event.name,
                    team1: event.teamShortName1,
                    team2: event.teamShortName2,
                    outcomes: [
                      {
                        label: offer.outcomes[0].label,
                        odds: offer.outcomes[0].oddsAmerican,
                        line: offer.outcomes[0].line
                      },
                      {
                        label: offer.outcomes[1].label,
                        odds: offer.outcomes[1].oddsAmerican,
                        line: offer.outcomes[1].line
                      }
                    ]
                  }
                )
              })
              propData.assists.push(assistsPropData)
            }
          }
          // threes
          else if (category === 1218 && cat.length > 0) {
            if (cat[0].componentizedOffers.length > 0 && cat[0].componentizedOffers[0].offers) {
              const offers = cat[0].componentizedOffers[0].offers[0]
              const threesPropData = offers.map((offer) => {
                return (
                  {
                    player: offer.label.split(" Three Pointers Made")[0],
                    open: offer.isOpen,
                    suspended: offer.isSuspended,
                    date: mom,
                    game: event.name,
                    team1: event.teamShortName1,
                    team2: event.teamShortName2,
                    outcomes: [
                      {
                        label: offer.outcomes[0].label,
                        odds: offer.outcomes[0].oddsAmerican,
                        line: offer.outcomes[0].line
                      },
                      {
                        label: offer.outcomes[1].label,
                        odds: offer.outcomes[1].oddsAmerican,
                        line: offer.outcomes[1].line
                      }
                    ]
                  }
                )
              })
              propData.threes.push(threesPropData)
            }
          }
          // blocks, steals and blocks + steals
          else if (category === 1219 && cat.length > 0) {
            for (let subcatName of blocksStealsNames) {
              const subcat = cat[0].componentizedOffers.filter((offer) => offer.subcategoryName === subcatName)
              const offers = subcat[0].offers[0]
              if (subcatName === "Blocks ") {
                const blocksPropData = offers.map((offer) => {
                  return (
                    {
                      player: offer.label.split(" Blocks")[0],
                      open: offer.isOpen,
                      suspended: offer.isSuspended,
                      date: mom,
                      game: event.name,
                      team1: event.teamShortName1,
                      team2: event.teamShortName2,
                      outcomes: [
                        {
                          label: offer.outcomes[0].label,
                          odds: offer.outcomes[0].oddsAmerican,
                          line: offer.outcomes[0].line
                        },
                        {
                          label: offer.outcomes[1].label,
                          odds: offer.outcomes[1].oddsAmerican,
                          line: offer.outcomes[1].line
                        }
                      ]
                    }
                  )
                })
                propData.blocks.push(blocksPropData)
              }
              else if (subcatName === "Steals ") {
                const stealsPropData = offers.map((offer) => {
                  return (
                    {
                      player: offer.label.split(" Steals")[0],
                      open: offer.isOpen,
                      suspended: offer.isSuspended,
                      date: mom,
                      game: event.name,
                      team1: event.teamShortName1,
                      team2: event.teamShortName2,
                      outcomes: [
                        {
                          label: offer.outcomes[0].label,
                          odds: offer.outcomes[0].oddsAmerican,
                          line: offer.outcomes[0].line
                        },
                        {
                          label: offer.outcomes[1].label,
                          odds: offer.outcomes[1].oddsAmerican,
                          line: offer.outcomes[1].line
                        }
                      ]
                    }
                  )
                })
                propData.steals.push(stealsPropData)
              }
              else if (subcatName === "Steals + Blocks") {
                const stealsNblocksPropData = offers.map((offer) => {
                  return (
                    {
                      player: offer.label.split(" Steals + Blocks")[0],
                      open: offer.isOpen,
                      suspended: offer.isSuspended,
                      date: mom,
                      game: event.name,
                      team1: event.teamShortName1,
                      team2: event.teamShortName2,
                      outcomes: [
                        {
                          label: offer.outcomes[0].label,
                          odds: offer.outcomes[0].oddsAmerican,
                          line: offer.outcomes[0].line
                        },
                        {
                          label: offer.outcomes[1].label,
                          odds: offer.outcomes[1].oddsAmerican,
                          line: offer.outcomes[1].line
                        }
                      ]
                    }
                  )
                })
                propData.blocksNsteals.push(stealsNblocksPropData)
              }
            }
          }
          // Combos
          else if (category === 583 && cat.length > 0) {
            for (let subcatName of comboSubcategoryNames) {
              const subcat = cat[0].componentizedOffers.filter((offer) => offer.subcategoryName === subcatName)
              if (subcat.length > 0) {
                const offers = subcat[0].offers[0]
                if (subcatName === "Pts + Reb + Ast") {
                  const blocksPropData = offers.map((offer) => {
                    return (
                      {
                        player: offer.label.split(" Points + Assists + Rebounds")[0],
                        open: offer.isOpen,
                        suspended: offer.isSuspended,
                        date: mom,
                        game: event.name,
                        team1: event.teamShortName1,
                        team2: event.teamShortName2,
                        outcomes: [
                          {
                            label: offer.outcomes[0].label,
                            odds: offer.outcomes[0].oddsAmerican,
                            line: offer.outcomes[0].line
                          },
                          {
                            label: offer.outcomes[1].label,
                            odds: offer.outcomes[1].oddsAmerican,
                            line: offer.outcomes[1].line
                          }
                        ]
                      }
                    )
                  })
                  propData.PRA.push(blocksPropData)
                }
                else if (subcatName === "Pts + Reb") {
                  const stealsPropData = offers.map((offer) => {
                    return (
                      {
                        player: offer.label.split(" Points + Rebounds")[0],
                        open: offer.isOpen,
                        suspended: offer.isSuspended,
                        date: mom,
                        game: event.name,
                        team1: event.teamShortName1,
                        team2: event.teamShortName2,
                        outcomes: [
                          {
                            label: offer.outcomes[0].label,
                            odds: offer.outcomes[0].oddsAmerican,
                            line: offer.outcomes[0].line
                          },
                          {
                            label: offer.outcomes[1].label,
                            odds: offer.outcomes[1].oddsAmerican,
                            line: offer.outcomes[1].line
                          }
                        ]
                      }
                    )
                  })
                  propData.PR.push(stealsPropData)
                }
                else if (subcatName === "Pts + Ast") {
                  const stealsNblocksPropData = offers.map((offer) => {
                    return (
                      {
                        player: offer.label.split(" Points + Assists")[0],
                        open: offer.isOpen,
                        suspended: offer.isSuspended,
                        date: mom,
                        game: event.name,
                        team1: event.teamShortName1,
                        team2: event.teamShortName2,
                        outcomes: [
                          {
                            label: offer.outcomes[0].label,
                            odds: offer.outcomes[0].oddsAmerican,
                            line: offer.outcomes[0].line
                          },
                          {
                            label: offer.outcomes[1].label,
                            odds: offer.outcomes[1].oddsAmerican,
                            line: offer.outcomes[1].line
                          }
                        ]
                      }
                    )
                  })
                  propData.PA.push(stealsNblocksPropData)
                }
                else if (subcatName === "Ast + Reb") {
                  const stealsNblocksPropData = offers.map((offer) => {
                    return (
                      {
                        player: offer.label.split(" Assists + Rebounds")[0],
                        open: offer.isOpen,
                        suspended: offer.isSuspended,
                        date: mom,
                        game: event.name,
                        team1: event.teamShortName1,
                        team2: event.teamShortName2,
                        outcomes: [
                          {
                            label: offer.outcomes[0].label,
                            odds: offer.outcomes[0].oddsAmerican,
                            line: offer.outcomes[0].line
                          },
                          {
                            label: offer.outcomes[1].label,
                            odds: offer.outcomes[1].oddsAmerican,
                            line: offer.outcomes[1].line
                          }
                        ]
                      }
                    )
                  })
                  propData.AR.push(stealsNblocksPropData)
                }
              }
            }
          }
        }
      } else {
        console.log(`Date of the game is for tomorrow! ${moment(time).tz('America/New_York').format('YYYY-MM-DD HH:mm')}`)
      }
    }

    // flatten turnovers
    let flatArray = [].concat(...propData.turnovers);
    propData.turnovers = flatArray

    // flatten points
    flatArray = [].concat(...propData.points);
    propData.points = flatArray

    // flatten rebounds
    flatArray = [].concat(...propData.rebounds);
    propData.rebounds = flatArray

    // flatten assists
    flatArray = [].concat(...propData.assists);
    propData.assists = flatArray

    // flatten threes
    flatArray = [].concat(...propData.threes);
    propData.threes = flatArray

    // flatten blocks
    flatArray = [].concat(...propData.blocks);
    propData.blocks = flatArray

    // flatten steals
    flatArray = [].concat(...propData.steals);
    propData.steals = flatArray

    // flatten blocks and steals
    flatArray = [].concat(...propData.blocksNsteals);
    propData.blocksNsteals = flatArray

    // flatten PRA
    flatArray = [].concat(...propData.PRA);
    propData.PRA = flatArray

    // flatten PR
    flatArray = [].concat(...propData.PR);
    propData.PR = flatArray

    // flatten AR
    flatArray = [].concat(...propData.AR);
    propData.AR = flatArray

    // flatten PA
    flatArray = [].concat(...propData.PA);
    propData.PA = flatArray

    await client.set("propdata", JSON.stringify(propData), {'EX': 42000})
    console.log("Done!")
    return propData
  },
  assemblePlayerAverages
}