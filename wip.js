const Twit = require('twit'); 
var fs = require("fs");
var axios = require("axios");
require("dotenv").config();

const twit = new Twit({
  consumer_key:         process.env.TWITTER_CONSUMER_KEY,
  consumer_secret:      process.env.TWITTER_CONSUMER_SECRET,
  access_token:         process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret:  process.env.TWITTER_ACCESS_TOKEN_SECRET
}); 

let globalData;

try {
  const data = fs.readFileSync("mention2.json", "utf8");
  // console.log(data);
  globalData = data;
} catch (e) {
  console.log("Error:", e.stack);
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

async function getBadgeclasses() {
  const badgeclasses = await axios.get(process.env.API_URL + "/badgeclasses");
  const response = badgeclasses.data.badgeclasses;
  return response;
  // I want this function to return the JSON data Array
}

async function getBadge(tweet) {
  const tweetBadgeTag = tweet.tweet_create_events[0].entities.hashtags[0].text;

  const response = await getBadgeclasses();

  for (i = 0; i < response.length; i++) {
    if (response[i].tag.toLowerCase() === tweetBadgeTag.toLowerCase()) {
      const badgeID = response[i].id;
      console.log(badgeID);
      return badgeID;
    }
  }
  return Error;
}

function getReceiver(tweet) {
  const user_mentions = tweet.tweet_create_events[0].entities.user_mentions;

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

async function filterData(event) {
  return {
    receiver: getReceiver(event).receiverUrl,
    receiverName: getReceiver(event).receiverName,
    sender: getSenderUrl(event),
    senderName: getSenderName(event),
    platform: "twitter",
    senderUrl: getSenderUrl(event),
    reason: getTweetUrl(event),
    badgeclass: await getBadge(event),
  };
}

function sendTweet(rec, sen, tag, html, img) {
  const msg =
    "Congratulations @" +
    rec +
    "! @" +
    sen +
    " issued you a #" +
    tag +
    ". Now cherish and embrace your WiseBadge here: " +
    html;

    var params = { status: msg };

    twit.post('statuses/update', params, function (err, data, response) {
      console.log(data);
      console.log("TWITTER RESPONSE "+JSON.stringify(response));
   });


}

// ----------------------------------------------

const webhookMention = JSON.parse(globalData);
filterData(webhookMention)
  .then(async (data) => {
    // console.log(data);
    const receiver_screen_name = /[^/]*$/.exec(data.receiver)[0];
    const sender_screen_name = /[^/]*$/.exec(data.sender)[0];

    const responsePost = await axios.post(
      process.env.API_URL + "/assertion",
      data
    );
    // console.log(responsePost.data);
    const responsePostHtml = responsePost.data.html;
    const responsePostJson = responsePost.data.json;

    const responseAssertion = await axios.get(responsePostJson);
    // console.log(responseAssertion.data);

    const responseBadgeclass = await axios.get(responseAssertion.data.badge);
    // console.log(responseBadgeclass.data);
    const responseBadgeclassTag = responseBadgeclass.data.tag;
    const responseBadgeclassImage = responseBadgeclass.data.image;

    sendTweet(
      receiver_screen_name,
      sender_screen_name,
      responseBadgeclassTag,
      responsePostHtml,
      responseBadgeclassImage
    );

  })
  .catch(function (error) {
    console.log(error);
  });
