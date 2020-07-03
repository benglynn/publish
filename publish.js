import arg from "arg";
import { promisify } from "util";
import { join as join_ } from "path";
import { readFile as readFile_ } from "fs";
import { exec as exec_ } from "child_process";
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

const getTagBranchMap_ = (npmUser) => ({
  latest: "master",
  beta: "develop",
  [npmUser]: /.*/,
});

const validate = (getTagBranchMap, details) => {
  const { packageVersion, headTag, headVersion, npmUser, branch } = details;
  const tagBranchMap = getTagBranchMap(npmUser);
  const invalidError =
    (packageVersion !== headVersion && "VERSION_MISMATCH") ||
    (!Object.keys(tagBranchMap).includes(headTag) && "TAG_PROHIBITED") ||
    (null === branch.match(tagBranchMap[headTag]) && "BRANCH_PROHIBITED") ||
    null;
  if (invalidError) throw invalidError;
  return details;
};

const getDetails = async (readFile, join, cwd, exec) => {
  const [
    isClean,
    { packageName, packageVersion },
    { headTag, headVersion },
    npmUser,
    branch,
  ] = await Promise.all([
    getIsClean(exec),
    getPackageJson(readFile, join, cwd),
    getHead(exec),
    getNpmUser(exec),
    getBranch(exec),
  ]);
  return {
    packageName,
    packageVersion,
    headTag,
    headVersion,
    npmUser,
    branch,
  };
};

const publish = async ({
  ci = false,
  join = join_,
  readFile = promisify(readFile_),
  exec = promisify(exec_),
  cwd = process.cwd(),
  getTagBranchMap = getTagBranchMap_,
} = {}) => {
  const details = validate(
    getTagBranchMap,
    await getDetails(readFile, join, cwd, exec)
  );
  return { ci, ...details };
};

export const cli = (args) => {
  console.log(process.cwd());
  const parsed = parseArgs(args);
  publish(parsed)
    .then((result) => console.log(result))
    .catch((error) => {
      console.error(`Error! ${error}`);
      process.exit(1);
    });
};

export default publish;
