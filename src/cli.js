import arg from "arg";
import ora from "ora";
import errors from "./errors.json";
import prepare from "./prepare";
import { spawn } from "child_process";
import inquirer from "inquirer";

const parseArgs = (args) => {
  const parsed = arg({ "--ci": Boolean }, { argv: args.slice(2) });
  return { ci: parsed["--ci"] || false };
};

const getOptions = async (details) => {
  const ciOptions = ["publish", `--tag ${details.headTag}`, "--dry-run"];
  const askForOtp = () => {
    const message = "What is your npm OTP?";
    const prompt = { type: "number", name: "otp", message };
    return inquirer.prompt([prompt]);
  };
  return details.ci
    ? ciOptions
    : askForOtp().then((answers) => ciOptions.concat(`--otp ${answers.otp}`));
};

const cli = (rawArgs) => {
  const spinner = ora("Preparing").start();
  const args = parseArgs(rawArgs);
  prepare(args)
    .then((details) => {
      const { packageName, headVersion, headTag } = details;
      spinner.succeed(`Publish ${packageName} v${headVersion} @${headTag}`);
      return getOptions(details);
    })
    .then((options) => {
      console.log(options);
      const publish = spawn("npm", options);
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
