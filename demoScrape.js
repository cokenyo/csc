var path = require('path');
var fs = require("fs");
var demofile = require("demofile");
var createCsvWriter = require('csv-writer').createObjectCsvWriter;


const multikillBonus = [0, 0, .3, .7, 1.2, 2];
const clutchBonus = [0, .2, .6, 1.2, 2, 3];

const teamAlias = {
  "Outlaws-CSC": "Outlaws",
  "CSC Andromeda": "Andromeda",
  "GME King": "King",
  "bETTER king": "King",
  "CSC Gorillas": "Gorillas",
  "Gorillas CSC2": "Gorillas",
  "Desperados CSC": "Desperados",
  "Milky Way": "Milky Way",
  "CSC Orangutans": "Orangutans",
  "Spartans CSC": "Spartans",
  "GME Queen": "Queen",
  "CSC Samurai": "Samurai"
};



var masterLog = {};
var masterArr = [];
var demos = 0;
var demosDone = 0;
var highlightLog = [];


//var kills;
//var path = "test"



//const directoryPath = path.join(__dirname, 'Documents');

/*
ct vs t

entries
exits
chasing/hunting
economy tracking
clutch factor
opening duels
kills on won rounds
KAST percentage
bomb plants

kill weighting
assisted kills .7
entries and opening kills x2.5, x2
trades .8
postplant
  retakes 1.3
  site defense 1.1
post wincon
  exit .6
  chases 1.1

*K/R
*D/R
*ADR
KAST
IMPACT
 Clutch: 1v1C 1v2C 1v3C 1v4C 1v5C
 Opening Duels: OKW OKL
 Entries: EW EL
 Multikills: 2K 3K 4K 5K
 Kills on won rounds
 Economic Damage
 Kill values

 ImpactPoints = killpoints + bonuses
 ImpactRating = impact points/(totalpoints/10) + opening duel rate/.5 + winpoints/(totalpoints/10) + utility   30 + 10 + 50 + 10
 Impact = (kill values + bonuses) + 



KR .35
DR .07
ADR .2
KAST .08
IMPACT .3




---Future
Utility Rating (HE damage/Money spent on HEs, Util used or saved/Util, Util Picked up/avg, EF/F used, EF/EF avg, UD/UD avg, util used per round/avg, HE avg dmg/avg HE avg dmg)
Contribution Rate (Rounds with a Kill, Flash Assist, or Assist)

*/

