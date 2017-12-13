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
// const exchangeModel= new ExchangeModel();

app.get('/coins', (req, res) => {
  coinModel.Coin.find((err, coins) => {
    if (err) return res.status(500).send(err);
    coins = coins.sort((x, y) => x.id - y.id);
    res.send(coins);
  });
});

app.get('/history/:coinSymbol', (req, res) => {
  historicalCoinModel.HistoricalCoin.findOne(
    {"symbol": req.params.coinSymbol},
    (err, historicalCoin) => {
      console.log(req.params.coinSymbol);
      if (err) return res.status(500).send(err);
      res.send(historicalCoin);
    }
  );
});

app.get('/history/:coinSymbol/:dataType', (req, res) => {
  historicalCoinModel.HistoricalCoin.findOne(
    {"symbol": req.params.coinSymbol},
    (err, historicalCoin) => {
      console.log(req.params.coinSymbol);
      let data;
      if (err) {
        return res.status(500).send(err);
      } else if (req.params.dataType === 'hour') {
        data = historicalCoin.valuePerMinute.slice(-60);
      } else if (req.params.dataType === 'day') {
        data = historicalCoin.valuePerMinute;
      } else if (req.params.dataType === 'week') {
        data = historicalCoin.valuePerFifteenMinutes;
      }
      res.send({
        symbol: req.params.coinSymbol,
        data
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
