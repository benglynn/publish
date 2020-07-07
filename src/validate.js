import gather_ from "./gather";

const checkGitStatus = ({ gitStatus }) =>
  typeof gitStatus !== "string"
    ? ["NO_GIT_STATUS"]
    : gitStatus === ""
    ? []
    : ["NOT_GIT_CLEAN"];

const checkGitBranch = ({ gitBranch }) =>
  gitBranch === null ? ["NO_GIT_BRANCH"] : [];

const checks = [checkGitStatus, checkGitBranch];

const validate = async ({ gather = gather_ } = {}) => {
  const details = await gather();
  return checks.reduce((errors, check) => errors.concat(check(details)), []);
};

export default validate;
