const program = require('./get-financial-stats');
const config  = require('./config');

program.execute(config, console.log);

