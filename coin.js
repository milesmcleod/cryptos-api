const Mongoose = require('mongoose');
const path = require('path');
const https = require ('https');

module.exports = class CoinModel {
  constructor() {
    this.coinSchema = new Mongoose.Schema({
      id: Number,
      symbol: String,
      name: String,
      high24Hours: Number,
      low24Hours: Number,
      volume24Hours: Number,
      high7Days: Number,
      low7Days: Number,
      last: Number,
      bid: Number,
      ask: Number,
      prevDay: Number,
      lastUSD: Number,
      bidUSD: Number,
      askUSD: Number,
      prevDayUSD: Number,
      marketCapUSD: Number,
      percentChange24Hours: Number
    }); //live data
    this.Coin = Mongoose.model('Coin', this.coinSchema);
    this.getCoinNames = this.getCoinNames.bind(this);
    this.getCoinData = this.getCoinData.bind(this);
    this.getBitcoin = this.getBitcoin.bind(this);
    this.getEthereum = this.getEthereum.bind(this);
    this.getMarketCaps = this.getMarketCaps.bind(this);
    this.updateMarketCaps = this.updateMarketCaps.bind(this);
  }

  getData() {
    this.getBitcoin()
    .then((bitcoinValueInUSD) => this.getEthereum(bitcoinValueInUSD))
    .then((bitcoinValueInUSD) => this.getCoinNames(bitcoinValueInUSD))
    .then((result) => {
      result[0].forEach((coin) => {
        if (coin.name !== 'Ethereum' && coin.name !== 'Bitcoin') {
          this.getCoinData(coin, result[1])
          .then(null, (errors) => console.log(errors));
        }
      }, (errors) => console.log(errors));
    })
    .then(() => this.getMarketCaps())
    .then((data) => this.updateMarketCaps(data));
  }

  getBitcoin() {
    return new Promise((success, failure) => {
      this.historicalCoinModel.HistoricalCoin.findOne({"symbol": "BTC"}, (error, doc) => {
        let high7Days;
        let low7Days;
        if (doc && doc["valuePerFifteenMinutesUSD"].length > 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value > y.value) ? x : y;
          });
          high7Days = high7Days.value;
          low7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value < y.value) ? x : y;
          });
          low7Days = low7Days.value;
        } else if (doc && doc["valuePerFifteenMinutesUSD"].length === 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"][0].value;
          low7Days = doc["valuePerFifteenMinutesUSD"][0].value;
        } else {
          high7Days = 0;
          low7Days = 0;
        }
        const request = https.get("https://bittrex.com/api/v1.1/public/getmarketsummary?market=USDT-BTC", (response) => {
          response.setEncoding("utf8");
          let body = "";
          response.on("data", data => {
            body += data;
          });
          response.on("uncaughtException", (err) => {
            console.log("Caught connection error: ");
            console.log(err);
            return;
          });
          response.on("end", () => {
            try { body = JSON.parse(body);
              if (body["success"] === true) {
                this.bitcoinValueInUSD = body['result'][0]['bid'];
                let coin = {};
                coin.id = -1;
                coin.symbol = 'BTC';
                coin.name = "Bitcoin";
                coin.high24Hours = body['result'][0]["High"];
                coin.low24Hours = body['result'][0]["Low"];
                coin.volume24Hours = body['result'][0]["Volume"];
                coin.high7Days = high7Days;
                coin.low7Days = low7Days;
                coin.last = body['result'][0]["Last"];
                coin.bid = body['result'][0]["Bid"];
                coin.ask = body['result'][0]["Ask"];
                coin.prevDay = body['result'][0]["PrevDay"];
                coin.lastUSD = coin.last;
                coin.bidUSD = coin.bid;
                coin.askUSD = coin.ask;
                coin.prevDayUSD = coin.prevDay;
                coin.percentChange24Hours = ((coin.bid - coin.prevDay) / coin.prevDay) * 100;
                const query = { name: coin.name };
                const update = coin;
                const options = { upsert: true };
                this.Coin.findOneAndUpdate(query, update, options, () => {
                  // console.log('updated');
                });
                success(coin.bidUSD);
              }
              success();
            } catch (e) {
              console.log(e);
            }
          });
          request.on('socket', function (socket) {
            socket.setTimeout(5000);
            socket.on('timeout', function() {
              request.abort();
            });
          });
          request.on('error', function(err) {
              if (err.code === "ECONNRESET") {
                  console.log("Timeout occurs");
                  //specific error treatment
              }
              //other error treatment
          });
        });
      });
    });
  }

  getEthereum(bitcoinValueInUSD) {
    return new Promise((success, failure) => {
      this.historicalCoinModel.HistoricalCoin.findOne({"symbol": "ETH"}, (error, doc) => {
        let high7Days;
        let low7Days;
        if (doc && doc["valuePerFifteenMinutesUSD"].length > 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value > y.value) ? x : y;
          });
          high7Days = high7Days.value;
          low7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value < y.value) ? x : y;
          });
          low7Days = low7Days.value;
        } else if (doc && doc["valuePerFifteenMinutesUSD"].length === 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"][0].value;
          low7Days = doc["valuePerFifteenMinutesUSD"][0].value;
        } else {
          high7Days = 0;
          low7Days = 0;
        }
        const request = https.get("https://bittrex.com/api/v1.1/public/getmarketsummary?market=BTC-ETH", (response) => {
          response.setEncoding("utf8");
          let body = "";
          response.on("data", data => {
            body += data;
          });
          response.on("uncaughtException", (err) => {
            console.log("Caught connection error: ");
            console.log(err);
            return;
          });
          response.on("end", () => {
            try { body = JSON.parse(body);
              if (body["success"] === true) {
                let coin = {};
                coin.id = -2;
                coin.symbol = 'ETH';
                coin.name = "Ethereum";
                coin.high24Hours = body['result'][0]["High"] * bitcoinValueInUSD;
                coin.low24Hours = body['result'][0]["Low"] * bitcoinValueInUSD;
                coin.volume24Hours = body['result'][0]["Volume"];
                coin.high7Days = high7Days;
                coin.low7Days = low7Days;
                coin.last = body['result'][0]["Last"];
                coin.bid = body['result'][0]["Bid"];
                coin.ask = body['result'][0]["Ask"];
                coin.prevDay = body['result'][0]["PrevDay"];
                coin.lastUSD = body['result'][0]["Last"] * bitcoinValueInUSD;
                coin.bidUSD = body['result'][0]["Bid"] * bitcoinValueInUSD;
                coin.askUSD = body['result'][0]["Ask"] * bitcoinValueInUSD;
                coin.prevDayUSD = body['result'][0]["PrevDay"] * bitcoinValueInUSD;
                coin.percentChange24Hours = ((coin.bid - coin.prevDay) / coin.prevDay) * 100;
                const query = { name: coin.name };
                const update = coin;
                const options = { upsert: true };
                this.Coin.findOneAndUpdate(query, update, options, () => {
                  // console.log('updated');
                });
                success(bitcoinValueInUSD);
              }
            } catch (e) {
              console.log(e);
            }
          });
          request.on('socket', function (socket) {
            socket.setTimeout(5000);
            socket.on('timeout', function() {
              request.abort();
            });
          });
          request.on('error', function(err) {
              if (err.code === "ECONNRESET") {
                  console.log("Timeout occurs");
                  //specific error treatment
              }
              //other error treatment
          });
        });
      });
    });
  }

  getCoinNames(bitcoinValueInUSD) {
    return new Promise((success, failure) => {
      const request = https.get('https://bittrex.com/api/v1.1/public/getcurrencies', (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", data => {
          body += data;
        });
        response.on("uncaughtException", (err) => {
          console.log("Caught connection error: ");
          console.log(err);
          return;
        });
        response.on("end", () => {
          try { body = JSON.parse(body);
            if (body["success"] === true) {
              // let result = body.result.filter( (coin, idx) => idx < 20);
              let result = body.result;
              result = result.map((coin, idx) => ({
                id: idx,
                symbol: coin.Currency,
                name: coin.CurrencyLong,
                type: (coin.CoinType === 'BITCOIN') ? 'BTC' : 'ETH'
              }));
              success([result, bitcoinValueInUSD]);
            }
          } catch (e) {
            console.log(e);
          }
        });
      });
      request.on('socket', function (socket) { //this fix comes from: https://stackoverflow.com/questions/6214902/how-to-set-a-timeout-on-a-http-request-in-node
        socket.setTimeout(5000);
        socket.on('timeout', function() {
          request.abort();
        });
      });
      request.on('error', function(err) {
          if (err.code === "ECONNRESET") {
              console.log("Timeout occurs");
              //specific error treatment
          }
          //other error treatment
      });
    });
  }

  getCoinData(coin, bitcoinValueInUSD) {
    return new Promise((success, failure) => {
      this.historicalCoinModel.HistoricalCoin.findOne({"symbol": coin.symbol}, (error, doc) => {
        let high7Days;
        let low7Days;
        if (doc && doc["valuePerFifteenMinutesUSD"].length > 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value > y.value) ? x : y;
          });
          high7Days = high7Days.value;
          low7Days = doc["valuePerFifteenMinutesUSD"].reduce((x, y) => {
            return (x.value < y.value) ? x : y;
          });
          low7Days = low7Days.value;
        } else if (doc && doc["valuePerFifteenMinutesUSD"].length === 1) {
          high7Days = doc["valuePerFifteenMinutesUSD"][0].value;
          low7Days = doc["valuePerFifteenMinutesUSD"][0].value;
        } else {
          high7Days = 0;
          low7Days = 0;
        }
        const request = https.get(`https://bittrex.com/api/v1.1/public/getmarketsummary?market=BTC-${coin.symbol}`, (response) => {
          response.setEncoding("utf8");
          let body = "";
          response.on("data", data => {
            body += data;
          });
          response.on("uncaughtException", (err) => {
            console.log("Caught connection error: ");
            console.log(err);
            return;
          });
          response.on("end", () => {
            try { body = JSON.parse(body);
              if (body["success"] === true) {
                coin.high24Hours = body['result'][0]["High"] * bitcoinValueInUSD;
                coin.low24Hours = body['result'][0]["Low"] * bitcoinValueInUSD;
                coin.volume24Hours = body['result'][0]["Volume"];
                coin.high7Days = high7Days;
                coin.low7Days = low7Days;
                coin.last = body['result'][0]["Last"];
                coin.bid = body['result'][0]["Bid"];
                coin.ask = body['result'][0]["Ask"];
                coin.prevDay = body['result'][0]["PrevDay"];
                coin.lastUSD = body['result'][0]["Last"] * bitcoinValueInUSD;
                coin.bidUSD = body['result'][0]["Bid"] * bitcoinValueInUSD;
                coin.askUSD = body['result'][0]["Ask"] * bitcoinValueInUSD;
                coin.prevDayUSD = body['result'][0]["PrevDay"] * bitcoinValueInUSD;
                coin.percentChange24Hours = ((coin.bid - coin.prevDay) / coin.prevDay) * 100;
                const query = { name: coin.name };
                const update = coin;
                const options = { upsert: true };
                this.Coin.findOneAndUpdate(query, update, options, () => {
                  // console.log(update);
                });
              }
            } catch (e) {
              console.log(e);
            }
          });
        });
        request.on('socket', function (socket) {
          socket.setTimeout(5000);
          socket.on('timeout', function() {
            request.abort();
          });
        });
        request.on('error', function(err) {
            if (err.code === "ECONNRESET") {
                console.log("Timeout occurs");
                //specific error treatment
            }
            //other error treatment
        });
      });
    });
  }

  getMarketCaps() {
    return new Promise((success, failure) => {
      const request = https.get(`https://api.coinmarketcap.com/v1/ticker/`, (response) => {
        response.setEncoding("utf8");
        let body = "";
        response.on("data", data => {
          body += data;
        });
        response.on("uncaughtException", (err) => {
          console.log("Caught connection error: ");
          console.log(err);
          return;
        });
        response.on("end", () => {
          try {
            body = JSON.parse(body);
          } catch (e) {
            console.log(e);
          }
          success(body);
        });
      });
      request.on('socket', function (socket) {
        socket.setTimeout(5000);
        socket.on('timeout', function() {
          request.abort();
        });
      });
      request.on('error', function(err) {
          if (err.code === "ECONNRESET") {
              console.log("Timeout occurs");
              //specific error treatment
          }
          //other error treatment
      });
    });
  }

  updateMarketCaps(marketCapData) {
    marketCapData.forEach((coin) => {
      const query = { symbol: coin.symbol };
      const update = {
        marketCapUSD: coin.market_cap_usd
      };
      const options = {};
      this.Coin.findOneAndUpdate(query, update, options, () => {
        // console.log(update);
      });
    });
  }
};
