import ora from "ora";
import prepare from "./prepare";
import { spawnSync } from "child_process";
import chalk from "chalk";

const cli = async () => {
  try {
    const spinner = ora("Preparing").start();
    const { details, errors } = await prepare();
    if (errors.length > 0) {
      const message =
        errors.length === 1
          ? "There was a problem"
          : `There were ${errors.length} problems`;
      spinner.fail(chalk.bold(message));
      errors.map((error) => console.log("-", chalk.cyan(error)));
    } else {
      spinner.succeed(
        `Publishing ${details.packageVersion} @${details.distTag}`
      );
      const args = ["publish", `--tag=${details.distTag}`];
      const npm = spawnSync("npm", args, { stdio: "inherit" });
      npm.on("close", (code) => console.log("closed with ${code}"));
    }
  } catch (e) {
    spinner.fail("Oops! Something went wrong, sorry");
    console.log(e);
  }
};

export default cli;
