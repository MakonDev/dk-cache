require('dotenv').config()
const axios = require("axios");
const puppeteer = require('puppeteer');

// Points, Rebounds, Assists, Threes, Combos, Blocks/Steal ("Blocks ", "Steals ", "Steals + Blocks"), Turnovers
const gameCategoriesWeWant = [1215, 1216, 1217, 1218, 583, 1219, 1220]
const blocksStealsNames = ["Blocks ", "Steals ", "Steals + Blocks"]
const comboSubcategoryNames = ["Pts + Reb + Ast","Pts + Reb","Pts + Ast","Ast + Reb"]

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
  etrSearch: async function() {
    const chunkedETRData = await searchForETRProjections()
    return chunkedETRData
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
      console.log(event.name)
      console.log(date.toLocaleString())
      console.log("")
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
                  date: date.toLocaleString(),
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
                  date: date.toLocaleString(),
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
                  date: date.toLocaleString(),
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
                  date: date.toLocaleString(),
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
                  date: date.toLocaleString(),
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
                    date: date.toLocaleString(),
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
                    date: date.toLocaleString(),
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
                    date: date.toLocaleString(),
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
                      date: date.toLocaleString(),
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
                      date: date.toLocaleString(),
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
                      date: date.toLocaleString(),
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
                      date: date.toLocaleString(),
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

    await client.set("propdata", JSON.stringify(propData), {'EX': 3600})
    console.log("Done!")
    return propData
  }
}