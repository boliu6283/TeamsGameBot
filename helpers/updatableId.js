const constants = require('../config/constants');

const countdownMessageId = (sessionCode) =>
    `${sessionCode}_${constants.COUNTDOWN_UPDATABLE}`;

const pollCardId = (sessionCode) =>
    `${sessionCode}_${constants.POLL_UPDATABLE}`;

const actionCardId = (sessionCode) =>
    `${sessionCode}_${constants.ACTION_UPDATABLE}`;

module.exports = {
    countdownMessageId,
    pollCardId,
    actionCardId
}
