![hero](hero.jpg)
# Xenia Web Services

This is a Web API designed to support the Xenia XBox 360 emulator in providing Online and Multiplayer functionality. A [fork of Xenia-Canary](https://github.com/AdrianCassar/xenia-canary/tree/netplay_upnp_canary_experimental#netplay-fork) has been created for use with this web API.
It has been designed and developed specifically for Xenia, and does not represent or resemble any first-party XBox API.

This API was put together in one restless week, it's quite rough. If you'd like to help improve this, checkout the [open issues](https://github.com/ahnewark/Xenia-WebServices/issues)!


## Preparing the project

1. Install dependencies with the `npm install` command.
2. Create a `.env` file in the project root, following this structure:

```env
  API_PORT=36000
  MONGO_URI=
  SWAGGER_API=true
```

3. Build the web service with the `npm run build` command.

## Running the app

```bash
# development
$ npm run start

# watch mode
$ npm run start:dev

# production mode
$ npm run start:prod
```

## Adding Title Support

If you would like to add a title to this API, check out the `titles` folder for examples!

Titles can provide a 'title server' address, which is basically an IP address the game will try to connect to and use as a game-server. Not all games use the 'title server' system.

Titles can also provide 'port mappings', wherin you can reroute game ports for title servers or player communication. We recommend using ports 3600X for players and 3601X for title servers. If a title uses a random port, this can be captured as port 0, and mapped accordingly.

Titles must provide leaderboard configuration to push statistics to the API. This is more complicated and takes trial and error. I'd recommend selfhosting the API to debug this.

Finally, you can also throw any title-specific netplay related patches in the `patches` folder!
