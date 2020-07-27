const axios = require("axios");
const fs = require('fs');
const imageToBase64 = require("image-to-base64");
const Twit = require('twit');

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});


async function getBadgeclasses() {
  const resp = await axios.get(process.env.API_URL + '/badgeclasses');
  const badgeClasses = resp.data.data;
  return badgeClasses;
}

//TODO fix this
async function getBadge(tweet) {
  let tweetBadgeTag;

  if (tweet.entities.hashtags[0] in tweet) {
    tweetBadgeTag = tweet.entities.hashtags[0].text;
  } else {
    tweetBadgeTag = 'LeadingLady';
  }

  const response = await getBadgeclasses();
  let i;
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
        receiverUrl: 'https://twitter.com/' + user_mentions[1].screen_name
      };
    } else {
      return {
        receiverName: user_mentions[0].name,
        receiverUrl: 'https://twitter.com/' + user_mentions[0].screen_name
      };
    }
  } else {
    return {
      receiverName: 'Error',
      receiverUrl: 'https://twitter.com/' + 'Error'
    };
  }
}

function sendTweet(rec, sen, tag, html, b64content, imgDescription) {
  const msg = `Congratulations @${rec} ! @${sen} issued you a #${tag}. Now cherish and embrace your WiseBadge here: ${html}`;

  T.post('media/upload', { media_data: b64content }, function (err, data) {
    var mediaIdStr = data.media_id_string;
    var altText = imgDescription;
    var meta_params = { media_id: mediaIdStr, alt_text: { text: altText } };

    T.post('media/metadata/create', meta_params, function (err) {      
      if (!err) {
        var params = { status: msg, media_ids: [mediaIdStr] };
        T.post('statuses/update', params, function (err, data) {
          console.log(`https://twitter.com/${data.user.screen_name}/status/${data.id_str}`);
        });
      }
    });
  });
}

async function filterData(mention) {
    const tweet = mention.tweet_create_events[0];
    
    return {
        receiver: getReceiver(tweet).receiverUrl,
        receiverName: getReceiver(tweet).receiverName,
        sender: `https://twitter.com/${tweet.user.screen_name}`,
        senderName: tweet.user.name,
        platform: "twitter",
        senderUrl: `https://twitter.com/${tweet.user.screen_name}`,
        reason: `https://twitter.com/${tweet.user.screen_name}/status/${tweet.id_str}`,
        badgeclass: await getBadge(tweet)
    };
}

module.exports = async (event) => {
    const data = await filterData(event);
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
    const responseBadgeclassImage =
      "https://wisebadges.wabyte.com/leading_lady.png";
    // const responseBadgeclassImage = responseBadgeclass.data.image;
    const responseBadgeclassNameDescription = `${responseBadgeclass.data.name} - ${responseBadgeclass.data.description}`;

    const b64content = await imageToBase64(responseBadgeclassImage);

    sendTweet(
      receiver_screen_name,
      sender_screen_name,
      responseBadgeclassTag,
      responsePostHtml,
      b64content,
      responseBadgeclassNameDescription
    );

    fs.writeFileSync("mention.json", JSON.stringify(event));
}