const Mongoose = require('mongoose');
const path = require('path');
const https = require ('https');

module.exports = class HistoricalCoinModel {
  constructor() {
    this.historicalCoinSchema = new Mongoose.Schema({
      name: String,
      symbol: String,
      valuePerMinute: Array,
      valuePerFifteenMinutes: Array
    }); //historical data

    this.HistoricalCoin = Mongoose.model(
      'HistoricalCoin',
      this.historicalCoinSchema
    );
    this.addMinuteData = this.addMinuteData.bind(this);
    this.addFifteenMinuteData = this.addFifteenMinuteData.bind(this);
  }

  addMinuteData(coinModel) {
    const dataLimit = -60 * 24;
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          const query = { name: coin.name };
          const update = {
            name: coin.name,
            symbol: coin.symbol,
            $push: {
              valuePerMinute:{
                $each: [{time: Date.now(), value: coin["bid"]}],
                $slice: dataLimit
              }
            }
          };
          // this is mongoDB notation; slice limits the length of the array
          // to 60 elements, keeping the most recent ones
          const options = { upsert: true };
          this.HistoricalCoin.findOneAndUpdate(query, update, options, (error, doc) => {
            if (error) console.log(error);
          });
        });
      }
    });
  }

  addFifteenMinuteData(coinModel) {
    const dataLimit = -7 * 24 * 4;
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          const query = { name: coin.name };
          const update = {
            name: coin.name,
            symbol: coin.symbol,
            $push: {
              valuePerFifteenMinutes:{
                $each: [{time: Date.now(), value: coin["bid"]}],
                $slice: dataLimit
              }
            }
          };
          // this is mongoDB notation; slice limits the length of the array
          // to 60 elements, keeping the most recent ones
          const options = { upsert: true };
          this.HistoricalCoin.findOneAndUpdate(query, update, options, (error, doc) => {
            if (error) console.log(error);
          });
        });
      }
    });
  }

  setTimerForMinuteUpdate(coinModel) {
    const millisecondsPerMinute = 1000 * 60;
    const millisecondsUntilMinute = millisecondsPerMinute - (Date.now() % millisecondsPerMinute);
    setTimeout(() => {
      this.addMinuteData(coinModel);
      setInterval(() => {
        this.addMinuteData(coinModel);
      }, millisecondsPerMinute);
    }, millisecondsUntilMinute);
  }

  setTimerForFifteenMinuteUpdate(coinModel) {
    const millisecondsPerFifteenMinutes = 1000 * 60 * 15;
    const millisecondsUntilFifteenMinutes = millisecondsPerFifteenMinutes - (Date.now() % millisecondsPerFifteenMinutes);
    setTimeout(() => {
      this.addHourlyData(coinModel);
      setInterval(() => {
        this.addHourlyData(coinModel);
      }, millisecondsPerFifteenMinutes);
    }, millisecondsUntilFifteenMinutes + 1000);
  }

};
