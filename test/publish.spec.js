import prepare from "../src/prepare.js";
import chai from "chai";
import chaiAsPromised from "chai-as-promised";
import { basename } from "path";

chai.use(chaiAsPromised);
const expect = chai.expect;

const execDefaults = {
  "git status --porcelain": "",
  "git describe --tags": "v1.0.0-latest",
  "npm whoami": "npmuser",
  "git rev-parse --abbrev-ref HEAD": "master",
};

const readFileDefaults = {
  "package.json": JSON.stringify({
    version: "1.0.0",
    publishConfig: { tag: "latest" },
  }),
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

const setup = ({ execs = execDefaults, readFiles = readFileDefaults } = {}) => {
  return { readFile: readFileStub(readFiles), exec: execStub(execs) };
};

describe("prepare", function () {
  describe("git", function () {
    it("rejects when the working directory is not clean", function () {
      const { readFile, exec } = setup({
        execs: { ...execDefaults, "git status --porcelain": "?? new" },
      });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "CLEAN_CHECK_FAIL"
      );
    });
    it("rejects when there is no git tag for HEAD", function () {
      const error = new Error(
        "fatal: No names found, cannot describe anything."
      );
      const { readFile, exec } = setup({
        execs: { ...execDefaults, "git describe --tags": error },
      });
      return expect(prepare({ readFile, exec })).rejectedWith("NO_VALID_TAG");
    });

    it("rejects when the git tag for HEAD is not the right pattern", function () {
      const { readFile, exec } = setup({
        execs: { ...execDefaults, "git describe --tags": "invalid-tag-123" },
      });
      return expect(prepare({ readFile, exec })).rejectedWith("NO_VALID_TAG");
    });

    it("fails when unable to determine git branch", function () {
      const { readFile, exec } = setup({
        execs: {
          ...execDefaults,
          "git rev-parse --abbrev-ref HEAD": new Error("Error: Command failed"),
        },
      });
      return expect(prepare({ readFile, exec })).rejectedWith("NO_BRANCH");
    });
    it("Fails if tag is not permitted", function () {
      const pkg = JSON.stringify({
        version: "1.0.0",
        publishConfig: { tag: "banana" },
      });
      const { readFile, exec } = setup({
        readFiles: { ...readFileDefaults, "package.json": pkg },
        execs: { ...execDefaults, "git describe --tags": "v1.0.0-banana" },
      });
      return expect(prepare({ readFile, exec })).rejectedWith("TAG_PROHIBITED");
    });
  });

  describe("package.json", function () {
    it("rejetcs when it cannot find `package.json`", function () {
      const readFiles = {
        ...readFileDefaults,
        "package.json": new Error("ENOENT"),
      };
      const { readFile, exec } = setup({ readFiles });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "NO_PACKAGE_JSON"
      );
    });

    it("rejects when package version is malformed", function () {
      const json = JSON.stringify({ name: "@benglynn/pkg", version: "1.0" });
      const readFiles = { ...readFileDefaults, "package.json": json };
      const { readFile, exec } = setup({ readFiles });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "PACKAGE_VERSION_MALFORMED"
      );
    });

    it("rejects when package tag is missing", function () {
      const json = JSON.stringify({ name: "pkg", version: "1.0.0" });
      const readFiles = { ...readFileDefaults, "package.json": json };
      const { readFile, exec } = setup({ readFiles });
      return expect(prepare({ readFile, exec })).rejectedWith("NO_PACKAGE_TAG");
    });
  });

  describe("npm", function () {
    it("fails when not authenticated with npm in normal mode", function () {
      const { readFile, exec } = setup({
        execs: {
          ...execDefaults,
          "npm whoami": new Error("ENEEDAUTH"),
        },
      });
      return expect(prepare({ readFile, exec })).rejectedWith("NO_NPM_USER");
    });

    it("does not find npm authenticated user in ci mode", function () {
      const { readFile, exec } = setup({
        execs: {
          ...execDefaults,
          "npm whoami": new Error("ENEEDAUTH"),
        },
      });
      return expect(prepare({ ci: true, readFile, exec })).fulfilled;
    });
  });

  describe("cross-checks", function () {
    it("rejects when versions in package and tag mismatch", function () {
      const { readFile, exec } = setup({
        execs: { ...execDefaults, "git describe --tags": "v1.0.1-latest" },
      });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "VERSION_MISMATCH"
      );
    });

    it("rejects when ref-tag in package and tag mismatch", function () {
      const json = JSON.stringify({
        name: "pkg",
        version: "1.0.0",
        publishConfig: { tag: "banana" },
      });
      const readFiles = { ...readFileDefaults, "package.json": json };
      const { readFile, exec } = setup({ readFiles });
      return expect(prepare({ readFile, exec })).rejectedWith("TAG_MISMATCH");
    });
  });

  describe("dist-tag branch mapping", function () {
    it("permits publishing @latest from master", function () {
      const { readFile, exec } = setup();
      return expect(prepare({ readFile, exec })).fulfilled;
    });

    it("permits publishing @beta from develop", function () {
      const pkg = JSON.stringify({
        version: "1.0.0",
        publishConfig: { tag: "beta" },
      });
      const { readFile, exec } = setup({
        readFiles: { ...readFileDefaults, "package.json": pkg },
        execs: {
          ...execDefaults,
          "git describe --tags": "v1.0.0-beta",
          "git rev-parse --abbrev-ref HEAD": "develop",
        },
      });
      return expect(prepare({ readFile, exec })).fulfilled;
    });

    it("permits publishing when the tag is npm username", function () {
      const pkg = JSON.stringify({
        name: "pkgname",
        version: "1.0.0",
        publishConfig: { tag: "npmuser" },
      });
      const { readFile, exec } = setup({
        readFiles: { ...readFileDefaults, "package.json": pkg },
        execs: { ...execDefaults, "git describe --tags": "v1.0.0-npmuser" },
      });
      return expect(prepare({ readFile, exec })).fulfilled;
    });

    it("prohibits publishing @latest from develop", function () {
      const { readFile, exec } = setup({
        execs: {
          ...execDefaults,
          "git rev-parse --abbrev-ref HEAD": "develop",
        },
      });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "BRANCH_PROHIBITED"
      );
    });

    it("prohibits publishing beta from master", function () {
      const pkg = JSON.stringify({
        version: "1.0.0",
        publishConfig: { tag: "beta" },
      });
      const { readFile, exec } = setup({
        readFiles: { ...readFileDefaults, "package.json": pkg },
        execs: { ...execDefaults, "git describe --tags": "v1.0.0-beta" },
      });
      return expect(prepare({ readFile, exec })).rejectedWith(
        "BRANCH_PROHIBITED"
      );
    });
  });
});
