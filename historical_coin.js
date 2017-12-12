const Mongoose = require('mongoose');
const path = require('path');
const https = require ('https');

module.exports = class HistoricalCoinModel {
  constructor() {
    this.historicalCoinSchema = new Mongoose.Schema({
      name: String,
      symbol: String,
      minuteData: Array,
      hourlyData: Array,
      dailyData: Array
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
    this.addHourlyData = this.addHourlyData.bind(this);
    this.addDailyData = this.addDailyData.bind(this);
  }

  addMinuteData(coinModel) {
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          const query = { name: coin.name };
          const update = {
            name: coin.name,
            symbol: coin.symbol,
            $push: { minuteData: {$each: [coin["bid"]], $slice: -60}}
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

  addHourlyData(coinModel) {
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          const query = { name: coin.name };
          const update = {
            name: coin.name,
            symbol: coin.symbol,
            $push: { hourlyData: {$each: [coin["bid"]], $slice: -60}}
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

  addDailyData(coinModel) {
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          const query = { name: coin.name };
          const update = {
            name: coin.name,
            symbol: coin.symbol,
            $push: { dailyData: {$each: [coin["bid"]], $slice: -60}}
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

  setTimerForHourlyUpdate(coinModel) {
    const millisecondsPerHour = 1000 * 60 * 60;
    const millisecondsUntilHour = millisecondsPerHour - (Date.now() % millisecondsPerHour);
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          setTimeout(() => {
            this.addHourlyData(coinModel, coin);
            setInterval(() => {
              this.addHourlyData(coinModel, coin);
            }, millisecondsPerHour);
          }, millisecondsUntilHour);
        });
      }
    });
  }

  setTimerForDailyUpdate(coinModel) {
    const millisecondsPerDay = 1000 * 60 * 60 * 24;
    const millisecondsUntilMidnight = millisecondsPerDay - (Date.now() % millisecondsPerDay);
    coinModel.Coin.find((err, coins) => {
      if (!err) {
        coins.forEach((coin) => {
          setTimeout(() => {
            this.addDailyData(coinModel, coin);
            setInterval(() => {
              this.addDailyData(coinModel, coin);
            }, millisecondsPerDay);
          }, millisecondsUntilMidnight);
        });
      }
    });
  }

};
