//Imports
require('dotenv').config();
const { Autohook } = require('twitter-autohook');
const handleLike = require('./handlers/handleLike');
const handleMention = require('./handlers/handleMention');

const listenToEvents = async (event) => {
  console.log('You received an event!');

  let handleEvent;
  if ('user_has_blocked' in event) handleEvent = handleMention;
  else if ('favorite_events' in event) handleEvent = handleLike;
  else handleEvent = () => {};

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
