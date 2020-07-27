const axios = require("axios");
const fs = require('fs');
// const functionsExtra = require('../util/functions');


function getMentionedUsers(tweet) {
    if ('extended_tweet' in tweet) {
      return tweet.extended_tweet.entities.user_mentions;
    } else {
      return tweet.entities.user_mentions;
    }
  }
  
  function getUrls(tweet) {
    if ('extended_tweet' in tweet) {
      return tweet.extended_tweet.entities.urls;
    } else {
      return tweet.entities.urls;
    }
  }

async function filterLikeData(like) {
    const tweet = like.favorite_events[0].favorited_status;
    const liker = like.favorite_events[0].user;
    // console.log(tweet);
    // console.log(liker);

    const mentionedUsers = getMentionedUsers(tweet);
    /*   console.log(mentionedUsers);
    console.log(liker.id_str);
    console.log(mentionedUsers[0].id_str); */

    if (liker.id_str === mentionedUsers[0].id_str) {
        const urls = getUrls(tweet);
        const htmlUrl = urls[0].expanded_url;
        const numID = htmlUrl.split("/").pop();
        const assertionID = "https://api.wisebadges.osoc.be/assertion/" + numID;
        console.log(assertionID);
        return assertionID;
    }
    throw new Error("Liker is not the same as receiver");
}

module.exports = async (event) => {
    const data = await filterLikeData(event)
    console.log(data);
    await axios.patch(data);
    fs.writeFileSync("like.json", JSON.stringify(event));
}