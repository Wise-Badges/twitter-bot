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

let globalData;

try {
  const data = fs.readFileSync("mentions.json", "utf8");
  // console.log(data);
  globalData = data;
} catch (e) {
  console.log("Error:", e.stack);
}

function getSenderName(tweet) {
  return tweet.user.name;
}

function getSenderUrl(tweet) {
  return "https://twitter.com/" + tweet.user.screen_name;
}

async function getBadgeclasses() {
  const badgeclasses = await axios.get(process.env.API_URL + "/badgeclasses");
  const response = badgeclasses.data.badgeclasses;
  return response;
  // I want this function to return the JSON data Array
}

async function getBadge(tweet) {
  let tweetBadgeTag;

  if(tweet.entities.hashtags[0] in tweet){
    tweetBadgeTag = tweet.entities.hashtags[0].text;
  }
  else{
    tweetBadgeTag = 'TestBadge';

  }

  const response = await getBadgeclasses();

  for (i = 0; i < response.length; i++) {
    if (response[i].tag.toLowerCase() === tweetBadgeTag.toLowerCase()) {
      const badgeID = response[i].id;
      // console.log(badgeID);
      return badgeID;
    }
  }
  return response[0].id;
}

function getReceiver(tweet) {
  const user_mentions = tweet.entities.user_mentions;

  if (user_mentions[1]) {
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
  }else{
    return {
      receiverName: "Error",
      receiverUrl: "https://twitter.com/" + "Error",
    };
  }
}

function getTweetUrl(tweet) {
  return getSenderUrl(tweet) + "/status/" + tweet.id_str;
}

async function filterData(file) {
  // const event = file.tweet_create_events[0];
  const event = file;
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

function sendTweet(rec, sen, tag, html, b64content, imgDescription) {
  const msg =
    "Congratulations @" +
    rec +
    "! @" +
    sen +
    " issued you a #" +
    tag +
    ". Now cherish and embrace your WiseBadge here: " +
    html;

  // first we must post the media to Twitter
  T.post("media/upload", { media_data: b64content }, function (
    err,
    data,
    response
  ) {
    // now we can assign alt text to the media, for use by screen readers and
    // other text-based presentations and interpreters
    var mediaIdStr = data.media_id_string;
    var altText = imgDescription;
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

    T.post("media/metadata/create", meta_params, function (
      err,
      data,
      response
    ) {
      if (!err) {
        // now we can reference the media and post a tweet (media will attach to the tweet)
        var params = { status: msg, media_ids: [mediaIdStr] };

        T.post("statuses/update", params, function (err, data, response) {
          console.log(getTweetUrl(data));
        });
      }
    });
  });
}

// ----------------------------------------------

console.log(globalData);
const JSONwebhookMentions = JSON.parse(globalData);
const webhookMentions = JSONwebhookMentions.tweets;

for (i = 0; i < webhookMentions.length; i++) {
  var webhookMention = webhookMentions[i];
  // console.log(webhookMention)

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
      const responseBadgeclassNameDescription =
        responseBadgeclass.data.name +
        " - " +
        responseBadgeclass.data.description;

      const b64content = await imageToBase64(responseBadgeclassImage);

      sendTweet(
        receiver_screen_name,
        sender_screen_name,
        responseBadgeclassTag,
        responsePostHtml,
        b64content,
        responseBadgeclassNameDescription
      );
    })
    .catch(function (error) {
      console.log(error);
    });
}
