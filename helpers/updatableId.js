const constants = require('../config/constants');

const countdownMessageId = (sessionCode) =>
    `${sessionCode}_${constants.COUNTDOWN_UPDATABLE}`;

const hostStartCardId = (sessionCode) =>
    `${sessionCode}_${constants.HOST_START_UPDATABLE}`;

const pollCardId = (sessionCode) =>
    `${sessionCode}_${constants.POLL_UPDATABLE}`;

const pollWaitingId = (sessionCode) =>
    `${sessionCode}_${constants.POLL_WAITING_UPDATABLE}`;

const actionCardId = (sessionCode) =>
    `${sessionCode}_${constants.ACTION_UPDATABLE}`;

module.exports = {
    countdownMessageId,
    hostStartCardId,
    pollCardId,
    pollWaitingId,
    actionCardId
}
