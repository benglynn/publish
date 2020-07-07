import validate from "../src/validate";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe.only("validate", function () {
  const success = {
    gitStatus: "",
    gitBranch: "master",
    headTag: "v1.2.3",
    npmUser: "benglynn",
    packageVersion: "1.0.0",
    packageTag: "latest",
  };

  const gatherStub = (response) => () => Promise.resolve(response);

  it("resolves with no errors when all succeeds", function () {
    const promise = validate({ gather: gatherStub(success) });
    return expect(promise).eventually.deep.equals([]);
  });

  it("resolves NO_GIT_STATUS if gitStatus is null", function () {
    const gather = gatherStub({ ...success, gitStatus: null });
    const expected = ["NO_GIT_STATUS"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("resolves NOT_GIT_CLEAN if gitStatus is not an empty string", function () {
    const gather = gatherStub({ ...success, gitStatus: "M README.md" });
    const expected = ["NOT_GIT_CLEAN"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("resolves NO_GIT_BRANCH if gitBranch is null", function () {
    const gather = gatherStub({ ...success, gitBranch: null });
    const expected = ["NO_GIT_BRANCH"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("resolves with multiple errors", function () {
    const gather = gatherStub({ ...success, gitStatus: null, gitBranch: null });
    const expected = ["NO_GIT_STATUS", "NO_GIT_BRANCH"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });
});
