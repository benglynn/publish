import ora from "ora";
import prepare from "./prepare";
import { spawn } from "child_process";
import chalk from "chalk";

const cli = async () => {
  const spinner = ora("Preparing").start();
  try {
    const { details, errors } = await prepare();
    if (errors.length > 0) {
      const message =
        errors.length === 1
          ? "There was a problem"
          : `There were ${errors.length} problems`;
      spinner.fail(chalk.bold(message));
      errors.map((error) => console.log("-", chalk.cyan(error)));
      if (!process.stdout.isTTY) process.exit(1);
    } else {
      spinner.succeed(
        `Publishing ${details.packageVersion} @${details.distTag}`
      );
      const args = ["publish", `--tag=${details.distTag}`];
      spawn("npm", args, { stdio: "inherit" });
    }
  } catch (e) {
    spinner.fail("Oops! Something went wrong, sorry. Here's the error:");
    console.log(e);
    if (!process.stdout.isTTY) process.exit(1);
  }
};

export default cli;
