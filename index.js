require('dotenv').config()
const { Autohook } = require('twitter-autohook');

(async start => {
  try {
    const webhook = new Autohook(
      {
        token: process.env.TWITTER_ACCESS_TOKEN,
        token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET,
        consumer_key: process.env.TWITTER_CONSUMER_KEY,
        consumer_secret: process.env.TWITTER_CONSUMER_SECRET,
        env: process.env.TWITTER_WEBHOOK_ENV,
        port: 5000
      }
    );
    
    // Removes existing webhooks
    await webhook.removeWebhooks();
    
    // Starts a server and adds a new webhook
    await webhook.start();
    
    // Subscribes to your own user's activity
    await webhook.subscribe({oauth_token: process.env.TWITTER_ACCESS_TOKEN, oauth_token_secret: process.env.TWITTER_ACCESS_TOKEN_SECRET});  

    webhook.on('event', async event => {
        // Don't worry, we'll start adding something more meaningful
        // in just a moment.
        console.log('You received an event!');
        console.log(event);

        
      });




  } catch (e) {
    // Display the error and quit
    console.error(e);
    process.exit(1);
  }
})();  
