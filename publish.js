import arg from "arg";
import { promisify } from "util";
import { join as join_ } from "path";
import { readFile as readFile_ } from "fs";
import { exec as exec_ } from "child_process";
import ora from "ora";
import { stdout } from "process";

const parseArgs = (args) => {
  const parsed = arg({ "--ci": Boolean }, { argv: args.slice(2) });
  return { ci: parsed["--ci"] || false };
};

const getIsClean = (exec) => {
  return exec("git status --porcelain")
    .then(({ stdout }) => {
      if (stdout !== "") throw new Error("not clean");
      return true;
    })
    .catch((e) => {
      throw new Error("CLEAN_CHECK_FAIL");
    });
};

const getHead = (exec) => {
  return exec("git describe --tags")
    .then(({ stdout }) => {
      const pattern = /^v(?<version>\d+\.\d+\.\d+)\-(?<tag>[a-z0-9]+)$/;
      const match = stdout.trim().match(pattern);
      if (!match) throw new Error("no match");
      return { headVersion: match.groups.version, headTag: match.groups.tag };
    })
    .catch((e) => {
      throw new Error("NO_VALID_TAG");
    });
};

const getNpmUser = async (exec) => {
  return exec("npm whoami")
    .then(({ stdout }) => stdout.trim())
    .catch(() => {
      throw new Error("NO_NPM_USER");
    });
};

const getPackageJson = async (readFile, join, cwd) => {
  try {
    const json = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    return { packageName: json.name, packageVersion: json.version };
  } catch (e) {
    throw new Error("NO_PACKAGE_JSON");
  }
};

const getBranch = async (exec) => {
  return exec("git rev-parse --abbrev-ref HEAD")
    .then(({ stdout }) => stdout.trim())
    .catch(() => {
      throw new Error("NO_BRANCH");
    });
};

const validate = (details) => {
  const { ci, packageVersion, headTag, headVersion, npmUser, branch } = details;
  const npmUserMap = ci ? null : { [npmUser]: /.*/ };
  const tagBranchMap = {
    latest: "master",
    beta: "develop",
    next: "develop",
    ...npmUserMap,
  };
  const invalidError =
    (packageVersion !== headVersion && "VERSION_MISMATCH") ||
    (!Object.keys(tagBranchMap).includes(headTag) && "TAG_PROHIBITED") ||
    (null === branch.match(tagBranchMap[headTag]) && "BRANCH_PROHIBITED") ||
    null;
  if (invalidError) throw invalidError;
  return details;
};

const getDetails = async (ci, readFile, join, cwd, exec) => {
  const [
    { packageName, packageVersion },
    { headTag, headVersion },
    npmUser,
    branch,
  ] = await Promise.all([
    getPackageJson(readFile, join, cwd),
    getHead(exec),
    ci ? null : getNpmUser(exec),
    getBranch(exec),
    getIsClean(exec),
  ]);
  return {
    ci,
    packageName,
    packageVersion,
    headTag,
    headVersion,
    npmUser,
    branch,
  };
};

const prepare = async ({
  ci = false,
  join = join_,
  readFile = promisify(readFile_),
  exec = promisify(exec_),
  cwd = process.cwd(),
} = {}) => {
  const details = await getDetails(ci, readFile, join, cwd, exec);
  return validate(details);
};

const errorMessages = {
  CLEAN_CHECK_FAIL: "The woking directory is not clean",
  NO_VALID_TAG: "Tag HEAD with 'v[major].[minor].[patch]-[dist-tag]'",
  NO_NPM_USER: "You are not logged in to npm",
  NO_PACKAGE_JSON: "Couldn't find a package.json file",
  NO_BRANCH: "Couldn't determine the git branch",
};

export const cli = (args) => {
  const toMessage = (error) => {
    return errorMessages[error.message] || error.toString();
  };
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
      spinner.fail(toMessage(error));
      process.exit(1);
    });
};

export default prepare;
