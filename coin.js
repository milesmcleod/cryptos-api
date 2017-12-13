const Mongoose = require('mongoose');
const path = require('path');
const https = require ('https');

module.exports = class CoinModel {
  constructor() {
    this.coinSchema = new Mongoose.Schema({
      id: Number,
      symbol: String,
      name: String,
      high: Number,
      low: Number,
      volume: Number,
      last: Number,
      bid: Number,
      ask: Number,
      prevDay: Number
    }); //live data
    this.Coin = Mongoose.model('Coin', this.coinSchema);
    this.getCoinNames = this.getCoinNames.bind(this);
    this.getCoinData = this.getCoinData.bind(this);
    this.getBitcoin = this.getBitcoin.bind(this);
    this.getEthereum = this.getEthereum.bind(this);
  }

  getData() {
    //this.getBitCoin();
    //this.getEthereum();
    this.getCoinNames().then((result) => {
      result.forEach((coin) => {
        this.getCoinData(coin)
        .then(null, (errors) => console.log(errors));
      }, (errors) => console.log(errors));
    });
  }

  getBitcoin() {
    return new Promise((success, failure) => {
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
              let coin = {};
              coin.id = -1;
              coin.symbol = 'BTC';
              coin.name = "Bitcoin";
              coin.high = body['result'][0]["High"];
              coin.low = body['result'][0]["Low"];
              coin.volume = body['result'][0]["Volume"];
              coin.last = body['result'][0]["Last"];
              coin.bid = body['result'][0]["Bid"];
              coin.ask = body['result'][0]["Ask"];
              coin.prevDay = body['result'][0]["PrevDay"];
              const query = { name: coin.name };
              const update = coin;
              const options = { upsert: true };
              this.Coin.findOneAndUpdate(query, update, options);
            }
          } catch (e) {
            console.log(e);
          }
        });
      });
    });
  }

  getEthereum() {
    return new Promise((success, failure) => {
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
              coin.id = -1;
              coin.symbol = 'BTC';
              coin.name = "Bitcoin";
              coin.high = body['result'][0]["High"];
              coin.low = body['result'][0]["Low"];
              coin.volume = body['result'][0]["Volume"];
              coin.last = body['result'][0]["Last"];
              coin.bid = body['result'][0]["Bid"];
              coin.ask = body['result'][0]["Ask"];
              coin.prevDay = body['result'][0]["PrevDay"];
              const query = { name: coin.name };
              const update = coin;
              const options = { upsert: true };
              this.Coin.findOneAndUpdate(query, update, options);
            }
          } catch (e) {
            console.log(e);
          }
        });
      });
    });
  }

  getCoinNames() {
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
                name: coin.CurrencyLong
              }));
              success(result);
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

  getCoinData(coin) {
    return new Promise((success, failure) => {
      const type = (coin.CoinType === 'BTC') ? 'BTC' : 'ETH';
      const request = https.get(`https://bittrex.com/api/v1.1/public/getmarketsummary?market=${type}-${coin.symbol}`, (response) => {
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
              coin.high = body['result'][0]["High"];
              coin.low = body['result'][0]["Low"];
              coin.volume = body['result'][0]["Volume"];
              coin.last = body['result'][0]["Last"];
              coin.bid = body['result'][0]["Bid"];
              coin.ask = body['result'][0]["Ask"];
              coin.prevDay = body['result'][0]["PrevDay"];
              const query = { name: coin.name };
              const update = coin;
              const options = { upsert: true };
              this.Coin.findOneAndUpdate(query, update, options);
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
  }
};
