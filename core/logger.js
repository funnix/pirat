const log4js = require('log4js');
QW = QW || {}
    // log4js.configure({
    //     appenders: [
    //         { type: 'console', category: 'db' },
    //         { type: 'console', category: 'classes' },
    //         { type: 'console', category: 'app' },
    //         { type: 'console', category: 'classTwo' },
    //         { type: 'console', category: 'FileRead' },
    //         { type: 'console', category: 'Mailer' },
    //         { type: 'console', category: 'Cron' }
    //     ]
    // });
log4js.configure({
    appenders: {
        out: { type: 'console' },
        task: {
            type: 'dateFile',
            filename: 'logs/task',
            pattern: '-dd.log',
            alwaysIncludePattern: true
        }
    },
    categories: {
        default: { appenders: ['out'], level: 'info' },
        classes: { appenders: ['out'], level: 'info' },
        app: { appenders: ['out'], level: 'info' },
        classTwo: { appenders: ['out'], level: 'info' },
        FileRead: { appenders: ['out'], level: 'info' },
        Mailer: { appenders: ['out'], level: 'info' },
        Cron: { appenders: ['out'], level: 'info' },
        ws: { appenders: ['out'], level: 'info' },
        Auth: { appenders: ['out'], level: 'info' },
        task: { appenders: ['task'], level: 'info' }
    }

})
QW.Logging = {};
QW.Logging.WS = log4js.getLogger('ws');
QW.Logging.db = log4js.getLogger('db');
QW.Logging.classes = log4js.getLogger('classes');
QW.Logging.APP = log4js.getLogger('app');
QW.Logging.classTwo = log4js.getLogger('classTwo');
QW.Logging.FileRead = log4js.getLogger('FileRead');
QW.Logging.Mailer = log4js.getLogger('Mailer');
QW.Logging.Cron = log4js.getLogger('Cron');
QW.Logging.AUTH = log4js.getLogger('Auth');


QW.Logging.APP.trace('Entering cheese testing');
QW.Logging.APP.debug('Got cheese.');
QW.Logging.APP.info('Cheese is Gouda.');
QW.Logging.APP.warn('Cheese is quite smelly.');
QW.Logging.APP.error('Cheese is too ripe!');
//exports.QW.Logging = QW.Logging;