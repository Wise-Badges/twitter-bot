const axios = require('axios');
const Twit = require('twit');

const T = new Twit({
  consumer_key: process.env.TWITTER_CONSUMER_KEY,
  consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
  access_token: process.env.TWITTER_ACCESS_TOKEN,
  access_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
});

function getMentionedUsers(tweet) {
  if ('extended_tweet' in tweet) {
    return tweet.extended_tweet.entities.user_mentions;
  } else {
    return tweet.entities.user_mentions;
  }
}

function checkPermission(tweet, replierID) {
  const mentionedUsers = getMentionedUsers(tweet);
  // console.log(mentionedUsers, replierID);
  for (let index in mentionedUsers) {
    if (mentionedUsers[index].id_str == replierID) {
      return true;
    }
  }
  return false;
}

function checkDeleteCommand(text) {
  const deleteCommands = ['delete', 'invoke'];

  var str = text.toLowerCase();

  for (let index in deleteCommands) {
    var n = str.search(deleteCommands[index]);
    if (n != -1) {
      return true;
    }
  }
  return false;
}

function getUrls(tweet) {
  if ('extended_tweet' in tweet) {
    return tweet.extended_tweet.entities.urls;
  } else {
    return tweet.entities.urls;
  }
}

async function filterReplyData(reply) {
  const tweet = reply.tweet_create_events[0];

  return {
    tweetID: tweet.in_reply_to_status_id_str,
    replierID: tweet.user.id_str,
    text: tweet.text
  };
}

module.exports = async (event) => {
  const data = await filterReplyData(event);

  if (checkDeleteCommand(data.text) == false) {
    throw new Error('Not in the list of Delete-commands');
  }

  const replierID = data.replierID;

  const dataOriginalTweet = await T.get('statuses/show/:id', {
    id: data.tweetID,
    tweet_mode: 'extended'
  });
  const tweetOriginal = dataOriginalTweet.data;

  if (checkPermission(tweetOriginal, replierID) == false) {
    throw new Error('Not in the list of mentioned people.');
  }
  const urls = getUrls(tweetOriginal);
  const htmlUrl = urls[0].expanded_url;
  const numID = htmlUrl.split('/').pop();
  const assertionID = `${process.env.API_URL}/assertion/${numID}`
  await axios.delete(assertionID);
  console.log('deleted: ', assertionID)
  const deleteTweetID = tweetOriginal.id_str;
  await T.post('statuses/destroy/:id', { id: deleteTweetID })
  console.log('deleted: ', `https://twitter.com/${tweetOriginal.user.screen_name}/status/${tweetOriginal.id_str}`)
};
