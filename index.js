require("dotenv").config();
const { Autohook } = require("twitter-autohook");
const fs = require('fs');


function isMention(event) {
  return "user_has_blocked" in event ? true : false;
}

(async (start) => {
  try {
    const webhook = new Autohook({
      token: process.env.TWITTER_ACCESS_TOKEN,
      token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
      consumer_key: process.env.TWITTER_CONSUMER_KEY,
      consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
      env: process.env.TWITTER_WEBHOOK_ENV,
      port: 5000,
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

      // if (isMention(event)) {
      //   console.log("----- DIT IS EEN MENTION -----");
      // }
      if (!isMention(event)) {
        return;
      }

      console.log(event);
      fs.writeFileSync('mention2.json', JSON.stringify(event));

    });
  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();
