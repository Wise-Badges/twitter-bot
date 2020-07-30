# twitter-bot

Twitter Bot is built to communicate with the users of WiseBadges through Twitter. From the front-end, the user is sent to Twitter to issue a badge just by posting a tweet. The Twitter Bot will see this tweet, and notify the recipient of the badge with another tweet which has a link to the front-end page of the badge (where all options will be shown: how to accept, delete, .. an assertion/badge). The deleting and accepting of a badge also happens through Twitter. Liking the post will accept the badge and commenting "delete" or "invoke" in any way will delete the badge, as well as a specially constructed delete tweet. Accepting the badge can only be done by the recipient, deleting/invoking the badge can only be done by either recipient or sender.

## Installation

Use the package manager [npm](https://www.npmjs.com/) to install dependancies.

```bash
npm install
```

## Usage

```
 node .\index.js
```

## Contributing

Pull requests are welcome. For major changes, please open an issue first to discuss what you would like to change.

## License

[MIT](https://choosealicense.com/licenses/mit/)

## Notes

We now work with screen_name, for example we could also work with the twitter user 'id_str' so we are always 100% sure we have the right user because you can change the 'screen_name'.

