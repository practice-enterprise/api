# API
## Requirements
- [node](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)

## Installation

```sh
yarn install
```

Create `.env` file in root with content:

```txt
D_CLIENT_ID="<Bot Id>"
D_CLIENT_SECRET="<OAuth bot secret>"
D_REDIRECT_URI="http://localhost:3000/oauth2/discord/callback"

# Currently Oauth flow for Canvas LMS not supported, only access tokens
# Only redirect uri is necessary
C_CLIENT_ID="<Canvas oauth id>"
C_CLIENT_SECRET="Oauth secret"

C_REDIRECT_URI="http://localhost:3000/oauth2/canvas/callback"

GOOGLE_APPLICATION_CREDENTIALS="./service.account.json"
ENC_KEY="<encryptionkey>"

# Login to API (JWT signing)
PASSWORDAPIBOT="supersecretpassword"
```

Notes:

1. GOOGLE_APPLICATION_CREDENTIALS is a service account with access to firestore
2. PASSWORDAPIBOT has to be the same value as the API's dotenv, otherwise you will get a 403 forbidden status code when launching the bot.

## Running

```sh
yarn serve
```
