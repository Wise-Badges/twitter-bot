//Imports
require('dotenv').config();
const { Autohook } = require('twitter-autohook');
const handleLike = require('./handlers/handleLike');
const handleMention = require('./handlers/handleMention');
const handleReply = require('./handlers/handleReply');
const handleDeleteMention = require('./handlers/handleDeleteMention');
const fs = require('fs');

const fileWriting = false;
let fileWritingIndex = 0;
if (fileWriting) {
  const directory = './events';

  if (!fs.existsSync(directory)) {
    fs.mkdirSync(directory);
  }
  const path = require('path');
  fs.readdir(directory, (err, files) => {
    if (err) throw err;
    for (const file of files) {
      fs.unlink(path.join(directory, file), (err) => {
        if (err) throw err;
      });
    }
  });
}

function isLike(event) {
  if ('favorite_events' in event) {
    return true;
  } else {
    return false;
  }
}

function isMention(event) {
  if ('user_has_blocked' in event) {
    const replyToStatus = event.tweet_create_events[0].in_reply_to_status_id_str;
    if (replyToStatus == null) {
      return true;
    }
  } else {
    return false;
  }
}

function isReply(event) {
  if ('tweet_create_events' in event) {
    const replyToUser = event.tweet_create_events[0].in_reply_to_user_id_str;
    const replyingUser = event.tweet_create_events[0].user.id_str;
    if (
      replyToUser === process.env.TWITTER_BOT_ID_STR &&
      replyingUser !== process.env.TWITTER_BOT_ID_STR
    ) {
      return true;
    }
  } else {
    return false;
  }
}

const listenToEvents = async (event) => {
  console.log('You received an event!');
  if (fileWriting) {
    fs.writeFileSync(`./events/event-${fileWritingIndex}.json`, JSON.stringify(event));
    fileWritingIndex += 1;
  }

  let handleEvent;
  if (isLike(event)) {
    handleEvent = handleLike;
  } else if (isMention(event)) {
    if(event.tweet_create_events[0].entities.user_mentions.length >= 2) {
      handleEvent = handleMention;
    }else{
      handleEvent = handleDeleteMention;
    }
  } else if (isReply(event)) {
    handleEvent = handleReply;
  } else handleEvent = () => {};

  try {
    await handleEvent(event);
  } catch (err) {
    console.log(err);
  }
};

//Start the Autohook
(async () => {
  try {
    const webhook = new Autohook({
      token: process.env.TWITTER_ACCESS_TOKEN,
      token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      env: process.env.TWITTER_WEBHOOK_ENV,
      port: process.env.PORT
    });

    // Removes existing webhooks
    await webhook.removeWebhooks();

    // Starts a server and adds a new webhook
    await webhook.start();

    // Subscribes to your own user's activity
    await webhook.subscribe({
      oauth_token: process.env.TWITTER_ACCESS_TOKEN,
      oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET
    });

    // Listening to incoming events.
    webhook.on('event', listenToEvents);
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();
