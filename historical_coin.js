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
    // new historical data is pushed, to data array, and we never let it
    // get longer than 365 entries. today is array[-1], and the
    // oldest data point is array[0].

    // this means that every time a new batch of current data comes in,
    // array[-1] should be overwritten.

    this.HistoricalCoin = Mongoose.model(
      'HistoricalCoin',
      this.historicalCoinSchema
    );
    this.addMinuteData = this.addMinuteData.bind(this);
    this.addFifteenMinuteData = this.addHourlyData.bind(this);
  }

  addMinuteData(coinModel) {
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
                $slice: -60
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
                $slice: -60
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
