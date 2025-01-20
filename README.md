![hero](hero.jpg)

# Xenia Web Services

This is a Web API designed to support the Xenia Xbox 360 emulator in providing Online and Multiplayer functionality. A fork [Xenia Canary Netplay](https://github.com/AdrianCassar/xenia-canary) has been created for use with this Web API.
It has been designed and developed specifically for Xenia, and does not represent or resemble any first-party Xbox API.

If you'd like to help improve this project, you may report issues or contribute by submitting PRs.

## Project architecture

This project uses [NestJS](https://nestjs.com/) a Node.js framework using Typescript which follows the [CQRS](https://docs.nestjs.com/recipes/cqrs) model. In addition, [MongoDB](https://www.mongodb.com/) a document-oriented database (NoSQL database).

## Project Setup

1. Install [NodeJS](https://nodejs.org/).

2. Install MongoDB Compass, details below.

2. Copy the provided [.env.template](/.env.template) and rename it to `.env`.

3. Configure the `.env` file if needed.

4. Run [setup.bat](/setup.bat) script to automatically install and build the project.

5. Check the server is running by accessing the frontend at http://127.0.0.1:36000/.

### MongoDB Compass
Install [MongoDB Community Server](https://www.mongodb.com/try/download/community) to manage your database ([tutorial](https://www.youtube.com/watch?v=gDOKSgqM-bQ)).

If you plan to create a local database using MongoDB Compass it must be installed as a **network service** or use [MongoDB Atlas](https://www.mongodb.com/atlas/database) a cloud database for free.

## Hosting Services

**Heroku**\
You can easily setup and host this REST API on [Heroku](https://www.heroku.com/), however they do not offer a free tier.

**Vercel**\
[Vercel](https://vercel.com/) is another option and it offers a free tier. However, i don't know how easy it will be to setup and configure.

## Adding Title Support

<details>
  <summary>Expand for details</summary>

If you would like to add a title to this API, check out the `titles` folder for examples!

Titles can provide a 'title server' address, which is basically an IP address the game will try to connect to and use as a game-server. Not all games use the 'title server' system.

Titles can also provide 'port mappings', wherein you can reroute game ports for title servers or player communication. We recommend using ports 3600X for players and 3601X for title servers. If a title uses a random port, this can be captured as port 0, and mapped accordingly.

Port mappings are not a requirement it's an optional feature. It may be useful to map ports which conflict with Windows or Linux. Some titles may fail to work if ports are changed for example Source Engine games.

To find the ports the title opens you can use [cports](https://www.nirsoft.net/utils/cports.html) and filter by process or you can search through ```xenia.log``` with ```logging = true```.

Titles must provide leaderboard configuration to push statistics to the API. This is more complicated and takes trial and error. I'd recommend self-hosting the API to debug this.

Finally, you can also throw any title-specific netplay related patches in the `patches` folder!
</details>
