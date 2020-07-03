#!/usr/bin/env node

require = require("esm")(module);
const cli = require("./src/cli.js").default(process.argv);
