const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../resolvers');
const constants = require('../config/constants');
const { hostStartCardId } = require('../helpers/updatableId');
const NewPlayerJoinCard = require('../static/newPlayerJoinCard.json');

const joinSessionHelper = async (context, sessionCode, options) => {
  const contextOptions = options ? options : context.options;
  // validate user input sessionCode, fallback to user input if failed
  let session = await Resolvers.gameSession.getSession({ code: sessionCode });
  if (!session) {
    console.log("invalid session code:" + sessionCode);
    return await fallBackToUserInput(
      "Room cannot be found, please try again.",
      context,
      contextOptions
    );
  }

  // block user if join as a host
  if (session.host.aad === contextOptions.user.aad) {
    return await fallBackToUserInput(
      "You cannot join your own room as a host, please share the room code with others.",
      context
    );
  }

  // block user if the session is started or completed
  if (session.status === "start") {
    return await fallBackToUserInput(
      "This game session has already started.",
      context
    );
  }

  if (session.status === "complete") {
    return await fallBackToUserInput(
      "This game session is completed, please consider joining a new room.",
      context
    );
  }

  // add current user into the session.players
  await addPlayerToAwaitingSession(session, context, contextOptions);

  // get updated session
  session.players.push(contextOptions.user);

  // notify host that someone join the meeting, generate a link to start game
  await notifyHostToStartSession(session, context, contextOptions);
};

const addPlayerToAwaitingSession = async (session, context, contextOptions) => {
  await Resolvers.gameSession.addPlayerToSession({
    code: session.code,
    userId: contextOptions.user._id,
  });
  if (contextOptions.lastActivityId) {
    await context.context.deleteActivity(contextOptions.lastActivityId);
  }
  contextOptions.lastActivityId = (
    await context.context.sendActivity(
      `Successfully joined ${session.game.name} session ${session.code}, ` +
        "please wait for host to start the game."
    )
  ).id;
};

const notifyHostToStartSession = async (session, context, contextOptions) => {
  await Resolvers.proactiveMessage.notifyUpdatableIndividualCard(
    session.host.aad,
    generateHostNotificationCard(session, context, contextOptions),
    hostStartCardId(session.code)
  );
};

const fallBackToUserInput = async (errorMessage, context, contextOptions) => {
  await context.context.sendActivity(errorMessage);

  return await context.replaceDialog(
    constants.JOIN_SESSION_WATERFALL_DIALOG,
    contextOptions
  );
};

const generateHostNotificationCard = (session, context, contextOptions) => {
  const newPlayerJoinCard = CardFactory.adaptiveCard(NewPlayerJoinCard);
  newPlayerJoinCard.content.body[0].text = `New Member Joined: ${contextOptions.user.name}`;
  const playersStr = "- " + session.players.map((p) => p.name).join("\r- ");
  newPlayerJoinCard.content.body[2].text = playersStr;
  newPlayerJoinCard.content.actions[0].data.sessionCode = session.code;
  newPlayerJoinCard.content.actions[0].data.callbackAction = getCallbackActionFromGame(
    session
  );

  return newPlayerJoinCard;
};

const getCallbackActionFromGame = (session) => {
  switch (session.game._id.toString()) {
    case constants.SPYFALL_OBJ_ID:
      return constants.SPYFALL_START_CALLBACK;
    case constants.HEADSUP_OBJ_ID:
      return constants.HEADSUP_START_CALLBACK;
    default:
      throw new Error(
        `Game Id ${session.game._id} is not registerd in joinSessionDialog`
      );
  }
};

module.exports = {
  joinSessionHelper
};
