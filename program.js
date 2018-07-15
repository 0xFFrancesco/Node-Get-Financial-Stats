const program = require('./src/get-financial-stats');
const config  = require('./config');

program.execute(config, console.log);

