const stdoutOrNull_ = (exec) => (command) => {
  return exec(command)
    .then(({ stdout }) => stdout.trim())
    .catch((e) => null);
};

const jsonFileOrNull_ = (readFile) => (path) =>
  readFile(path, "utf8")
    .then((contents) => JSON.parse(contents))
    .catch((e) => null);

const parsePackage = (packageJson) => ({
  packageVersion: packageJson.version,
  packageTag:
    (packageJson.publishConfig && packageJson.publishConfig.tag) || null,
});

const gather = (exec, readFile, packagePath) => {
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
