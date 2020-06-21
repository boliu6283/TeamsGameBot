# GameBot

### Epic
Gamify working environment with a online Teams board game lobby to tighten up colleagues bonds in unprecedented time.

### Stack
- [Bot Framework](https://dev.botframework.com) on Teams to support P2P/GroupChat communication.
  - [JavaScript API Reference](https://docs.microsoft.com/en-us/javascript/api/botbuilder/?view=botbuilder-ts-latest)
- [LUIS Text Intent Recognition](https://www.luis.ai) to implement core AI natural language processing capabilities.
  - [JavaScript API Reference](https://docs.microsoft.com/en-us/javascript/api/botbuilder-ai/luisrecognizer?view=botbuilder-ts-latest)
- [MongoDB](https://www.mongodb.com/) as database backend
  - [Quick Start](https://docs.mongodb.com/manual/tutorial/getting-started/)
- [NodeJs v12](https://nodejs.org/en/) as node interpreter to start up server process
  - [JavaScript ES6 QuickStart](https://www.codespot.org/javascript-101-es6-and-beyond/)
  - [Node Package Manager (npm) & package.json](https://nodesource.com/blog/an-absolute-beginners-guide-to-using-npm/)

### Prerequisites

**Essential**
- [NodeJs v12 LTS](https://nodejs.org/dist/v12.18.1/node-v12.18.1-x64.msi)
- [NGROK Port Forwarder](https://ngrok.com/download)
- [MongoDB Client VSCode Extensions](https://marketplace.visualstudio.com/items?itemName=mongodb.mongodb-vscode)

**Optional**
- [ESLint VSCode Extensions](https://marketplace.visualstudio.com/items?itemName=dbaeumer.vscode-eslint)
- [EditorConfig VSCode Extensions](https://marketplace.visualstudio.com/items?itemName=EditorConfig.EditorConfig)

### Setup Development Environment
1. Ensure `nodejs>=12.` is installed
   1. Open a shell (cmd/powershell), `node --version` should return `v12.x.x`
   2. `npm --version` should return `6.x.x`
2. Ensure `ngrok` is installed
   1. `.\ngrok.exe --version` should return `ngrok version 2.x.x`
4. Git Clone this repository
5. Resolve the NodeJs package.json dependencies using `npm install`
   1. [GIF Placeholder]()
6. Create a personal Microsoft Teams application for development
   1. Go to Microsoft Teams => Left Panel => **...** => Search "App Studio"
      1. [GIF Placeholder]()
   2. Fill in the information for your new bot
      1. In Bots section, **DO NOT CHECK** "one-way communication"
      2. [GIF Placeholder]()
7. Setup environment `./.env` correctly
   1. `MicrosoftAppId` = `App Studio => Bots => UUID above "App passwords"`
   2. `MicrosoftAppPassword` = `App Studio => Bots => App passwords`
   3. `db` = `Mongo db connection string (acquire from teammates' setting)`
   4. `DebugMode` = `**emulator** for local bot-emulator debug, **teams** for remote debug`
   5. [GIF Placeholder]()

### Everyday Development
1. Sync the repository by `git pull` or `git fetch; git rebase`.
2. Start the bot server with `npm run start` or **VSCode F5**
3. After the server starts up, use `ngrok.exe http 3978 -host-header=localhost:3978` to expose your local port into public. **DO NOT TURN OFF ngrok.exe when restarting NodeJs server**. Otherwise, you need to replay step 4.
4. Change bot message endpoint
5. [GIF Placeholder]()

### LUIS application to enable language understanding

The LUIS model for this example can be found under `cognitiveModels/FlightBooking.json` and the LUIS language model setup, training, and application configuration steps can be found [here](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-howto-v4-luis?view=azure-bot-service-4.0&tabs=javascript).

Once you created the LUIS model, update `.env` with your `LuisAppId`, `LuisAPIKey` and `LuisAPIHostName`.

```text
LuisAppId="Your LUIS App Id"
LuisAPIKey="Your LUIS Subscription key here"
LuisAPIHostName="Your LUIS App region here (i.e: westus.api.cognitive.microsoft.com)"
```

## Testing the bot using Bot Framework Emulator

[Bot Framework Emulator](https://github.com/microsoft/botframework-emulator) is a desktop application that allows bot developers to test and debug their bots on localhost or running remotely through a tunnel.

- Install the Bot Framework Emulator version 4.3.0 or greater from [here](https://github.com/Microsoft/BotFramework-Emulator/releases)

### Connect to the bot using Bot Framework Emulator

- Launch Bot Framework Emulator
- File -> Open Bot
- Enter a Bot URL of `http://localhost:3978/api/messages`

## Deploy the bot to Azure

To learn more about deploying a bot to Azure, see [Deploy your bot to Azure](https://aka.ms/azuredeployment) for a complete list of deployment instructions.

## Further reading

- [Bot Framework Documentation](https://docs.botframework.com)
- [Bot Basics](https://docs.microsoft.com/azure/bot-service/bot-builder-basics?view=azure-bot-service-4.0)
- [Dialogs](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-dialog?view=azure-bot-service-4.0)
- [Gathering Input Using Prompts](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-prompts?view=azure-bot-service-4.0)
- [Activity processing](https://docs.microsoft.com/en-us/azure/bot-service/bot-builder-concept-activity-processing?view=azure-bot-service-4.0)
- [Azure Bot Service Introduction](https://docs.microsoft.com/azure/bot-service/bot-service-overview-introduction?view=azure-bot-service-4.0)
- [Azure Bot Service Documentation](https://docs.microsoft.com/azure/bot-service/?view=azure-bot-service-4.0)
- [Azure CLI](https://docs.microsoft.com/cli/azure/?view=azure-cli-latest)
- [Azure Portal](https://portal.azure.com)
- [Language Understanding using LUIS](https://docs.microsoft.com/en-us/azure/cognitive-services/luis/)
- [Channels and Bot Connector Service](https://docs.microsoft.com/en-us/azure/bot-service/bot-concepts?view=azure-bot-service-4.0)
- [Restify](https://www.npmjs.com/package/restify)
- [dotenv](https://www.npmjs.com/package/dotenv)
