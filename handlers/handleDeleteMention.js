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

async function filterDeleteMentionData(mention) {
  const tweet = mention.tweet_create_events[0];

  return {
    requestDelteUserID: tweet.user.id_str,
    text: tweet.text
  };
}

module.exports = async (event) => {
  const data = await filterDeleteMentionData(event);

  if (checkDeleteCommand(data.text) == false) {
    throw new Error('Not in the list of Delete-commands');
  }
  const requestDelteUserID = data.requestDelteUserID;
  const numID = data.text.split('-').pop();
  const assertionID = `${process.env.API_URL}/assertion/${numID}`;
  console.log(assertionID);

  const responseAssertion = await axios.get(assertionID);
  console.log(responseAssertion.data);

  const dataOriginalTweet = await T.get('statuses/show/:id', {
    id: responseAssertion.data.answer.split('/').pop(),
    tweet_mode: 'extended'
  });
  const tweetOriginal = dataOriginalTweet.data;

  if (checkPermission(tweetOriginal, requestDelteUserID) == false) {
    throw new Error('Not in the list of mentioned people.');
  }

  const deleteTweetID = tweetOriginal.id_str;
  await T.post('statuses/destroy/:id', { id: deleteTweetID })
  console.log('deleted: ', `https://twitter.com/${tweetOriginal.user.screen_name}/status/${tweetOriginal.id_str}`)

  await axios.delete(assertionID);
  console.log('deleted: ', assertionID)
};
