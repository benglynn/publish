import gather_ from "./gather";
import { valid, compare, prerelease } from "semver";

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
    ? ["Unable to find a tag for HEAD"]
    : valid(headTag) === null
    ? ["Head tag is not a valid semver"]
    : [];

const checkPackageVersion = ({ packageVersion }) =>
  packageVersion === null
    ? ["Unable to determine package.json version"]
    : valid(packageVersion) === null
    ? ["Version in package.json is not a valid semver"]
    : [];

const areBothSemvers = (v1, v2) => valid(v1) !== null && valid(v2) !== null;

const areEqual = (v1, v2) => compare(v1, v2) === 0;

const checkVersionEquality = ({ headTag: v1, packageVersion: v2 }) =>
  areBothSemvers(v1, v2) && !areEqual(v1, v2)
    ? ["HEAD tag version and package.json version do not match"]
    : [];

const checkBranchAndVersion = ({ distTag, npmUser, gitBranch }) => {
  return gitBranch === null || distTag === npmUser || gitBranch === "master"
    ? []
    : ["Git branch must be 'master' for this version"];
};

const checks = [
  checkGitStatus,
  checkGitBranch,
  checkHeadTag,
  checkPackageVersion,
  checkVersionEquality,
  checkBranchAndVersion,
];

const distTagFrom = ({ headTag: v1, packageVersion: v2 }) =>
  areBothSemvers(v1, v2) && areEqual(v1, v2)
    ? (prerelease(v1) === null && "latest") || prerelease(v1)[0]
    : null;

const prepare = async ({ gather = gather_ } = {}) => {
  const gathered = await gather();
  const distTag = distTagFrom(gathered);
  const details = { ...gathered, distTag };
  return checks.reduce((all, check) => all.concat(check(details)), []);
};

export default prepare;
