import gather_ from "./gather";

const checkGitStatus = ({ gitStatus }) =>
  typeof gitStatus !== "string"
    ? ["Unable to determine Git status"]
    : gitStatus === ""
    ? []
    : ["Working directory is not clean"];

const checkGitBranch = ({ gitBranch }) =>
  gitBranch === null ? ["Unable to determine Git branch"] : [];

const checks = [checkGitStatus, checkGitBranch];

const validate = async ({ gather = gather_ } = {}) => {
  const details = await gather();
  return checks.reduce((errors, check) => errors.concat(check(details)), []);
};

export default validate;
