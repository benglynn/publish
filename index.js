#!/usr/bin/env node

require = require("esm")(module);
require("./src/cli.js").default(process.argv);
