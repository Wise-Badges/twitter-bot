const axios = require('axios');
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
  const mentionedUsers = getMentionedUsers(tweet);

  if(mentionedUsers.length == 0){
    return {};
  }

  if(tweet.user.id_str != process.env.TWITTER_BOT_ID_STR){
    return {};
  }

  //  if ((liker.id_str === mentionedUsers[0].id_str) && (liker.id_str !== process.env.TWITTER_BOT_ID_STR) ) {
  if ((liker.id_str === mentionedUsers[0].id_str) || (liker.id_str == process.env.TWITTER_BOT_ID_STR) ) {
    const urls = getUrls(tweet);
    const htmlUrl = urls[0].expanded_url;
    const numID = htmlUrl.split('/').pop();
    const assertionID = `${process.env.API_URL}/assertion/${numID}`;
    return {
      assertionID: assertionID
    };
  }else{
    return {};
  }
}

module.exports = async (event) => {
  const data = await filterLikeData(event);
  if('assertionID' in data){
    console.log(data.assertionID);
    await axios.patch(data.assertionID);
  }
};
