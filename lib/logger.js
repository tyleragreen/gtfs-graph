var winston = require('winston');

if (process.env.NODE_ENV !== 'test') {
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.Console)(),
            new (winston.transports.File)({ filename: 'foo.log' })
        ]
    });
} else {
    // while testing, log only to file, leaving stdout free for unit test status messages
    var logger = new (winston.Logger)({
        transports: [
            new (winston.transports.File)({ filename: 'foo.log' })
        ]
    });
}

module.exports = logger;
