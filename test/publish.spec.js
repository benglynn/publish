import publish from "../publish.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { basename } from "path";

chai.use(chaiAsPromised);
const expect = chai.expect;

describe("publish", function () {
  const execDefaults = {
    "git describe --tags": "v1.0.0-latest",
    "npm whoami": "npmuser",
    "git rev-parse --abbrev-ref HEAD": "master",
  };

  const readFileDefaults = {
    "package.json": JSON.stringify({ version: "1.0.0" }),
  };

  const readFileStub = (readFiles) => (file) => {
    const eventually = readFiles[basename(file)];
    return eventually instanceof Error
      ? Promise.reject(eventually)
      : Promise.resolve(eventually);
  };

  const execStub = (execs) => (command) => {
    const eventually = execs[command];
    return eventually instanceof Error
      ? Promise.reject(eventually)
      : Promise.resolve({ stdout: eventually });
  };

  const setup = ({
    execs = execDefaults,
    readFiles = readFileDefaults,
  } = {}) => {
    return { readFile: readFileStub(readFiles), exec: execStub(execs) };
  };

  it("rejetcs when it cannot find `package.json`", function () {
    const readFiles = {
      ...readFileDefaults,
      "package.json": new Error("ENOENT"),
    };
    const { readFile, exec } = setup({ readFiles });
    return expect(publish({ readFile, exec })).rejectedWith("NO_PACKAGE_JSON");
  });

  it("rejects when there is no git tag for HEAD", function () {
    const error = new Error("fatal: No names found, cannot describe anything.");
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": error },
    });
    return expect(publish({ readFile, exec })).rejectedWith("NO_VALID_TAG");
  });

  it("rejects when the git tag for HEAD is not the right pattern", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": "invalid-tag-123" },
    });
    return expect(publish({ readFile, exec })).rejectedWith("NO_VALID_TAG");
  });

  it("rejects when versions in package and tag mismatch", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": "v1.0.1-latest" },
    });
    return expect(publish({ readFile, exec })).rejectedWith("VERSION_MISMATCH");
  });

  it("fails when not authenticated with npm", function () {
    const { readFile, exec } = setup({
      execs: {
        ...execDefaults,
        "npm whoami": new Error("ENEEDAUTH"),
      },
    });
    return expect(publish({ readFile, exec })).rejectedWith("NO_NPM_USER");
  });

  it("fails when unable to determine git branch", function () {
    const { readFile, exec } = setup({
      execs: {
        ...execDefaults,
        "git rev-parse --abbrev-ref HEAD": new Error("Error: Command failed"),
      },
    });
    return expect(publish({ readFile, exec })).rejectedWith("NO_BRANCH");
  });

  it("permits publishing @latest from master", function () {
    const { readFile, exec } = setup();
    return expect(publish({ readFile, exec })).fulfilled;
  });

  it("permits publishing @beta from develop", function () {
    const { readFile, exec } = setup({
      execs: {
        ...execDefaults,
        "git describe --tags": "v1.0.0-beta",
        "git rev-parse --abbrev-ref HEAD": "develop",
      },
    });
    return expect(publish({ readFile, exec })).fulfilled;
  });

  it("permits publishing when the tag is npm username", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": "v1.0.0-npmuser" },
    });
    return expect(publish({ readFile, exec })).fulfilled;
  });

  it("prohibits publishing @latest from develop", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git rev-parse --abbrev-ref HEAD": "develop" },
    });
    return expect(publish({ readFile, exec })).rejectedWith(
      "BRANCH_PROHIBITED"
    );
  });

  it("prohibits publishing beta from master", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": "v1.0.0-beta" },
    });
    return expect(publish({ readFile, exec })).rejectedWith(
      "BRANCH_PROHIBITED"
    );
  });

  it("prohibits publishing when tag is not master, develop or npm username", function () {
    const { readFile, exec } = setup({
      execs: { ...execDefaults, "git describe --tags": "v1.0.0-banana" },
    });
    return expect(publish({ readFile, exec })).rejectedWith("TAG_PROHIBITED");
  });
});
