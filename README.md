# API
## Requirements
- [node](https://nodejs.org/en/)
- [yarn](https://yarnpkg.com/getting-started/install)

## Installation
```
yarn install
```

create `.env` file in root with content for database 
```
D_CLIENT_ID="<Bot Id>"
D_CLIENT_SECRET="<OAuth bot secret>"
D_REDIRECT_URI="http://localhost:3000/oauth2/discord/callback"

GOOGLE_APPLICATION_CREDENTIALS="./service.account.json"
```
Note: GOOGLE_APPLICATION_CREDENTIALS is a service account with access to firestore

## Running

```
yarn serve
```
