var winston = require('winston');

var filename = 'log.out';
var logger;

if (process.env.NODE_ENV !== 'test') {
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: filename })
        ]
    });
} else {
    // while testing, log only to file, leaving stdout free for unit test status messages
    logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: filename })
        ]
    });
}

module.exports = logger;
