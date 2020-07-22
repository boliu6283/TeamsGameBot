// Copyright (c) Microsoft Corporation. All rights reserved.
// Licensed under the MIT License.

// index.js is used to setup and configure your bot

// Import required packages
const fs = require('fs')
const path = require("path");
const restify = require("restify");
const mongoose = require('mongoose');

// Import required bot services.
// See https://aka.ms/bot-services to learn more about the different parts of a bot.
const {
  BotFrameworkAdapter,
  ConversationState,
  InputHints,
  MemoryStorage,
  UserState,
} = require("botbuilder");
const { LuisRecognizer } = require("botbuilder-ai");
const { MicrosoftAppCredentials } = require('botframework-connector');

// This bot's main dialog.
const { DialogBot } = require("./bots/dialogBot");
const { MainDialog } = require("./dialogs/mainDialog");
const Resolver = require("./resolvers");

// Note: Ensure you have a .env file and include LuisAppId, LuisAPIKey and LuisAPIHostName.
const ENV_FILE = path.join(__dirname, ".env");
require("dotenv").config({ path: ENV_FILE });

// Use .env DebugMode = emulator to enable local bot-emulator debug
// Set id & psw to empty for localhost (when testing on bot-emulator)
if (process.env.DebugMode === 'emulator' && !process.env.port && !process.env.PORT) {
  console.log('Environment .env DebugMode="emulator", using local bot-emulator debug');
  process.env.MicrosoftAppId = '';
  process.env.MicrosoftAppPassword = '';
} else if (process.env.DebugMode === 'teams') {
  console.log('Environment .env DebugMode="teams", using teams app studio debug');
}

// Create adapter.
// See https://aka.ms/about-bot-adapter to learn more about adapters.
const adapter = Resolver.botAdapter.getInstance(
  process.env.MicrosoftAppId,
  process.env.MicrosoftAppPassword);

// Register trust service url endpoint
// MicrosoftAppCredentials.trustServiceUrl("https://smba.trafficmanager.net/");

// Catch-all for errors.
const onTurnErrorHandler = async (context, error) => {
  // This check writes out errors to console log .vs. app insights.
  // NOTE: In production environment, you should consider logging this to Azure
  //       application insights.
  console.error(error);

  // Send a trace activity, which will be displayed in Bot Framework Emulator
  await context.sendTraceActivity(
    "OnTurnError Trace",
    `${error}`,
    "https://www.botframework.com/schemas/error",
    "TurnError"
  );

  // Send a message to the user
  if (process.env.DebugMode === 'emulator') {
    let onTurnErrorMessage = "The bot encountered an error or bug.";
    await context.sendActivity(
      onTurnErrorMessage,
      onTurnErrorMessage,
      InputHints.ExpectingInput
    );
    onTurnErrorMessage = "To continue to run this bot, please fix the bot source code.";
    await context.sendActivity(
      onTurnErrorMessage,
      onTurnErrorMessage,
      InputHints.ExpectingInput
    );
  }
  // Clear out state
  await conversationState.delete(context);
};

// Set the onTurnError for the singleton BotFrameworkAdapter.
adapter.onTurnError = onTurnErrorHandler;

// Define a state store for your bot. See https://aka.ms/about-bot-state to learn more about using MemoryStorage.
// A bot requires a state store to persist the dialog and user state between messages.

// For local development, in-memory storage is used.
// CAUTION: The Memory Storage used here is for local bot debugging only. When the bot
// is restarted, anything stored in memory will be gone.
const memoryStorage = new MemoryStorage();
const conversationState = new ConversationState(memoryStorage);
const userState = new UserState(memoryStorage);

// Create conversation reference for proactive message
const conversationReferences = {};

// LuisConfiguration Section
const luisRecognizer = new LuisRecognizer({
    applicationId: process.env.LuisAppId,
    endpointKey: process.env.LuisAPIKey,
    endpoint: `https://${process.env.LuisAPIHostName}`,
  },
  {
    apiVersion: 'v3'
  }
);

// Create the main dialog
const mainDialog = new MainDialog(luisRecognizer);
const mainBot = new DialogBot(conversationReferences, conversationState, userState, mainDialog);

// Connect to Mongo DB
mongoose.connect(process.env.db, {
  bufferMaxEntries: 0,
  socketTimeoutMS: 0,
  keepAlive: true,
  useUnifiedTopology: true,
  useCreateIndex: true,
  useNewUrlParser: true,
  useFindAndModify: false
});

/**
 * Throw error when not able to connect to database
 */
mongoose.connection.on('error', () => {
  throw new Error(`unable to connect to database: ${process.env.db}`);
});

// Create HTTP server
const server = restify.createServer();
server.listen(process.env.port || process.env.PORT || 3978, function () {
  console.log(`\n${server.name} listening to ${server.url}`);
  console.log("\nGet Bot Framework Emulator: https://aka.ms/botframework-emulator");
  console.log('\nTo talk to your bot, open the emulator select "Open Bot"');
});

// Static Pages: Privacy, Service Agreement, Home Page
const Resources = require('./config/resources');

server.get('/privacy', (req, res, next) => {
  const body = fs.readFileSync(Resources.PRIVACY_PATH, { encoding: 'utf-8', flag: 'r' });
  res.setHeader('Content-Type', 'text/html');
  res.write(body);
  res.end();
  return next();
});

server.get('/serviceagreement', (req, res, next) => {
  const body = fs.readFileSync(Resources.SERVICE_AGREEMENT_PATH, { encoding: 'utf-8', flag: 'r' });
  res.setHeader('Content-Type', 'text/html');
  res.write(body);
  res.end();
  return next();
});

server.get('/favicon.ico', (req, res, next) => {
  const body = fs.readFileSync(Resources.FAVICON_PATH);
  res.setHeader('Content-Type', 'image/x-icon');
  res.write(body);
  res.end();
  return next();
});

server.get('/', (req, res, next) => {
  const body = fs.readFileSync(Resources.HOME_PATH, { encoding: 'utf-8', flag: 'r' });
  res.setHeader('Content-Type', 'text/html');
  res.write(body);
  res.end();
  return next();
});

// Listen for incoming activities and route them to your bot main dialog.
server.post("/api/messages", (req, res) => {
  // Route received a request to adapter for processing
  adapter.processActivity(req, res, async (turnContext) => {
    // route to bot activity handler.
    await mainBot.run(turnContext);
  });
});

// Listen for Upgrade requests for Streaming.
server.on("upgrade", (req, socket, head) => {
  // Create an adapter scoped to this WebSocket connection to allow storing session data.
  const streamingAdapter = new BotFrameworkAdapter({
    appId: process.env.MicrosoftAppId,
    appPassword: process.env.MicrosoftAppPassword,
  });
  // Set onTurnError for the BotFrameworkAdapter created for each connection.
  streamingAdapter.onTurnError = onTurnErrorHandler;

  streamingAdapter.useWebSocket(req, socket, head, async (context) => {
    // After connecting via WebSocket, run this logic for every request sent over
    // the WebSocket connection.
    await mainBot.run(context);
  });
});
