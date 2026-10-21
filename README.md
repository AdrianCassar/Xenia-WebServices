![hero](hero.jpg)

# Xenia Web Services

Xenia Web Services is a REST API that provides online and multiplayer functionality for the [Xenia](https://xenia.jp/) Xbox 360 emulator. It is used by [Xenia Canary Netplay](https://github.com/AdrianCassar/xenia-canary), a fork of Xenia Canary built to work with this API.

It has been designed and developed specifically for Xenia, and does not represent or resemble any first-party Xbox API.

Contributions are welcome - feel free to report issues or submit pull requests.

## Features

- **Sessions & matchmaking**: create, search and join multiplayer sessions.
- **XNet**: player and network address lookup for peer-to-peer connections.
- **Leaderboards**: read and write title leaderboard stats.
- **Title & user storage (XStorage)**: serve title-managed storage and store per-user data.
- **Web frontend**: view active sessions and the game compatibility list at the server root.
- **Swagger docs**: interactive API documentation at `/api`.

## Getting started

### Prerequisites

- [Node.js](https://nodejs.org/) 22 or 24
- A MongoDB instance, either:
  - [MongoDB Community Server](https://www.mongodb.com/try/download/community) installed locally **as a network service** (optionally with [MongoDB Compass](https://www.mongodb.com/products/tools/compass) to browse the database), or
  - a free cloud database on [MongoDB Atlas](https://www.mongodb.com/atlas/database)

### Setup

1. Clone the repository, including submodules (required for title storage):

   ```bash
   git clone --recurse-submodules https://github.com/AdrianCassar/Xenia-WebServices.git
   ```

2. Copy [.env.template](.env.template) to `.env` and adjust it if needed (see [Configuration](#configuration)).

3. Install and build:

   ```bash
   npm install
   npm run build
   ```

   On Windows you can instead run [setup.bat](setup.bat) and choose **Setup Server**, which installs, builds and creates `.env` for you.

4. Start the server:

   ```bash
   npm start
   ```

5. Open http://127.0.0.1:36000/ to check the server is running. If Swagger is enabled, the API docs are at http://127.0.0.1:36000/api.

For development with auto-reload, use `npm run start:dev`.

## Configuration

Settings are read from environment variables or the `.env` file:

| Variable       | Default                        | Description                                                         |
| -------------- | ------------------------------ | ------------------------------------------------------------------- |
| `API_PORT`     | `36000`                        | Port the server listens on (`PORT` takes precedence if set).        |
| `MONGO_URI`    | `mongodb://127.0.0.1:27017/`   | MongoDB connection string.                                          |
| `SWAGGER_API`  | `true`                         | Serve Swagger API docs at `/api`.                                   |
| `SSL`          | `false`                        | Upgrade insecure requests on the frontend when served over HTTPS.  |
| `nginx`        | `false`                        | Trust proxy headers when running behind Nginx.                      |
| `heroku_nginx` | `false`                        | Listen on the Heroku Nginx buildpack socket instead of a port.      |
| `xstorage`     | `false`                        | Enable the `/xstorage` title and user storage endpoints.            |

## License

This project is licensed under the [MIT License](LICENSE).
