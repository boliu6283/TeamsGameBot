const { CardFactory } = require('botbuilder-core');
const Resolvers = require('../../resolvers');
const EndgameCard = require('../../static/endgameCard.json');

const headsupEndgameHelper = async (args) => {
    const { sessionCode, reason, loserAad } = args;
    const session = await Resolvers.gameSession.getSession({ code: sessionCode });

    if (!session) {
        throw Error(`Session ${session} cannot be found`);
    }

    // Send out Endgame Proactive Messages
    switch (reason) {
        case 'admitted':
            await handleAdmittedEndgame(session, loserAad);
            await creditScores(session, loserAad);
            break;
        case 'timeout':
            await handleTimeoutEndgame(session);
            await creditTimeoutScore(session);
            break;
        default:
            throw Error(`Unknown headsup endgame reason ${reason}`);
    }

    // Endgame session
    await Resolvers.gameSession.endSession({ code: session.code });

    // Clean up resources
    Resolvers.countdown.kill(session.code);

    // Send out restart card
    await sendRestartCard(session);
}

const creditScores = async (session, loserAad) => {
    const allPlayers = [...session.players];
    allPlayers.push(session.host);
    const loserName = allPlayers.find(p => p.aad === loserAad).name;

    // TODO: Calculate endgame score if there's a loser
    await Resolvers.proactiveMessage.notifySession(session.code,
        `TODO: Here is the endgame summary for ${loserName} a round`);
}

const creditTimeoutScore = async (session) => {
    // TODO: Calculate endgame score when timeout
    await Resolvers.proactiveMessage.notifySession(session.code,
        `TODO: Here is the endgame summary for timeout`);
}

const handleAdmittedEndgame = async (session, loserAad) => {
    const allPlayers = [...session.players];
    allPlayers.push(session.host);
    const loserName = allPlayers.find(p => p.aad === loserAad).name;

    // TODO: replace this into an adaptive card
    await Resolvers.proactiveMessage.notifySession(session.code,
        `TODO: Player **${loserName}** admitted saying the forbidden word.`);
}

const handleTimeoutEndgame = async (session) => {
    // TODO: replace this into an adaptive card
    await Resolvers.proactiveMessage.notifySession(session.code,
        `TODO: No one says any forbidden words. Great jobs everyone!`);
}

const sendRestartCard = async (session) => {
    const card = CardFactory.adaptiveCard(EndgameCard);
    card.content.actions[0].data.sessionCode = session.code;
    card.content.actions[1].data.sessionCode = session.code;
    card.content.actions[1].data.recreateSession = 'headsup';

    return await Resolvers.proactiveMessage.notifyIndividualCard(session.host.aad, card);
}

module.exports = {
    headsupEndgameHelper
}
