const Twit = require("twit");
var fs = require("fs");
var axios = require("axios");
require("dotenv").config();
const imageToBase64 = require("image-to-base64");

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

async function getBadgeclasses() {
  const resp = await axios.get(process.env.API_URL + "/badgeclasses");
  badgeClasses = resp.data.data
  console.log(badgeClasses)
}
getBadgeclasses()

