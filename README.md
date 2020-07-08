![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# publish

Safe and consistent npm publishing. Publish checks you're following its highly
opinionated publishing rules before choosing a distribution tag and attempting a
release to npm for you. If something looks wrong, it tells you what to fix.

```bash
# add publish to your package
npm install --save-dev @benglynn/publish

# publish safely even if your tired
npx publish
```

Run publish from the root of a clean working directory where HEAD is described
by a tag that is a valid [semver][] and matches the version in package.json. If
the version and git branch are a sensible pair, publish chooses a dist-tag and
attempts to publish.

If the version has no pre-release (e.g. `1.2.3`) publishing is attempted with
the tag `@latest`. If the version has a pre-release (e.g. `1.2.3-rc.3`) then the
first part of the pre-release used as the dist-tag (e.g. `@rc`).

Publishing is only attempted from the `master` branch. There is however one
exeption, if the version is a pre-release, and the pre-release starts with the
npm name of the (`npm login`) npm user, publishing is attempted regardless of
whether the branch is `master`. For example I can publish `1.2.3-benglynn.3`
locally from any branch.

Note that publish chooses a tag for you, if package.json specifies a different
tag (in `publishConfig.tag`), it won't publish. If your team use publish to
manage safe publishing, consider removing this config.

## Publishing in CI

In CI you might configure publish to respond when tags of the right pattern are
 pushed to master. For publishing to succeed in CI, be sure you export an
 `NPM_TOKEN` (more on [npm tokens][]) with publish permissions, and have an
 `.npmrc` file in the root of your package containing the following.

  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```

[semver]: https://github.com/npm/node-semver#readme
[npm tokens]: https://docs.npmjs.com/about-authentication-tokens
