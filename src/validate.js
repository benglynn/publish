import gather_ from "./gather";
import { valid, compare } from "semver";

const checkGitStatus = ({ gitStatus }) =>
  typeof gitStatus !== "string"
    ? ["Unable to determine Git status"]
    : gitStatus === ""
    ? []
    : ["Working directory is not clean"];

const checkGitBranch = ({ gitBranch }) =>
  gitBranch === null ? ["Unable to determine Git branch"] : [];

const checkHeadTag = ({ headTag, packageVersion }) =>
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

const checkVersionEquality = ({ headTag, packageVersion }) => {
  return valid(headTag) !== null &&
    valid(packageVersion) !== null &&
    compare(headTag, packageVersion) !== 0
    ? ["HEAD tag version and package.json version do not match"]
    : [];
};

const checks = [
  checkGitStatus,
  checkGitBranch,
  checkHeadTag,
  checkPackageVersion,
  checkVersionEquality,
];

const validate = async ({ gather = gather_ } = {}) => {
  const details = await gather();
  return checks.reduce((errors, check) => errors.concat(check(details)), []);
};

export default validate;
