import { promisify } from "util";
import { join } from "path";
import { readFile as readFile_ } from "fs";
import { exec as exec_ } from "child_process";

const stdoutOrNull_ = (exec) => (command) => {
  return exec(command)
    .then(({ stdout }) => stdout.trim())
    .catch((e) => null);
};

const jsonFileOrNull_ = (readFile) => (path) =>
  readFile(path, "utf8")
    .then((contents) => JSON.parse(contents))
    .catch((e) => null);

const parsePackage = (pkg) => {
  return pkg === null
    ? { packageVersion: null, packageTag: null }
    : {
        packageVersion: pkg.version,
        packageTag: (pkg.publishConfig && pkg.publishConfig.tag) || null,
      };
};

const gather = ({
  exec = promisify(exec_),
  readFile = promisify(readFile_),
  packagePath = join(process.cwd(), "package.json"),
} = {}) => {
  const stdoutOrNull = stdoutOrNull_(exec);
  const jsonFileOrNull = jsonFileOrNull_(readFile);
  return Promise.all([
    stdoutOrNull("git status --porcelain"),
    stdoutOrNull("git rev-parse --abbrev-ref HEAD"),
    stdoutOrNull("git describe --tags"),
    stdoutOrNull("npm whoami"),
    jsonFileOrNull(packagePath).then(parsePackage),
  ]).then(
    ([
      gitStatus,
      gitBranch,
      headTag,
      npmUser,
      { packageVersion, packageTag },
    ]) => ({
      gitStatus,
      gitBranch,
      headTag,
      npmUser,
      packageVersion,
      packageTag,
    })
  );
};

export default gather;
