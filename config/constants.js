module.exports = {
    // Dialog IDs
    MAIN_DIALOG: 'mainDialog',

    WELCOME_DIALOG: 'welcomeDialog',
    WELCOME_WATERFALL_DIALOG: 'welcomeWaterfallDialog',
    SPYFALL_DIALOG: 'spyfallDialog',
    SPYFALL_WATERFALL_DIALOG: 'spyfallWaterfallDialog',
    SPYFALL_GUESS_DIALOG: 'spyfallGuessDialog',
    SPYFALL_RAISE_POLL_DIALOG: 'spyfallRaisePollDialog',
    SPYFALL_POLL_RESULT_COLLECT_DIALOG: 'spyfallPollResultCollectDialog',

    HEADSUP_DIALOG: 'headsupDialog',
    HEADSUP_WATERFALL_DIALOG: 'headsupWaterfallDialog',
    HEADSUP_RESULT_COLLECT_DIALOG: 'headsupResultCollectDialog',

    GAME_CHOICE_DIALOG: 'gameChoiceDialog',
    GAME_WATERFALL_DIALOG: 'gameWaterfallDialog',

    RANK_DIALOG: 'rankDialog',
    RANK_WATERFALL_DIALOG: 'rankWaterfallDialog',

    JOIN_SESSION_DIALOG: 'joinSessionDialog',
    JOIN_SESSION_CARD_PROMPT: 'joinSessionCardPrompt',
    JOIN_SESSION_WATERFALL_DIALOG: 'joinSessionWaterfallDialog',

    CREATE_SESSION_DIALOG: 'createSessionDialog',
    CREATE_SESSION_WATERFALL_DIALOG: 'createSessionWaterfallDialog',

    // Game ObjIds
    SPYFALL_OBJ_ID = '5ef2cda211846b2ac0225533',
    HEADSUP_OBJ_ID = '5ef2ce5810018e475c941ce1',

    // Proactive Message Callbacks
    // Spyfall Start Game Proactive Message Callbacks
    SPYFALL_START_CALLBACK: 'StartSpyfall',
    HEADSUP_START_CALLBACK: 'StartHeadsUp',

    // Conversation State constants
    DIALOG_STATE: 'DialogState',

    // User State constants
    USER_PROFILE_STATE: 'UserProfileState',

    // Proactive message updatable ID
    COUNTDOWN_UPDATABLE: 'countdown',
    POLL_UPDATABLE: 'poll',
    POLL_WAITING_UPDATABLE: 'pollWaiting',
    ACTION_UPDATABLE: 'action',

    // Configurations
    SPYFALL_TURN_PER_PERSON_SEC: 10,
    HEADSUP_TURN_PER_PERSON_SEC: 60,
    HEADSUP_ENDGAME_SCORE_INCREMENT: 20,
    HEADSUP_TIMEOUT_SCORE_INCREMENT: 10,
    DEFAULT_COUNTDOWN_INTERVAL_SEC: 10,
}
