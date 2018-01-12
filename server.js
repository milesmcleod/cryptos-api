const Express = require('express');
const Mongoose = require('mongoose');
const BodyParser = require('body-parser');
const path = require('path');
const https = require ('https');
const CoinModel = require('./coin.js');
const HistoricalCoinModel = require('./historical_coin.js');
const ExchangeModel = require('./exchange.js');

const app = Express();

app.use(BodyParser.urlencoded({ extended: true }));
app.use(BodyParser.json());

Mongoose.Promise = global.Promise;

try {
  Mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost/cryptos_coins', {
    useMongoClient: true,
  });
  console.log('connected to mongoDB');
} catch (e) {
  console.log('error connecting to mongo');
  process.exit(1);
}

const coinModel = new CoinModel();
const historicalCoinModel = new HistoricalCoinModel();
coinModel.historicalCoinModel = historicalCoinModel;
// const exchangeModel= new ExchangeModel();

app.get('/coins', (req, res) => {
  coinModel.Coin.find((err, coins) => {
    if (err) return res.status(500).send(err);
    coins = coins.filter((coin) => coin.marketCapUSD);
    coins = coins.sort((x, y) => y.marketCapUSD - x.marketCapUSD);
    res.send(coins);
  });
});

app.get('/history/:coinSymbol', (req, res) => {
  historicalCoinModel.HistoricalCoin.findOne(
    {"symbol": req.params.coinSymbol.toUpperCase()},
    (err, historicalCoin) => {
      if (err) return res.status(500).send(err);
      res.send(historicalCoin);
    }
  );
});

app.get('/history/:coinSymbol/:dataType', (req, res) => {
  historicalCoinModel.HistoricalCoin.findOne(
    {"symbol": req.params.coinSymbol.toUpperCase()},
    (err, historicalCoin) => {
      let dataBTC;
      let dataUSD;
      let dataIntervalInMilliseconds;
      let dataIntervalInSeconds;
      let dataIntervalInMinutes;
      if (err) {
        return res.status(500).send(err);
      } else if (req.params.dataType.toLowerCase() === 'hour') {
        dataBTC = historicalCoin.valuePerMinuteBTC.slice(-60);
        dataUSD = historicalCoin.valuePerMinuteUSD.slice(-60);
        dataIntervalInMilliseconds = 60 * 1000;
        dataIntervalInSeconds = 60;
        dataIntervalInMinutes = 1;
        dataBTC = dataBTC.filter((el) => Date.now() - el.time < 3600000);
        dataUSD = dataUSD.filter((el) => Date.now() - el.time < 3600000);
      } else if (req.params.dataType.toLowerCase() === 'day') {
        dataBTC = [];
        dataUSD = [];
        for (let i = 0; i < 96; i ++ ) {
          const btcVal = historicalCoin.valuePerFifteenMinutesBTC[i];
          const usdVal = historicalCoin.valuePerFifteenMinutesUSD[i];
          if (btcVal && Date.now() - btcVal.time < (3600000 * 24)) {
            dataBTC.push(btcVal);
            dataUSD.push(usdVal);
          }
        }
        dataIntervalInMilliseconds = 15 * 60 * 1000;
        dataIntervalInSeconds = 15 * 60;
        dataIntervalInMinutes = 15;
      } else if (req.params.dataType.toLowerCase() === 'week') {
        dataBTC = historicalCoin.valuePerFifteenMinutesBTC;
        dataUSD = historicalCoin.valuePerFifteenMinutesUSD;
        dataBTC = dataBTC.filter((el) => Date.now() - el.time < (3600000 * 24 * 7));
        dataUSD = dataUSD.filter((el) => Date.now() - el.time < (3600000 * 24 * 7));
        dataIntervalInMilliseconds = 15 * 60 * 1000;
        dataIntervalInSeconds = 15 * 60;
        dataIntervalInMinutes = 15;
      }
      res.send({
        symbol: req.params.coinSymbol,
        dataIntervalInMilliseconds,
        dataIntervalInSeconds,
        dataIntervalInMinutes,
        dataUSD,
        dataBTC
      });
    }
  );
});

coinModel.getData();

setInterval(() => {
  coinModel.getData();
}, 10000);

setTimeout(() => {
  historicalCoinModel.setTimerForMinuteUpdate(coinModel);
  historicalCoinModel.setTimerForFifteenMinuteUpdate(coinModel);
}, 8000);

const server = app.listen(process.env.PORT || 8080, () => {
    var port = server.address().port;
    console.log("server up and running on port", port);
  }).on('error', (err) => {
    console.log('on error handler');
    console.log(err);
});

process.on('uncaughtException', (err) => {
    console.log('process.on handler');
    console.log(err);
}); //these two error handlers came from:
    // https://stackoverflow.com/questions/27610595/node-express-unhandled-econnreset-error