fs.readdir(__dirname, function (err, files) {
    //handling error
    if (err) {
        return console.log('Unable to scan directory: ' + err);
    } 
    //listing all files using forEach
    files.forEach(function (file) {
      //continue if isnt .dem
      if (file.split('.').pop() == 'dem') {
        console.log("this is a demo file");
        demos += 1;
      }
      else
        return;

      const csvWriter = createCsvWriter({
          path: ('test' + '.csv'),
          header: [
              //{id: 'ind', title: 'ClientID'},
              {id: 'mID', title: "m_ID"},
              {id: 'map', title: 'Map'},
              {id: 'team', title: 'Team'},
              {id: 'name', title: 'Name'},
              {id: 'rating', title: 'Rating'},
              {id: 'kills', title: 'Kills'},
              {id: 'assists', title: 'Assists'},
              {id: 'deaths', title: 'Deaths'},
              {id: 'kr', title: 'K/R'},
              //{id: 'kd', title: 'K/D'},
              {id: 'adr', title: 'ADR'},
              {id: 'ud', title: 'UD'},
              {id: 'ef', title: 'EF'},
              {id: 'f_ass', title: 'F_Assists'},
              {id: 'hs', title: 'HS'},
              {id: 'kastr', title: 'KAST'},
              {id: 'awp', title: 'AWP_K'},
              {id: '_2k', title: '2k'},
              {id: '_3k', title: '3k'},
              {id: '_4k', title: '4k'},
              {id: '_5k', title: '5k'},
              {id: 'cl_1', title: '1v1'},
              {id: 'cl_2', title: '1v2'},
              {id: 'cl_3', title: '1v3'},
              {id: 'cl_4', title: '1v4'},
              {id: 'cl_5', title: '1v5'},
              {id: 'ok', title: 'F_Kills'},
              {id: 'ol', title: 'F_Deaths'},
              {id: 'entries', title: 'Entries'},
              {id: 'tradeKills', title: 'Trades'},
              //{id: 'ef', title: 'EF'},
              //{id: 'hs', title: 'HS_Kills'},
              {id: 'rounds', title: 'Rounds'},
              {id: 'rf', title: 'RF'},
              {id: 'ra', title: 'RA'},
              {id: 'damage', title: 'Damage'},
              //{id: 'ar', title: 'A/R'}//,
              /*
              {id: 'okw', title: 'OKW'},
              {id: 'okl', title: 'OKL'},
              {id: 'ar', title: 'A/R'}
              */
          ]
      });

      var stats = new Array();
      var roundStats = {};
      var liveStats = {};
      var totalStats = {};
      var players = new Array();
      var tradeQ = new Array();
      var openingKill = true;
      var prePlant = true;
      var postPlant = false;
      var postWinCon = false;
      var clutch;
      //var tClutch;
      //var ctClutch;
      //var tAlive;
      //var ctAlive;
      var tMoney;
      var roundWinner;
      var roundWinnerTeamName;
      var roundLoserTeamName;
      var currRound;
      var warmup = true;
      var warmup2 = true;
      var warmup3 = true;
      var teamNameFix = false;
      var teamTrackerBool = true;
      var planter;
      var playersTracked = false;
      var errLog = "";
      var liveTeams = {};
      var punkKills = 0;
      var valveKills = 0;
      var knifeCheck = true;
      var teamNameTrack = {};

      //const tradeCutoff = 4 * demofile.tickRate; //number of ticks that a trade must happen in to be considered a trade



      fs.readFile((file), (err, buffer) => {
        const demoFile = new demofile.DemoFile();

        function warmupEnd() {
          //console.log(warmup);
          warmup = false;
          //console.log(warmup);

          console.log("Warmup has Ended.");
        }

        //last round game event is "end"
        function logTeamScores() {
            const teams = demoFile.teams;
            const terrorists = teams[2 /* Terrorists */];
            const cts = teams[3 /* CounterTerrorists */];
            console.log(
              "\t%s: %s score %d\n\t%s: %s score %d",
              terrorists.teamName,
              terrorists.clanName,
              terrorists.score,
              cts.teamName,
              cts.clanName,
              cts.score
            );

            
          }
          /*
          function logFinalScores() {
            const teams = demoFile.teams;
            const ts = teams[2 ];
            const cts = teams[3 ];

            stats.forEach((element) => {
              //console.log(element['team'] + ts.clanName);
              if (element['map'] != null)
                return;

              if (element['team'] == ts.clanName)
                element['rf'] = ts.score;
              else
                element['rf'] = cts.score;
              element['rounds'] = ts.score + cts.score;

              if (demoFile.entities.playerResource.props.m_iKills[element['ind']] > 0) //kills
                element['kills'] = demoFile.entities.playerResource.props.m_iKills[element['ind']];
              
              if (demoFile.entities.playerResource.props.m_iAssists[element['ind']] > 0) //assists
                element['assists'] = demoFile.entities.playerResource.props.m_iAssists[element['ind']];

              if (demoFile.entities.playerResource.props.m_iDeaths[element['ind']] > 0) //deaths
                element['deaths'] = demoFile.entities.playerResource.props.m_iDeaths[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_Damage_Total[element['ind']] > 0) //damage
                element['damage'] = demoFile.entities.playerResource.props.m_iMatchStats_Damage_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_UtilityDamage_Total[element['ind']] > 0) //ud
                element['ud'] = demoFile.entities.playerResource.props.m_iMatchStats_UtilityDamage_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_EnemiesFlashed_Total[element['ind']] > 0) //ef
                element['ef'] = demoFile.entities.playerResource.props.m_iMatchStats_EnemiesFlashed_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_HeadShotKills_Total[element['ind']] > 0) //hs
                element['hs'] = demoFile.entities.playerResource.props.m_iMatchStats_HeadShotKills_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_3k_Total[element['ind']] > 0) //3k
                element['_3k'] = demoFile.entities.playerResource.props.m_iMatchStats_3k_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_4k_Total[element['ind']] > 0) //4k
                element['_4k'] = demoFile.entities.playerResource.props.m_iMatchStats_4k_Total[element['ind']];

              if (demoFile.entities.playerResource.props.m_iMatchStats_5k_Total[element['ind']] > 0) //5k
                element['_5k'] = demoFile.entities.playerResource.props.m_iMatchStats_5k_Total[element['ind']];

            });
            
          }*/

          function sumObject(orb) {
            var sum = 0;
            for (let [key, value] of Object.entries(orb)) {
              sum += value;
            }
            return sum;
          }

          function compare(a, b) {
            if (a.damage > b.damage)
              return -1;
            else if (a.damage < b.damage)
              return 1;
            else
              return 0;
          }

          function updateAlive() {
            clutch.terr.alive = 0;
            clutch.cterr.alive = 0;
            demoFile.teams[2].members.forEach((element, index) => {
              if (element && element.isAlive)
                clutch.terr.alive += 1;
            })
            demoFile.teams[3].members.forEach((element, index) => {
              if (element && element.isAlive)
                 clutch.cterr.alive += 1;
            })
          }

          function insertData(data, target) {
            target.push(data);
          }

          /*
          function deriveFields() {
            stats.forEach((element) => {
              if (element['map'] != null)
                return;
              element['adr'] = Math.round(element['damage']/element['rounds']);
              element['kr'] = (element['kills'] / element['rounds']).toFixed(2);
              element['ar'] = (element['assists'] / element['rounds']).toFixed(2);
              element['kd'] = (element['kills'] / element['deaths']).toFixed(2);
              element['ra'] = element['rounds'] - element['rf'];
              //element['rating'] = ().toFixed(2);
              element['hsP'] = (element['hs'] / element['kills']).toFixed(2) * 100;
              if (isNaN(element['hsP']))
                element['hsP'] = 0;

            });
          }*/


          function addPlayer(newBoi) {
            var mapName = (demoFile.header.mapName).slice(3);
            var editedName = mapName.charAt(0).toUpperCase() + mapName.slice(1);

            if (!liveStats[newBoi.name]) {
              console.log("adding to live stats:" + newBoi.name);
              liveStats[newBoi.name] = {
                mID: demoFile.header.playbackTicks,
                map: editedName,
                team: newBoi.team.clanName,
                name: newBoi.name, 
                kills: 0,
                assists: 0,
                deaths: 0,
                damage: 0,
                ud: 0,
                ef: 0,
                f_ass: 0,
                hs: 0,
                rounds: 0,
                rf: 0,
                _2k: 0,
                _3k: 0,
                _4k: 0,
                _5k: 0,
                cl_1: 0,
                cl_2: 0,
                cl_3: 0,
                cl_4: 0,
                cl_5: 0,
                ok: 0,
                ol: 0,
                tradeKills: 0,
                awp: 0,
                deag: 0,
                knife: 0,
                kastRounds: 0,
                killPoints: 0,
                impactPoints: 0,
                winPoints: 0,
                adr: 0,
                kr: 0,
                ar: 0,
                kd: 0,
                ra: 0,
                impactRating: 0,
                rating: 0,
                fallDmg: 0,//
                teamDmg: 0,//
                jumps: 0,//
                bombPlants: 0,//
                //pistolHSKills: 0, //pistols: glock, p2k, hkp2000, deagle, tec9, p250, fiveseven, uspS/nonS, cz, r8, 
                blindKills: 0,//
                ping: 0,//
                entries: 0,//
                dinks: 0,//
                gamesPlayed: 0
              };
              //console.log("reeeeee:" + newBoi.team.clanName + " " + newBoi.name);
            }
            else {
              liveStats[newBoi.name].team = newBoi.team.clanName;
              liveStats[newBoi.name].name = newBoi.name;
              //console.log("RESTSETSETSETreeeeee:" + newBoi.team.clanName + " " + newBoi.name);
            }
          }

          function endMatch() {

            console.log("END MATCH");
            //console.log("Rating; Kills; ADR in 47 Rounds on Vertigo");

            var player = Object.keys(liveStats);

            //total stats reflect multiple peoples performances to normalize different values


            totalStats['impactRoundAvg'] = 0;
            //totalStats['winRoundAvg'] = 0;
            totalStats[liveStats[player[0]].team] = {winRoundAvg: 0, players: 0};
            totalStats[liveStats[player[5]].team] = {winRoundAvg: 0, players: 0};

            totalStats['killRoundAvg'] = 0;
            totalStats['deathRoundAvg'] = 0;
            totalStats['kastRoundAvg'] = 0;
            totalStats['adrAvg'] = 0;

            player.forEach((element) => {
              liveStats[element].adr = liveStats[element].damage/liveStats[element].rounds;
              totalStats['impactRoundAvg'] += liveStats[element].impactPoints / liveStats[element].rounds;

              totalStats[liveStats[element].team].winRoundAvg += liveStats[element].winPoints / liveStats[element].rounds;
              totalStats[liveStats[element].team].players += 1;

              //totalStats['winRoundAvg'] += liveStats[element].winPoints / liveStats[element].rounds;
              totalStats['killRoundAvg'] += liveStats[element].kills / liveStats[element].rounds;
              totalStats['deathRoundAvg'] += liveStats[element].deaths / liveStats[element].rounds;
              totalStats['kastRoundAvg'] += liveStats[element].kastRounds / liveStats[element].rounds;
              totalStats['adrAvg'] += liveStats[element].damage / liveStats[element].rounds;
            });

            var playerNum = player.length;

            totalStats['impactRoundAvg'] /= playerNum;
            //totalStats['winRoundAvg'] *= .1;
            totalStats['killRoundAvg'] /= playerNum;
            totalStats['deathRoundAvg'] /= playerNum;
            totalStats['kastRoundAvg'] /= playerNum;
            totalStats['adrAvg'] /= playerNum;

            player.forEach((element) => {
              var playerIPRAvg = liveStats[element].impactPoints/liveStats[element].rounds;
              var playerWPRAvg = liveStats[element].winPoints/liveStats[element].rounds;
              var playerKR = liveStats[element].kills/liveStats[element].rounds;
              var playerDR = liveStats[element].deaths/liveStats[element].rounds;
              var playerKASTR = liveStats[element].kastRounds/liveStats[element].rounds;
              var openingFactor = (liveStats[element].ok - liveStats[element].ol) / 13;// / (liveStats[element].ok+liveStats[element].ol);
              
              liveStats[element].impactRating = (.6*(playerIPRAvg/totalStats['impactRoundAvg'])
               + .3*(playerWPRAvg/(totalStats[liveStats[element].team].winRoundAvg/totalStats[liveStats[element].team].players)) + .1*(openingFactor + 1)).toFixed(2);

               //console.log(playerKR);
               //console.log(totalStats['killRoundAvg']);
              liveStats[element].kr = playerKR.toFixed(2);
              liveStats[element].kastr = playerKASTR.toFixed(2);
              liveStats[element].rating = (.3*(liveStats[element].impactRating) + .35*(playerKR/totalStats['killRoundAvg'])
               + .07*(totalStats['deathRoundAvg']/playerDR) + .08*(playerKASTR/totalStats['kastRoundAvg']) + .2*(liveStats[element].adr/totalStats['adrAvg'])).toFixed(2);
              //liveStats[element].rating = liveStats[element].rating.toFixed(2);
              liveStats[element].adr = Math.round(liveStats[element].adr);
              liveStats[element].ping = liveStats[element].ping/liveStats[element].rounds;
              liveStats[element].gamesPlayed += 1;

              //console.log(openingFactor);
              //console.log(element + " " + liveStats[element].impactRating);
              console.log(liveStats[element].rating + " " + liveStats[element].kills + " " + liveStats[element].adr + " " + element);
            });




          }

          function purgeValues() {

            const teams = demoFile.teams;
            const terrorists = teams[2 /* Terrorists */];
            const cts = teams[3 /* CounterTerrorists */];

            const tMem = terrorists.members;
            const ctMem = cts.members;
            const mems = [tMem, ctMem];


            //CHANGE IT TO OBJECT OF OBJECTS INSTEAD OF ARRAY OF OBJECTS

            mems.forEach((element, index) => {
              
              for (var i = element.length - 1; i >= 0; i--) {
                if (element[i]) {
                  if (!element[i].isFakePlayer)
                    addPlayer(element[i]);
                  
                  //console.log("Resetting stats:" + element[i].name);

                  var ind;
                  if (element[i].index < 10)
                    ind = '00' + (element[i].index);
                  else
                    ind = '0' + (element[i].index);


                  roundStats[element[i].name] = {
                    //team: element[i].team.clanName,
                    //round: currRound,
                    raw: {
                      killPoints: 0,
                      kills: 0,//
                      assists: 0,//
                      deaths: 0,//
                      damage: 0,
                      ud: 0,
                      ef: 0,
                      f_ass: 0,
                      hs: 0,//
                      awp: 0,//
                      deag: 0,//
                      knife: 0,
                      kastRounds: 0,
                      ok: 0,
                      ol: 0,
                      tradeKills: 0
                    },
                    derived: {
                      impactPoints: 0,
                      winPoints: 0
                    },
                    extra: {
                      //inspects: 0,//X
                      //flashes: 0,
                      fallDmg: 0,//
                      teamDmg: 0,//
                      jumps: 0,//
                      bombPlants: 0,//
                      //pistolHSKills: 0, //pistols: glock, p2k, hkp2000, deagle, tec9, p250, fiveseven, uspS/nonS, cz, r8, 
                      blindKills: 0,//
                      ping: demoFile.entities.playerResource.props.m_iPing[ind],//
                      entries: 0,//
                      dinks: 0//
                    },
                    cl: 0,//
                    teamNum: element[i].teamNumber,
                    health: 100,
                    index: ind,
                    isReal: !(element[i].isFakePlayer)
                  }
                }
                else {
                  errLog += "found a null player?";
                  console.log(mems);
                  console.log("what round is it anyways?");
                }

                /*
                insertData((element[i].name: {
                  team: element[i].team.clanName,
                  kills: 0,
                  assists: 0,
                  deaths: 0,
                  damage: 0,
                  ud: 0,
                  ef: 0,
                  hs: 0,
                  cl: 0,
                  awp: 0,
                  deag: 0,
                  knife: 0,
                  kast: 0,
                  killPoints: 0,
                  winPoints: 0}), roundStats); */
              }
            });

            
          }

          function endRound() {
            /*
            might be merged with above
            calculate multikill/clutch
            see who is still alive
            */

            if (teamNameFix) {
              
            }
            else {
              teamNameFix = true;
              console.log("ROUNDEND EVENT" + demoFile.teams[2].clanName + demoFile.teams[3].clanName);
              //console.log(demoFile.teams[3])
              liveTeams[demoFile.teams[2].clanName] = {score: 0, scoreAgainst: 0};
          liveTeams[demoFile.teams[3].clanName] = {score: 0, scoreAgainst: 0};

            }

            console.log(roundWinner);
            console.log(demoFile.teams[roundWinner].clanName);


            if (liveTeams[demoFile.teams[2].clanName]) {
                liveTeams[roundWinnerTeamName].score += 1;
                liveTeams[roundLoserTeamName].scoreAgainst += 1;

              }
            else {
              console.log(liveTeams);
            }
            //console.log(demoFile.teams[2]);
            console.log(" " + currRound + warmup + warmup2 + warmup3);
            //console.log("Live Score. " + liveTeams[demoFile.teams[2].clanName].score + " " + liveTeams[demoFile.teams[3].clanName].score);



            //console.log(demoFile.entities.playerResource.props.m_iKills);
            console.log("END ROUND: " + currRound);

            var player = Object.keys(roundStats);
            var data = Object.values(roundStats);
            //console.log(player);
            //console.log(data);

            player.forEach((element) => {
              //check KAST
              if (roundStats[element].isReal) {
                
                if (roundStats[element].raw.kills || roundStats[element].raw.assists || !roundStats[element].raw.deaths) {
                  roundStats[element].raw.kastRounds = 1;
                  if (element == "NotACop_")
                    console.log("NAC got KAST round.");
                }
      
                var rawKeys = Object.keys(roundStats[element].raw);
                var rawValues = Object.values(roundStats[element].raw)
  
                //add raw values
                for (var i = rawKeys.length - 1; i >= 0; i--) {
                  //console.log(element);
                  //console.log(file);
                  liveStats[element][rawKeys[i]] += rawValues[i];
                }
  
                var extraKeys = Object.keys(roundStats[element].extra);
                var extraValues = Object.values(roundStats[element].extra)
  
                //add raw values
                for (var i = extraKeys.length - 1; i >= 0; i--) {
  
                  liveStats[element][extraKeys[i]] += extraValues[i];
                }
  
  
  
  
                //add the clutch
                if (roundStats[element].cl) {
                  if (roundStats[element].cl > 2) {
                    var clutchS = "That's a big 1v" + roundStats[element].cl + " clutch by " + element;
                    highlightLog.push(file + " in round " + currRound + " " + clutchS);
                  }
                  var clKey = 'cl_' + roundStats[element].cl;
                  liveStats[element][clKey] += 1;
                  roundStats[element].derived.impactPoints += clutchBonus[roundStats[element].cl];
                }
                //add the multikill
                if (roundStats[element].raw.kills > 1) {
                  if (roundStats[element].raw.kills > 3) {
                    var multiS = "That's a big " + roundStats[element].raw.kills + "k by " + element;
                    console.log(multiS);
                    highlightLog.push(file + " in round " + currRound + " " + multiS);

                  }
                  else if (roundStats[element].raw.kills == 3 && (currRound == 1 || currRound == 16) && roundStats[element].raw.hs > 1) {
                    var hsNum = roundStats[element].raw.hs;
                    var multiS = "That's a big " + roundStats[element].raw.kills + "k by " + element + " during pistol with " + hsNum + " headshots.";
                    console.log(multiS);
                    highlightLog.push(file + " in round " + currRound + " " + multiS);
                  }

                  var muKey = '_' + roundStats[element].raw.kills + 'k';
                  liveStats[element][muKey] += 1;
                  roundStats[element].derived.impactPoints += multikillBonus[roundStats[element].raw.kills];
                }
  
                roundStats[element].derived.impactPoints += roundStats[element].raw.damage/250;
                roundStats[element].derived.impactPoints += roundStats[element].raw.killPoints;
  
                //determine win points and rounds won/lost
                if (roundWinner == roundStats[element].teamNum) {
                  roundStats[element].derived.winPoints += roundStats[element].derived.impactPoints;
                  liveStats[element].rf += 1;
                }
                else
                  liveStats[element].ra += 1;
  
                liveStats[element].impactPoints += roundStats[element].derived.impactPoints;
                liveStats[element].winPoints += roundStats[element].derived.winPoints;
                liveStats[element].rounds += 1;}



              //console.log(liveStats[element]);
            });

            /*
            roundStats.raw.forEach((element) => {
              keys = Object.keys(element);
              values = Object.values(element);
              console.log(keys);
              console.log(values);
              for (var i = keys.length - 1; i >= 0; i--) {
                if (keys[i] == 'clutch' && values[i]) {
                  var newKey = 'cl_' + values[i];
                }
                else if (keys[i] == 'kills' && values[i]) {
                  var newKey = '_' + values[i] + 'k';

                }

                console.log(values[i]);
                liveStats[element].keys[i] = values[i];
                //console.log(value[i]);
              }
            });
            */
          }


          function logFinal() {
            const teams = demoFile.teams;
            const terrorists = teams[2];
            const cts = teams[3];

            const tMem = terrorists.members;
            const ctMem = cts.members;
            const mems = [tMem, ctMem];

            mems.forEach((element, index) => {
              for (var i = element.length - 1; i >= 0; i--) {
              //var obj = {name: tMem[i].name};
              //var realID;
              var ind;
              //stats = {...stats, ...obj}

              //if (element[])

              if (element[i].index < 10)
                ind = '00' + (element[i].index);
              else
                ind = '0' + (element[i].index);

              //console.log(demoFile.entities.playerResource.props.m_iMatchStats_3k_Total);
              //console.log(realID);
              //console.log(element[i]);
              //console.log(element[i].name + element[i].index);
              //console.log(sumObject(element[i].props.m_iMatchStats_Kills));
              //console.log(demoFile.entities.playerResource.props.m_iKills[ind]);

              players.push({name: element[i].name, ind});

              insertData({
                ind: ind,
                //map: demoFile.header.mapName,
                team: element[i].team.clanName,
                name: element[i].name, 
                kills: demoFile.entities.playerResource.props.m_iKills[ind],
                assists: demoFile.entities.playerResource.props.m_iAssists[ind],
                deaths: demoFile.entities.playerResource.props.m_iDeaths[ind],
                damage: demoFile.entities.playerResource.props.m_iMatchStats_Damage_Total[ind],
                ud: demoFile.entities.playerResource.props.m_iMatchStats_UtilityDamage_Total[ind],
                ef: demoFile.entities.playerResource.props.m_iMatchStats_EnemiesFlashed_Total[ind],
                //hs: demoFile.entities.playerResource.props.m_iMatchStats_HeadShotKills_Total[ind],
                rounds: (element[i].team.score + ctMem[i].team.score), //issue here
                rf: element[i].team.score,
                _3k: demoFile.entities.playerResource.props.m_iMatchStats_3k_Total[ind],
                _4k: demoFile.entities.playerResource.props.m_iMatchStats_4k_Total[ind],
                _5k: demoFile.entities.playerResource.props.m_iMatchStats_5k_Total[ind],
                adr: -1,
                kr: -1,
                ar: -1,
                kd: -1,
                ra: -1,
                rating: -1,
                hsP: -1
              }, stats);
            }
            });

            //console.log(stats);

            stats.splice(5, 0, {map: demoFile.header.mapName, name: "--"});

            var statsA = stats.slice(0, 5).sort(compare);
            var statsC = stats.slice(6, 11).sort(compare);
            var statsB = stats[5];

            stats = statsA.concat(statsB).concat(statsC);

            console.log(stats);
            
          }
        demoFile.gameEvents.on("begin_new_match", e => { //at what points does this actually fire?
          console.log(warmup);
          if (!warmup) {
            

          }
            
            // We can't print the team scores here as they haven't been updated yet.
            // See round_officially_ended below.
        }); 

        
          demoFile.gameEvents.on("player_hurt", e => {
            if (!warmup3) {
              const victim = demoFile.entities.getByUserId(e.userid);
              const victimName = victim ? victim.name : "unnamed";

              // Attacker may have disconnected so be aware.
              // e.g. attacker could have thrown a grenade, disconnected, then that grenade
              // killed another player.
              const attacker = demoFile.entities.getByUserId(e.attacker);
              const attackerName = attacker ? attacker.name : "unnamed";
              var realDmg = 0;

              //console.log(`[dmg] ${attackerName} ${victimName} ${e.dmg_health} ${realDmg} ${e.health} ${e.weapon}`)
              //console.log(roundStats);
              //console.log(file);

              if (e.hitgroup === 1) //hs
                roundStats[attackerName].extra.dinks += 1;

              //overdamage
              if (victim && e.dmg_health > roundStats[victimName].health) {
                realDmg = roundStats[victimName].health;
              }
              else if (victim) {
                realDmg = e.dmg_health;
              }

              if (attacker) {
                if (attacker.teamNumber != victim.teamNumber) {
                  roundStats[attackerName].raw.damage += realDmg;
                  //hegrenade and inferno
                  if (e.weapon == 'hegrenade' || e.weapon == 'inferno') {
                    //add to UD
                    roundStats[attackerName].raw.ud += realDmg;
                  }
                }
                else //team damage
                  roundStats[attackerName].extra.teamDmg += realDmg;
              }
              else //universe damage inc bomb
                roundStats[victimName].extra.fallDmg += realDmg;
              
              roundStats[victimName].health -= realDmg;


              //console.log(`${e.weapon}`);

              //console.log(`${attackerName} [${e.weapon}] ${victimName}`);
              //console.log(`[dmg] ${attackerName} ${e.dmg_health} ${realDmg} ${e.health} ${roundStats[victimName].health} ${e.weapon}`)
            }
          });


         //if (demoFile.entities.gameRules.isWarmup()) {
          demoFile.gameEvents.on("player_death", e => {
            if (!warmup3) {
              const victim = demoFile.entities.getByUserId(e.userid);
              const victimName = victim ? victim.name : "unnamed";

              // Attacker may have disconnected so be aware.
              // e.g. attacker could have thrown a grenade, disconnected, then that grenade
              // killed another player.
              var attacker = demoFile.entities.getByUserId(e.attacker);
              const attackerName = attacker ? attacker.name : "unnamed";

              const headshotText = e.headshot ? " HS" : "";

              const assister = demoFile.entities.getByUserId(e.assister);
              const assisterName = assister ? assister.name : "noassist";

              var killValue;
              var trade = false;
              var multiplier = 1;

              //console.log(demoFile.entities.playerResource.props.m_iPing['003']);

              if (attacker && victim) {
                if (attacker.teamNumber == victim.teamNumber) {
                  attacker = false; //easy way to ignore giving the attack stats for the team kill
                }
              }

              //console.log(currRound);
              //console.log(victim);
              //console.log(victim.name);
              //keep track of total alive
              if (victim) {
                if (victim.teamNumber == 2) {
                  //terrorist died
                  //tAlive -= 1;
                  clutch.terr.alive -= 1;
                }
                else if (victim.teamNumber == 3) {
                  //ct died
                  //ctAlive -= 1;
                  clutch.cterr.alive -= 1;
                }
              }
              else {
                //someone DCd most likely
                //update ppl alive
                console.log("DC");
                updateAlive();
              }
              //console.log("tAlive:" + tAlive + "  ctAlive:" + ctAlive);
              //console.log("tAlive:" + clutch.terr.alive + "  ctAlive:" + clutch.cterr.alive);

              //check clutch start
              if (!postWinCon) {
                if (clutch.terr.alive == 1 && !clutch.terr.value) {
                  //Terrorist clutch
                  clutch.terr.value = clutch.cterr.alive;
                  demoFile.teams[2].members.forEach((element, index) => {
                    if (element.isAlive)
                      clutch.terr.person = element.name;
                  })
                }
                if (clutch.cterr.alive == 1 && !clutch.cterr.value) {
                  //CT clutch 
                  clutch.cterr.value = clutch.terr.alive;
                  demoFile.teams[3].members.forEach((element, index) => {
                    if (element.isAlive)
                      clutch.cterr.person = element.name;
                  })
                }  
              }

              //add to tradeQ to check for trades
              insertData({target: attackerName, time: demoFile.currentTime, tradedPlayer: victimName}, tradeQ);

              //console.log(clutch.terr.test);
              

              


              //base values
              if (attacker) {
                //console.log(attackerName + " " + victimName);
                if (attacker.flashDuration > 0) {
                  roundStats[attackerName].extra.blindKills += 1;
                  if (attacker.flashDuration > 3) {
                    var multiS = "Nice kill while flashed by " + attackerName;
                    console.log(multiS);
                    //highlightLog.push(file + " in round " + currRound + " " + multiS);
                  }
                }
                if (e.noscope) {
                    var multiS = "Nice noscope by " + attackerName;
                    console.log(multiS);
                    highlightLog.push(file + " in round " + currRound + " " + multiS);
                }
                if (e.penetrated) {
                    var multiS = "Nice wallbang by " + attackerName;
                    console.log(multiS);
                   // highlightLog.push(file + " in round " + currRound + " " + multiS);
                }

                if (prePlant) {
                //normal base value
                  if (attacker.teamNumber == 2) {
                    //taking site by T
                    killValue = 1.2;
                  }
                  if (attacker.teamNumber == 3) {
                    //site Defense by CT
                    killValue = 1;
                  }
                }
                else if (postPlant) {
                  //site D or retake
                  if (attacker.teamNumber == 2) {
                    //site Defense by T
                    killValue = 1;
                  }
                  if (attacker.teamNumber == 3) {
                    //retake
                    killValue = 1.2;
                  }
                }
                else if (postWinCon) {
                  //exit or chase
                  if (roundWinner == 2) { //Ts win
                    if (attacker.teamNumber == 2) //chase
                      killValue = .8;
                    if (attacker.teamNumber == 3) //exit
                      killValue = .6;
                  }
                  if (roundWinner == 3) { //CTs win
                    if (attacker.teamNumber == 2) //T kill in lost round
                      killValue = .5;
                    if (attacker.teamNumber == 3) //CT kill in won round
                      killValue = tMoney ? .6: .8;
                  }
                  
                }


                //modifiers

                if (openingKill) {
                  openingKill = false;
                  console.log("This was an OPENING KILL");
                  roundStats[attackerName].raw.ok += 1;
                  roundStats[victimName].raw.ol += 1;
                  
                  if (attacker.teamNumber == 2) {//T entry/opener {
                    multiplier += prePlant ? .8: .3;
                    if (prePlant) {
                      roundStats[attackerName].extra.entries += 1;
                    }
                  }
                  else if (attacker.teamNumber == 3) //CT opener
                    multiplier += .5;
                }
                else {
                  tradeQ.forEach((element, index) => {
                    //console.log(element['target'] + " " + victimName);
                    if (element['target'] == victimName && (element['time'] + 4 > demoFile.currentTime)) {
                      //console.log("TRADED");
                      trade = true;
                      roundStats[element['tradedPlayer']].raw.kastRounds = 1;
                      console.log(element['tradedPlayer'] + " GOT TRADED.");

                    }
                  })
                  if (trade) {
                    multiplier += .3;
                    roundStats[attackerName].raw.tradeKills += 1;
                  }
                }
                if (e.assistedflash && assister.teamNumber != victim.teamNumber) { //flash assisted kill
                  multiplier += .2;
                  roundStats[assisterName].raw.f_ass += 1;
                }
                if (assister && assister.teamNumber != victim.teamNumber) {//assisted kill
                  killValue -= .15;
                  roundStats[assisterName].raw.killPoints += .15;
                }

                killValue *= multiplier;



                var ecoRatio = victim.currentEquipmentValue/attacker.currentEquipmentValue;
                var ecoMod = 1;
                if (ecoRatio > 4)
                  ecoMod += .25;
                else if (ecoRatio > 2)
                  ecoMod += .14;
                else if (ecoRatio < .25)
                  ecoMod -= .25;
                else if (ecoRatio < .5)
                  ecoMod -= .14;
                killValue *= ecoMod;

                

                //console.log(roundStats);
                //console.log(attackerName);
                roundStats[attackerName].raw.kills += 1;
                
                
                if (e.headshot)
                  roundStats[attackerName].raw.hs += 1;
                roundStats[attackerName].raw.killPoints += killValue;
                if (e.weapon == 'awp')
                  roundStats[attackerName].raw.awp += 1;
                else if (e.weapon == 'deagle')
                  roundStats[attackerName].raw.deag += 1;
                else if (e.weapon == 'knife')
                  roundStats[attackerName].raw.knife += 1;
              }
              

              if (victim)
              roundStats[victimName].raw.deaths += 1;
              if (assister && assister.teamNumber != victim.teamNumber)
                roundStats[assisterName].raw.assists += 1;
              //console.log(roundStats[attackerName].kills);

              

              console.log(`${attackerName} [${e.weapon}${headshotText}] ${victimName}`);

              //console.log(`${victim.currentEquipmentValue} ${killValue} ${attackerName} ${victimName} ${assisterName} ${e.assistedflash} ${e.weapon} ${e.headshot}`)
            }
          });
        //}
        
          demoFile.gameEvents.on("player_blind", e => {
            const victim = demoFile.entities.getByUserId(e.userid);
            const victimName = victim ? victim.name : "unnamed";

            // Attacker may have disconnected so be aware.
            // e.g. attacker could have thrown a grenade, disconnected, then that grenade
            // killed another player.
            const attacker = demoFile.entities.getByUserId(e.attacker);
            const attackerName = attacker ? attacker.name : "unnamed";

            if (e.blind_duration > 1) {
              if (attacker && victim) {
                if (victimName != "GOTV") {
                  if (attacker.teamNumber != victim.teamNumber)
                    roundStats[attackerName].raw.ef += 1;
                }
              }
            }



            //console.log(`${attackerName} [flashed] ${victimName} ${e.blind_duration} ${e.entityid}`);
          });
        


        demoFile.gameEvents.on("player_jump", e => {
            if (!warmup3) {
              const jumper = demoFile.entities.getByUserId(e.userid);
              if (roundStats[jumper.name]) {
                roundStats[jumper.name].extra.jumps += 1;
              } 
            }
          });

        demoFile.gameEvents.on("player_connect", e => {
            console.log(e.name);
            var boi = demoFile.entities.getByUserId(e.userid);
            //console.log(boi.team.clanName);
          });

        demoFile.gameEvents.on("player_disconnect", e => {
            if (true) {
              console.log("PLAYER DISCOnnected" + e.name);
            }
          });

        demoFile.gameEvents.on("round_freeze_end", e => {
            if (!warmup3) {

              updateAlive();
              purgeValues();

              //console.log("***ROUND FREEZE END***");

              
            }
          });
        /*
        demoFile.gameEvents.on("round_poststart", e => {

          });
        demoFile.gameEvents.on("round_prestart", e => {

          });
        */
        /*demoFile.gameEvents.on("player_connect_full", e => {
          if (!playersTracked) {
            
            
            
            
                        const teams = demoFile.teams;
                        const terrorists = teams[2 ];
                        const cts = teams[3 ];
            
                        const tMem = terrorists.members;
                        const ctMem = cts.members;
                        const mems = [tMem, ctMem];

                        if (tMem.length + ctMem.length == 10)
                          playersTracked = true;
            
                        mems.forEach((element, index) => {
                          for (var i = element.length - 1; i >= 0; i--) {
                            
                            if (file == "3 3.dem")
                              console.log("Adding to live stats:" + element[i].name);
            
            
                            liveStats[element[i].name] = {
                              team: element[i].team.clanName,
                              name: element[i].name, 
                              kills: 0,
                              assists: 0,
                              deaths: 0,
                              damage: 0,
                              ud: 0,
                              ef: 0,
                              hs: 0,
                              rounds: 0,
                              rf: 0,
                              _2k: 0,
                              _3k: 0,
                              _4k: 0,
                              _5k: 0,
                              cl_1: 0,
                              cl_2: 0,
                              cl_3: 0,
                              cl_4: 0,
                              cl_5: 0,
                              ok: 0,
                              ol: 0,
                              awp: 0,
                              deag: 0,
                              knife: 0,
                              kastRounds: 0,
                              killPoints: 0,
                              impactPoints: 0,
                              winPoints: 0,
                              adr: 0,
                              kr: 0,
                              ar: 0,
                              kd: 0,
                              ra: 0,
                              impactRating: 0,
                              rating: 0,
                              fallDmg: 0,//
                              teamDmg: 0,//
                              jumps: 0,//
                              bombPlants: 0,//
                              //pistolHSKills: 0, //pistols: glock, p2k, hkp2000, deagle, tec9, p250, fiveseven, uspS/nonS, cz, r8, 
                              blindKills: 0,//
                              ping: 0,//
                              entries: 0,//
                              dinks: 0,//
                              gamesPlayed: 0
                              //hsP: 0
                            }
            
                            
                            insertData({
                              //ind: ind,
                              //map: demoFile.header.mapName,
                              team: element[i].team.clanName,
                              name: element[i].name, 
                              kills: 0,
                              assists: 0,
                              deaths: 0,
                              damage: 0,
                              ud: 0,
                              ef: 0,
                              hs: 0,
                              rounds: 0,
                              rf: 0,
                              _2k: 0,
                              _3k: 0,
                              _4k: 0,
                              _5k: 0,
                              cl_1: 0,
                              cl_2: 0,
                              cl_3: 0,
                              cl_4: 0,
                              cl_5: 0,
                              awp: 0,
                              deag: 0,
                              knife: 0,
                              kastRounds: 0,
                              killPoints: 0,
                              winPoints: 0,
                              adr: 0,
                              kr: 0,
                              ar: 0,
                              kd: 0,
                              ra: 0,
                              rating: 0,
                              hsP: 0
                            }, liveStats); 
                          }
                        });
          }
          });*/



        demoFile.gameEvents.on("bomb_planted", e => {
            const planter_ = demoFile.entities.getByUserId(e.userid);
            //const defuserName = defuser ? defuser.name : false;
            roundStats[planter_.name].extra.bombPlants += 1;
            planter = planter_.name;

            console.log("BOMB PLANTED");
            prePlant = false;
            postPlant = true;
            tMoney = true;
          });
        demoFile.gameEvents.on("bomb_defused", e => {
            const defuser = demoFile.entities.getByUserId(e.userid);
            //const defuserName = defuser ? defuser.name : false;
            roundStats[defuser.name].raw.killPoints += 1.5;

            console.log("BOMB DEFUSED");
            postPlant = false;
            postWinCon = true;
          });
        demoFile.gameEvents.on("bomb_exploded", e => {
            if (planter) {
              roundStats[planter].raw.killPoints += 1.5;
            }

            console.log("BOMB EXPLODED");
            postPlant = false;
            postWinCon = true;
          });

        demoFile.on("start", () => {
            console.log("Map Being Played:", demoFile.header.mapName);
            console.log("Demo header:", demoFile.header);
          });


        demoFile.gameEvents.on("round_end", e => {

            console.log("ROUNDEND EVENT" + e.winner);

            prePlant = false;
            postPlant = false;
            postWinCon = true;
            roundWinner = e.winner; //integer value
            roundWinnerTeamName = demoFile.teams[e.winner].clanName;

            if (e.winner === 2) 
              roundLoserTeamName = demoFile.teams[3].clanName;
            else
              roundLoserTeamName = demoFile.teams[2].clanName;

            console.log(currRound);

            if (currRound === 1 && teamTrackerBool) {
              teamTrackerBool = false;
              console.log("we are renaming things");
                teamNameTrack[demoFile.teams[2].clanName.split(']').pop().trim()] = teamNameTrack['2'];
                teamNameTrack[demoFile.teams[3].clanName.split(']').pop().trim()] = teamNameTrack['3'];

                teamAlias[demoFile.teams[2].clanName.split(']').pop().trim()] = teamNameTrack['2'];
                teamAlias[demoFile.teams[3].clanName.split(']').pop().trim()] = teamNameTrack['3'];
            }



            if (demoFile.gameRules.phase == 'postgame') {
              //logFinal();
              endRound();
              console.log(demoFile.entities.playerResource.props.m_iKills);
              
            }

            if (warmup) {
              if (demoFile.gameRules.phase == 'first') {
                warmupEnd();
              }
            }

            //console.log(tClutch + " " + ctAlive + " " + e.winner + " ");
            //console.log(ctClutch + " " + tAlive + " " + e.winner + " ");

            if (!warmup && clutch) {
              if (clutch.terr.value != 0 && e.winner === 2) {
                //T clutch won the round and all CTs died (could be by bomb i think)
                console.log("HUGE 1v" + clutch.terr.value + " CLUTCH by " + clutch.terr.person);
                roundStats[clutch.terr.person].cl = clutch.terr.value;
                //console.log(roundStats);
              }
              if (clutch.cterr.value != 0 && e.winner === 3) {
                //C clutch won the round and all Ts died (could be by bomb i think)
                console.log("HUGE 1v" + clutch.cterr.value + " CLUTCH by " + clutch.cterr.person);
                roundStats[clutch.cterr.person].cl = clutch.cterr.value;
                //console.log(roundStats);
              }
            }

            

            console.log(
              "*** Round ended '%s' (reason: %s, tick: %d, time: %d secs)",
              demoFile.gameRules.phase,
              e.reason,
              demoFile.currentTick,
              demoFile.currentTime | 0
            );

            console.log("Round Ended. " + demoFile.teams[e.winner].clanName + " won. For" + e.reason);

            console.log("ROUNDEND EVENT" + e.winner + demoFile.teams[2].clanName + demoFile.teams[3].clanName);


            if (!warmup3) {
              //if (demoFile.teams[3])
                console.log("ROUNDEND EVENT" + e.winner + demoFile.teams[2].clanName + demoFile.teams[3].clanName);
              console.log(teamNameTrack);
               console.log(" here: " + demoFile.teams[2].clanName);

              if (teamTrackerBool) {
                

              }
              
            }
            else {
              console.log("ROUNDEND EVENT" + e.winner + demoFile.teams[2].clanName + demoFile.teams[3].clanName);
              console.log(demoFile.teams[3]);
              //console.log(demoFile.teams[3].props.DT_Team['"player_array"']);
              //should occur only once
              
              teamNameTrack['2'] = demoFile.teams[2].clanName.split(']').pop().trim();
              teamNameTrack['3'] = demoFile.teams[3].clanName.split(']').pop().trim();


              

            }



            // We can't print the team scores here as they haven't been updated yet.
            // See round_officially_ended below.
          }); 

        //demoFile.gameEvents.on("round_officially_ended", logTeamScores);
        demoFile.gameEvents.on("round_officially_ended", e => {
          //does not trigger on last round
          console.log("Round " + currRound);

          knifeCheck = false;
          endRound();

          const teams = demoFile.teams;

          const terrorists = teams[2];
          const cts = teams[3];

          //if (liveTeams)



          

          console.log(liveTeams);

          //console.log(demoFile.entities.playerResource.props.m_iKills);

          console.log(
            "\tTerrorists: %s score %d\n\tCTs: %s score %d",
            terrorists.clanName,
            terrorists.score,
            cts.clanName,
            cts.score
          );
        }); 

        demoFile.gameEvents.on("round_start", e => {


            if (!warmup && !warmup2) {
              //purge round unique values
              purgeValues();
              console.log("Resetting stats and sentinels from ROUND START.");
              warmup3 = false;
              //console.log(roundStats);

              currRound = demoFile.gameRules.roundsPlayed + 1;

              //tAlive = demoFile.teams[2].members.length;
              //ctAlive = demoFile.teams[3].members.length;

              openingKill = true;
              prePlant = true;
              postPlant = false;
              postWinCon = false;
              //tClutch = 0;
              //ctClutch = 0;
              tMoney = false;
              tradeQ.length = 0;

              clutch = {
                terr: {
                  value: 0,
                  alive: demoFile.teams[2].members.length,
                  person: ""
                },
                cterr: {
                  value: 0,
                  alive: demoFile.teams[3].members.length,
                  person: ""
                }
              };


              //roundStats.length = 0;

              
              }

              if (!warmup) {
                warmup2 = false;
              }
          });

        demoFile.on("end", e => {
            if (e.error) {
              console.error("Error during parsing:", e.error);
            } else {
             //logTeamScores();
             //logFinal();
             //logFinalScores();
            //console.log(demoFile.entities.playerResource.props.m_iKills);
            //deriveFields();


            endMatch();
            //console.log(liveStats);
            addMatchForSeason();
            addMatchForGameNight();
            demosDone += 1;
            checkFinish();

            //csvWriter.writeRecords(stats).then(() => {console.log('hmmm');});
            }
            
            //console.log("Punk: " + punkKills + " ValveHacker: " + valveKills);
            
            console.log("Finished.");
            
            //fs.rename('test.csv', (demoFile.teams[2].clanName + ' vs ' + demoFile.teams[3].clanName + " " + demoFile.header.mapName + '.csv'), function(err) {
            //    if ( err ) console.log('ERROR: ' + err);
            //});
          });



        demoFile.parse(buffer);
      });

      function checkFinish() {
        if (demos === demosDone) {
          //console.log(masterLog);

          highlightLog.sort();
          console.log(highlightLog);

          csvWriter.writeRecords(masterArr).then(() => {console.log('hmmm');});

          fs.rename('test.csv', ('MatchNightResults.csv'), function(err) {
                if ( err ) console.log('ERROR: ' + err);
            }); 

          var bestStats = {
            vals: {
              awp: 0,
              deag: 0,
              knife: 0,
              hsP: 0,
              fallDmg: 0,//
              teamDmg: 0,//
              jumps: 0,//
              bombPlants: 0,//
              //pistolHSKills: 0, //pistols: glock, p2k, hkp2000, deagle, tec9, p250, fiveseven, uspS/nonS, cz, r8, 
              blindKills: 0,//
              ping: 0,//
              entries: 0,//
              dinks: 0,//
              cl_1: 0,
              cl_2: 0,
              cl_3: 0,
              cl_4: 0,
              cl_5: 0,
              clutches: 0
              //gamesPlayed: 0
              
            },
            names: {
              awp: "0",
              deag: "0",
              knife: "0",
              hsP: "0",
              fallDmg: "0",//
              teamDmg: "0",//
              jumps: "0",//
              bombPlants: "0",//
              //pistolHSKills: 0, //pistols: glock, p2k, hkp2000, deagle, tec9, p250, fiveseven, uspS/nonS, cz, r8, 
              blindKills: "0",//
              ping: "0",//
              entries: "0",//
              dinks: "0",//
              cl_1: "0",
              cl_2: "0",
              cl_3: "0",
              cl_4: "0",
              cl_5: "0",
              clutches: "0"
            }
          };


          var player = Object.keys(masterLog);
          var metadata = Object.values(masterLog);
          for (var i = player.length - 1; i >= 0; i--) {
            masterLog[player[i]].ping /= masterLog[player[i]].gamesPlayed;
            masterLog[player[i]].rating /= masterLog[player[i]].gamesPlayed;
            masterLog[player[i]].hsP = masterLog[player[i]].hs / masterLog[player[i]].kills;

            //[0, .2, .6, 1.2, 2, 3];
            masterLog[player[i]].clutches = (.2 * masterLog[player[i]].cl_1) + (.6 * masterLog[player[i]].cl_2) +
              (1.2 * masterLog[player[i]].cl_3) + (2 * masterLog[player[i]].cl_4) + (3 * masterLog[player[i]].cl_5);

            console.log(masterLog[player[i]].name + ": " + masterLog[player[i]].rating.toFixed(2) + " rating across " + masterLog[player[i]].gamesPlayed + " games.")

            var fieldVals = Object.keys(bestStats.vals);
            var valVals = Object.values(bestStats.vals);

            for (var j = fieldVals.length - 1; j >= 0; j--) {
              if (masterLog[player[i]][fieldVals[j]] > bestStats.vals[fieldVals[j]]) {
                bestStats.vals[fieldVals[j]] = masterLog[player[i]][fieldVals[j]];
                bestStats.names[fieldVals[j]] = masterLog[player[i]].name;
              }
              else if (masterLog[player[i]][fieldVals[j]] === bestStats.vals[fieldVals[j]]) {
                //console.log("Tie: " + fieldVals[j] + " " + masterLog[player[i]].name + " " + bestStats.names[fieldVals[j]]);
                bestStats.names[fieldVals[j]] += masterLog[player[i]].name;
              }


            }


          }
          //console.log(masterLog);
          console.log(bestStats);
          console.log(errLog);
        }
      }

      function addMatchForGameNight() {

        //var player = Object.keys(liveStats);
        //var metadata = Object.values(liveStats);


        //var player = Object.keys(liveStats);
        var metadata = Object.values(liveStats);

        



        console.log(metadata);
        console.log("dingdong");

        var result = teamAlias[metadata[0].team] + " " + liveTeams[metadata[0].team].score + " - " + liveTeams[metadata[5].team].score + " " + teamAlias[metadata[5].team];
        var resultEntry = [
          {
            mID: 1,
            map: metadata[0].map,
            team: result,
            result: 1
          }
        ];
        //var statsA = stats.slice(0, 5).sort(compare);

        var statsA = metadata.slice(0, 5).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        var statsC = metadata.slice(5, 10).sort((a, b) => parseFloat(b.rating) - parseFloat(a.rating));
        //var statsB = liveStats[5];

        metadata = statsA.concat(statsC).concat(resultEntry);




        var firstTeam = [
          {
            mID: metadata[0].mID,
            //map: metadata[0].map,
            name: teamAlias[metadata[0].team],
            rf: liveTeams[metadata[0].team].score,
            ra: liveTeams[metadata[0].team].scoreAgainst,
            rounds: (liveTeams[metadata[0].team].score + liveTeams[metadata[0].team].scoreAgainst)
          }
        ];

        var secondTeam = [
          {
            mID: metadata[0].mID,
            //map: metadata[0].map,
            name: teamAlias[metadata[5].team],
            rf: liveTeams[metadata[5].team].score,
            ra: liveTeams[metadata[5].team].scoreAgainst,
            rounds: (liveTeams[metadata[5].team].score + liveTeams[metadata[5].team].scoreAgainst)
          }
        ];

        if (firstTeam[0].rf > firstTeam[0].ra) { //first team won
          firstTeam[0].kills = 1;
          secondTeam[0].deaths = 1;
        }
        else if (secondTeam[0].rf > secondTeam[0].ra) {
          secondTeam[0].kills = 1;
          firstTeam[0].deaths = 1;
        }
        else {
          errLog += "ERR No one had a majority of rounds won.";
        }





        metadata.splice(5, 0, secondTeam[0]);

        

        var breakpoint = [{mID: " "}];

        metadata = firstTeam.concat(metadata).concat(breakpoint);


        for (var i = metadata.length - 1; i >= 0; i--) {


            //errLog += "The demos contain players with duplicate names (presumed same player in multiple demos). If this is for a game night, make sure the demos are correct.";
            //console.log(masterLog[player[i]]);
            var fields = Object.keys(metadata[i]);
            var values = Object.values(metadata[i]);

            if (metadata[i].rating) {
              metadata[i].team = teamAlias[metadata[i].team];  
            }  
          
        }

        

        //console.log(metadata);
        masterArr = masterArr.concat(metadata);

        


      }


      function addMatchForSeason() {



        //liveStats.splice(5, 0, {map: demoFile.header.mapName, name: "--"})

        //var statsB = liveStats[5];



        var player = Object.keys(liveStats);
        var metadata = Object.values(liveStats);

        for (var i = player.length - 1; i >= 0; i--) {

          if (masterLog[player[i]]) {
            //errLog += "The demos contain players with duplicate names (presumed same player in multiple demos). If this is for a game night, make sure the demos are correct.";
            //console.log(masterLog[player[i]]);
            var fields = Object.keys(masterLog[player[i]]);
            var values = Object.values(liveStats[player[i]]);
            for (var j = fields.length - 1; j >= 0; j--) {
              //console.log(fields);
              //console.log(values);
              //console.log(i + " " + j);
              //if (fields[j] == 'rating') {

              //}
              if (fields[j] != 'team' && fields[j] != 'name') {
                //console.log()
                masterLog[player[i]][fields[j]] += values[j];
              }
            }
          }
          else {
            masterLog[player[i]] = metadata[i];
          }
        }

        //add a barrier row that also shows result


        

      }

    });
});