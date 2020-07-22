//Imports
require("dotenv").config();
const { Autohook } = require("twitter-autohook");
const axios = require("axios");
const Twit = require("twit");
const imageToBase64 = require("image-to-base64");

//Settings
const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
});

//Functions data extracting out of tweet

function getSenderName(tweet) {
  return tweet.user.name;
}

function getSenderUrl(tweet) {
  return "https://twitter.com/" + tweet.user.screen_name;
}

async function getBadgeclasses() {
  const resp = await axios.get(process.env.API_URL + "/badgeclasses");
  return resp.data.badgeclasses;
}

//TODO fix this
async function getBadge(tweet) {
  let tweetBadgeTag;

  if (tweet.entities.hashtags[0] in tweet) {
    tweetBadgeTag = tweet.entities.hashtags[0].text;
  } else {
    tweetBadgeTag = "TestBadge";
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

//TODO what to do if there is no extra mention in the tweet
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
  } else {
    return {
      receiverName: "Error",
      receiverUrl: "https://twitter.com/" + "Error",
    };
  }
}

function getTweetUrl(tweet) {
  return getSenderUrl(tweet) + "/status/" + tweet.id_str;
}

// big important functions
async function filterData(mention) {
  const tweet = mention.tweet_create_events[0];
  return {
    receiver: getReceiver(tweet).receiverUrl,
    receiverName: getReceiver(tweet).receiverName,
    sender: getSenderUrl(tweet),
    senderName: getSenderName(tweet),
    platform: "twitter",
    senderUrl: getSenderUrl(tweet),
    reason: getTweetUrl(tweet),
    badgeclass: await getBadge(tweet),
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

//Start the Autohook
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

      if ("user_has_blocked" in event) {
        console.log("--- mention ---");

        filterData(event)
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

            const responseBadgeclass = await axios.get(
              responseAssertion.data.badge
            );
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
      } else if ("favorite_events" in event) {
        console.log("--- like ---");
        console.log(event);
      }
    });
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();
