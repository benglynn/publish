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
    packageVersion: "1.2.3",
    packageTag: "latest",
  };

  const gatherStub = (response) => () => Promise.resolve(response);

  it("resolves with no errors when all succeeds", function () {
    const promise = validate({ gather: gatherStub(success) });
    return expect(promise).eventually.deep.equals([]);
  });

  it("reports when unable to determine Git status", function () {
    const gather = gatherStub({ ...success, gitStatus: null });
    const expected = ["Unable to determine Git status"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("detects Git changes", function () {
    const gather = gatherStub({ ...success, gitStatus: "M README.md" });
    const expected = ["Working directory is not clean"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when unable to determine Git branch", function () {
    const gather = gatherStub({ ...success, gitBranch: null });
    const expected = ["Unable to determine Git branch"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when unable to find a tag for HEAD", function () {
    const gather = gatherStub({ ...success, headTag: null });
    const expected = ["Unable to find a tag for HEAD"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when HEAD tag is not a valid semver", function () {
    const gather = gatherStub({ ...success, headTag: "banana" });
    const expected = ["Head tag is not a valid semver"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when unable to determine package version", function () {
    const gather = gatherStub({ ...success, packageVersion: null });
    const expected = ["Unable to determine package.json version"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when package.json version is not a valid semver", function () {
    const gather = gatherStub({ ...success, packageVersion: "banana" });
    const expected = ["Version in package.json is not a valid semver"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports when package.json semver and HEAD tag semver do not match", function () {
    const gather = gatherStub({ ...success, headTag: "1.2.4" });
    const expected = ["HEAD tag version and package.json version do not match"];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });

  it("reports multiple errors", function () {
    const gather = gatherStub({
      ...success,
      gitStatus: null,
      gitBranch: null,
      packageVersion: "banana",
    });
    const expected = [
      "Unable to determine Git status",
      "Unable to determine Git branch",
      "Version in package.json is not a valid semver",
    ];
    return expect(validate({ gather })).eventually.deep.equals(expected);
  });
});
