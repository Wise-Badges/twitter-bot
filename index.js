require("dotenv").config();
const { Autohook } = require("twitter-autohook");
const fs = require("fs");
const axios = require("axios");

function isMention(event) {
  return "user_has_blocked" in event ? true : false;
}

function isLike(event) {
  return "favorite_events" in event ? true : false;
}

function getSenderName(tweet) {
  return tweet.tweet_create_events[0].user.name;
}

function getSenderUrl(tweet) {
  return "https://twitter.com/" + tweet.tweet_create_events[0].user.screen_name;
}

function getSender(tweet) {
  return {
    senderName: tweet.tweet_create_events[0].user.name,
    senderUrl:
      "https://twitter.com/" + tweet.tweet_create_events[0].user.screen_name,
  };
}

function getBadge(tweet) {
  const badge = tweet.tweet_create_events[0].entities.hashtags[0].text;
  return badge;
}

function getReceiver(tweet) {
  const user_mentions = tweet.tweet_create_events[0].entities.user_mentions;

  //could be just an if statement
  /*   for (i = 0; i < user_mentions.length; i++) {
    if (user_mentions[i].id_str !== process.env.TWITTER_BOT_ID_STR) {
      return {
        receiverName: user_mentions[i].name,
        receiverUrl: "https://twitter.com/" + user_mentions[i].screen_name,
      };
    }
       return ;

  } */

  if (user_mentions[0].id_str == process.env.TWITTER_BOT_ID_STR) {
    return {
      receiverName: user_mentions[1].name,
      receiverUrl: "https://twitter.com/" + user_mentions[1].screen_name,
    };
  } else {
    return {
      receiverName: user_mentions[0].name,
      receiverUrl: "https://twitter.com/" + user_mentions[0].screen_name,
    };
  }
}

function getTweetUrl(tweet) {
  return getSenderUrl(tweet) + "/status/" + tweet.tweet_create_events[0].id_str;
}

(async (start) => {
  try {
    const webhook = new Autohook({
      token: process.env.TWITTER_ACCESS_TOKEN,
      token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      env: process.env.TWITTER_WEBHOOK_ENV,
      port: process.env.PORT,
    });

    // Removes existing webhooks
    await webhook.removeWebhooks();

    // Starts a server and adds a new webhook
    await webhook.start();

    // Subscribes to your own user's activity
    await webhook.subscribe({
      oauth_token: process.env.TWITTER_ACCESS_TOKEN,
      oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
    });

    // Listening to incoming events.
    webhook.on("event", async (event) => {
      console.log("You received an event!");

      // if (isMention(event)) {
      //   console.log("----- DIT IS EEN MENTION -----");
      // }
      if (isMention(event)) {
        console.log("--- mention ---");
        // console.log(event);
        // fs.writeFileSync("mention3.json", JSON.stringify(event));

        axios
          .post("https://postman-echo.com/post", filterData(event))
          .then(function (response) {
            // console.log(response);
          })
          .catch(function (error) {
            console.log(error);
          });



          
      } else if (isLike(event)) {
        console.log("--- like ---");
        console.log(event);
        fs.writeFileSync("like.json", JSON.stringify(event));
      }
    });
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();
