import gather_ from "./gather";
import { valid, compare, prerelease } from "semver";

const areBothSemvers = (v1, v2) => valid(v1) !== null && valid(v2) !== null;

const areEqual = (v1, v2) => compare(v1, v2) === 0;

const checkGitStatus = ({ gitStatus }) =>
  typeof gitStatus !== "string"
    ? ["Unable to determine Git status"]
    : gitStatus === ""
    ? []
    : ["Working directory is not clean"];

const checkGitBranch = ({ gitBranch }) =>
  gitBranch === null ? ["Unable to determine Git branch"] : [];

const checkHeadTag = ({ headTag }) =>
  typeof headTag !== "string"
    ? ["Unable to find a Git tag for HEAD"]
    : valid(headTag) === null
    ? ["Head tag is not a valid semver"]
    : [];

const checkPackageVersion = ({ packageVersion }) =>
  packageVersion === null
    ? ["Unable to determine package.json version"]
    : valid(packageVersion) === null
    ? ["Version in package.json is not a valid semver"]
    : [];

const checkVersionEquality = ({ headTag: v1, packageVersion: v2 }) =>
  areBothSemvers(v1, v2) && !areEqual(v1, v2)
    ? ["HEAD tag version and package.json version do not match"]
    : [];

const checkBranchAndVersion = ({ distTag, npmUser, gitBranch }) => {
  return gitBranch === null || distTag === npmUser || gitBranch === "master"
    ? []
    : ["Git branch must be 'master' for this version"];
};

const checkPackageTag = ({ packageTag, distTag }) =>
  distTag === null || packageTag === null || packageTag === distTag
    ? []
    : [`Tag '${packageTag}' in package.json conflicts with tag '${distTag}'`];

const checks = [
  checkGitStatus,
  checkGitBranch,
  checkHeadTag,
  checkPackageVersion,
  checkVersionEquality,
  checkBranchAndVersion,
  checkPackageTag,
];

const distTag = ({ headTag: v1, packageVersion: v2 }) =>
  areBothSemvers(v1, v2) && areEqual(v1, v2)
    ? (prerelease(v1) === null && "latest") || prerelease(v1)[0]
    : null;

const prepare = async ({ gather = gather_ } = {}) => {
  const gathered = await gather();
  const details = { ...gathered, distTag: distTag(gathered) };
  const errors = checks.reduce((all, check) => all.concat(check(details)), []);
  return { details, errors };
};

export default prepare;
