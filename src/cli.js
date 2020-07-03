import arg from "arg";
import ora from "ora";
import errors from "./errors.json";
import prepare from "./prepare";
import { spawn } from "child_process";
import { promisify } from "util";

const parseArgs = (args) => {
  const parsed = arg({ "--ci": Boolean }, { argv: args.slice(2) });
  return { ci: parsed["--ci"] || false };
};

const cli = (rawArgs) => {
  const spinner = ora("Preparing").start();
  const args = parseArgs(rawArgs);
  prepare(args)
    .then((details) => {
      const summary = `${details.packageName} ${details.headVersion} @${details.headTag}`;
      spinner.succeed(`Publishing ${summary}`);
      const publish = spawn("npm", ["publish", "--dry-run"]);
      publish.stdout.pipe(process.stdout);
      publish.stderr.pipe(process.stderr);
    })
    .catch((error) => {
      const message = errors[error.message] || error.toString();
      spinner.fail(message);
      process.exit(1);
    });
};

export default cli;
