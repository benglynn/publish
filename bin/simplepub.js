#!/usr/bin/env node

const { spawn } = require("child_process");

spawn("npm", ["publish"], { stdio: "inherit" });
