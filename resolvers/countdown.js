const { getSession } = require('./gameSession');
const { notifySession } = require('./proactiveMessage');
const constants = require('../config/constants');

// { sessionCode: SessionCountdown }
let _countdownTimer = {};

class SessionCountDown {
  constructor(session, intervalSec, finishCallback) {
    this._session = session;
    this._interval = null;
    this._intervalSec = intervalSec;
    this._finishCallback = finishCallback;

    this._lastPause = null;
    this._pauseDurationMs = 0;
  }

  start() {
    this._interval = setInterval(async () => {
      await this.handleCountdownEvent();
    }, this._intervalSec * 1000);
  }

  stop() {
    if (this._interval) {
      clearInterval(this._interval);
    }
    this._interval = null;
  }

  pause() {
    this._lastPause = new Date();
  }

  resume() {
    this._pauseDurationMs = (new Date().getTime() - this._lastPause.getTime());
    this._lastPause = null;
  }

  hasFinished() {
    return !this._interval || this.getReminingSeconds() <= 0;
  }

  getReminingSeconds() {
    const currentTime = (new Date()).getTime();
    const endTime = this._session.expectedToEndAt.getTime() + this._pauseDurationMs;
    const result = Math.floor((endTime - currentTime) / 1000);
    return Math.max(result, 0);
  }

  async handleCountdownEvent() {
    if (this.hasFinished()) {
      this.stop();
      this._finishCallback();
    } else {
      const reminingSec = this.getReminingSeconds();
      await notifySession(
        this._session.code,
        `Game session ${this._session.code} remains ${reminingSec} seconds.`);
    }
  }
}

const checkIfExist = (sessionCode) => Boolean(_countdownTimer[sessionCode]);

const register = async (sessionCode, intervalSec, finishCallback) => {
  const session = await getSession({ code: sessionCode });
  if (!(session || {}).expectedToEndAt) {
    throw new Error(
      `The session ${session.code} is missing expectedToEndAt, cannot register countdown.`
    );
  }

  _countdownTimer[session.code] = new SessionCountDown(session, intervalSec, finishCallback);
  _countdownTimer[session.code].start();
}

const restart = async (sessionCode) => {
  const countdown = _countdownTimer[sessionCode];
  if (countdown) {
    countdown.start();
  }
}

const pause = (sessionCode) => {
  const countdown = _countdownTimer[sessionCode];
  if (countdown) {
    countdown.pause();
  }
}

const resume = (sessionCode) => {
  const countdown = _countdownTimer[sessionCode];
  if (countdown) {
    countdown.resume();
  }
}

module.exports = {
  checkIfExist,
  register,
  restart,
  pause,
  resume
}
