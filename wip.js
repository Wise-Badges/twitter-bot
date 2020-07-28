const Twit = require("twit");
var fs = require("fs");
var axios = require("axios");
require("dotenv").config();

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});


function tweets() {

    var params = { user_id: process.env.TWITTER_BOT_ID_STR, count: 200, trim_user: true, exclude_replies: true, include_rts: false  };

    T.get("statuses/user_timeline", params, function (
      err,
      data,
      response
    ) {
      for(let i in data){
        const tweet = data[i];
        fs.writeFileSync(`./events/tweet-${i}.json`, JSON.stringify(data[i]));
        console.log(data[i].id_str)
        var str = tweet.text;
        var n = str.startsWith("Congratulations");
        if(n){
          T.post('statuses/destroy/:id', { id: data[i].id_str })
        }        
       }
      });
  }

  tweets() 