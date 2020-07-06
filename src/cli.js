import arg from "arg";
import ora from "ora";
import errors from "./errors.json";
import prepare from "./prepare";
import { spawn } from "child_process";

const parseArgs = (args) => {
  const parsed = arg({ "--ci": Boolean }, { argv: args.slice(2) });
  return { ci: parsed["--ci"] || false };
};

const cli = (rawArgs) => {
  const spinner = ora("Preparing").start();
  const args = parseArgs(rawArgs);
  prepare(args)
    .then((details) => {
      const { packageName, headVersion, headTag } = details;
      spinner.succeed(`Publish ${packageName} v${headVersion} @${headTag}`);
      spawn("npm", ["publish"], { stdio: "inherit" });
    })
    .catch((error) => {
      const message = errors[error.message] || error.toString();
      spinner.fail(message);
      process.exit(1);
    });
};

export default cli;
