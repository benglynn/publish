#!/usr/bin/env node

require = require("esm")(module);
require("./publish.js").cli(process.argv);
