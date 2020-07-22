const Twit = require("twit");
var fs = require("fs");
require("dotenv").config();

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

var options = {
  count: 200,
  //exclude_replies: true,
  //include_rts: false
}; //Twitter has a max of 200 per request.
//if (lastTweetId) { options.since_id = lastTweetId; }

T.get("/statuses/mentions_timeline", options, function (err, tweets, response) {
  console.log(tweets);

  var myJSON = JSON.stringify(tweets);


  fs.writeFile("./mentions.json", myJSON, function (err, data) {
    if (err) {
      return console.log(err);
    }
    console.log(data);
  });
});
