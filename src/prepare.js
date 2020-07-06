import { promisify } from "util";
import { join as join_ } from "path";
import { readFile as readFile_ } from "fs";
import { exec as exec_ } from "child_process";

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
    const pkg = JSON.parse(await readFile(join(cwd, "package.json"), "utf8"));
    if (!/^\d+\.\d+\.\d+$/.test(pkg.version)) throw new Error("malformed");
    const pkgTag = (pkg.publishConfig && pkg.publishConfig.tag) || null;
    if (pkgTag === null) throw new Error("no tag");
    return {
      pkgTag,
      pkgName: pkg.name,
      pkgVersion: pkg.version,
    };
  } catch (e) {
    if (e.message === "malformed") throw new Error("PACKAGE_VERSION_MALFORMED");
    if (e.message === "no tag") throw new Error("NO_PACKAGE_TAG");
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
  const {
    ci,
    pkgVersion,
    headTag,
    headVersion,
    pkgTag,
    npmUser,
    branch,
  } = details;
  const npmUserMap = ci ? null : { [npmUser]: /.*/ };
  const tagBranchMap = {
    latest: "master",
    beta: "develop",
    next: "develop",
    ...npmUserMap,
  };
  const invalidError =
    (pkgVersion !== headVersion && "VERSION_MISMATCH") ||
    (pkgTag !== headTag && "VERSION_MISMATCH") ||
    (!Object.keys(tagBranchMap).includes(headTag) && "TAG_PROHIBITED") ||
    (null === branch.match(tagBranchMap[headTag]) && "BRANCH_PROHIBITED") ||
    null;
  if (invalidError) throw new Error(invalidError);
  return details;
};

const getDetails = async (ci, readFile, join, cwd, exec) => {
  const [
    { pkgName, pkgVersion, pkgTag },
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
    pkgName,
    pkgVersion,
    pkgTag,
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

export default prepare;
