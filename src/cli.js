import arg from "arg";
import ora from "ora";
import errors from "./errors.json";
import prepare from "./prepare";

const parseArgs = (args) => {
  const parsed = arg({ "--ci": Boolean }, { argv: args.slice(2) });
  return { ci: parsed["--ci"] || false };
};

const cli = (args) => {
  const spinner = ora("Preparing").start();
  const parsed = parseArgs(args);
  prepare(parsed)
    .then((details) => {
      spinner.succeed(
        `Publishing ${details.packageName} ${details.headVersion} @${details.headTag}`
      );
      console.log(details);
    })
    .catch((error) => {
      const message = errors[error.message] || error.toString();
      spinner.fail(message);
      process.exit(1);
    });
};

export default cli;
