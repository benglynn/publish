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

  it("reports an inability to determine Git status", function () {
    const gather = gatherStub({ ...success, gitStatus: null });
    const expected = ["Unable to determine Git status"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("detects Git changes", function () {
    const gather = gatherStub({ ...success, gitStatus: "M README.md" });
    const expected = ["Working directory is not clean"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports an inability to determine Git branch", function () {
    const gather = gatherStub({ ...success, gitBranch: null });
    const expected = ["Unable to determine Git branch"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports multiple errors", function () {
    const gather = gatherStub({ ...success, gitStatus: null, gitBranch: null });
    const expected = [
      "Unable to determine Git status",
      "Unable to determine Git branch",
    ];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });
});
