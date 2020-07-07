import gather from "../src/gather";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("gather", function () {
  const successfulExecs = {
    "git status --porcelain": "M README.md",
    "git rev-parse --abbrev-ref HEAD": "master",
    "git describe --tags": "v1.2.3",
    "npm whoami": "benglynn",
  };

  const failingExecs = {
    "git status --porcelain": new Error("ERROR"),
    "git rev-parse --abbrev-ref HEAD": new Error("ERROR"),
    "git describe --tags": new Error("ERROR"),
    "npm whoami": new Error("ERROR"),
  };

  const execStub = (execs) => (command) => {
    const eventually = execs[command];
    return eventually instanceof Error
      ? Promise.reject(eventually)
      : Promise.resolve({ stdout: eventually });
  };

  const successfulReadFiles = {
    "package.json": JSON.stringify({
      version: "1.0.0",
      publishConfig: { tag: "latest" },
    }),
  };

  const failingReadFiles = {
    "package.json": new Error("ERROR"),
  };

  const readFileStub = (readFiles) => (file) => {
    const eventually = readFiles[file];
    return eventually instanceof Error
      ? Promise.reject(eventually)
      : Promise.resolve(eventually);
  };

  it("resolves with the expected stdout", function () {
    const exec = execStub(successfulExecs);
    const readFile = readFileStub(successfulReadFiles);
    return expect(gather(exec, readFile, "package.json")).eventually.deep.equal(
      {
        gitStatus: "M README.md",
        gitBranch: "master",
        headTag: "v1.2.3",
        npmUser: "benglynn",
        packageVersion: "1.0.0",
        packageTag: "latest",
      }
    );
  });

  it.only("resolves with null values for rejections", function () {
    const exec = execStub(failingExecs);
    const readFile = readFileStub(failingReadFiles);
    return expect(gather(exec, readFile, "package.json")).eventually.deep.equal(
      {
        gitStatus: null,
        gitBranch: null,
        headTag: null,
        npmUser: null,
        packageVersion: null,
        packageTag: null,
      }
    );
  });
});
