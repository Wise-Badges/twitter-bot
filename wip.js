var fs = require('fs');
const axios = require('axios');


let globalData;

try {
    const data = fs.readFileSync('mention2.json', 'utf8');
    // console.log(data);    
    globalData = data;
} catch(e) {
    console.log('Error:', e.stack);
}

function getSenderName(tweet){
    return tweet.tweet_create_events[0].user.name
}

function getSenderUrl(tweet){
    return 'https://twitter.com/' + tweet.tweet_create_events[0].user.screen_name
}

function getBadge(tweet){

    return 'https://twitter.com/' + tweet.tweet_create_events[0].user.screen_name
}



function filterData(event){
    // console.log(event)
    console.log(getSenderName(event))
    console.log(getSenderUrl(event))
    
    console.log(event.tweet_create_events[0].extended_tweet.entities.hashtags[0].text)



}

filterData(JSON.parse(globalData))