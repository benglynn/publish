![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# publish

Safe and consistent npm publishing. Publish checks you're following its highly
opinionated publishing rules before attempting a distribution-tagged release to
npm for you. If something looks wrong, it tells you exactly what to fix.

```bash
# add publish to your package
npm install --save-dev @benglynn/publish

# publish safely even if your tired
publish
```

Run publish from the root of a clean working directory where HEAD is described
by a tag that is a valid [semver][] and matches the version in package.json. If
the version and git branch are a sensible pair, publish chooses a dist-tag and
attempts to publish.

If the version has no pre-release (e.g. `1.2.3`) and the branch is `master`,
publishing is attempted with the tag `@latest`.

If the version has a pre-release (e.g. `1.2.3-rc.3`) then the first part of the
pre-release used as the dist-tag (e.g. `rc`). However the publish is only
attempted if:

- either the branch is `release/<version>` (e.g. `release/1.2.3-rc.3`)
- or the dist-tag is the username of the authenticated npm user 

Note that publish chooses a tag for you, if package.json specifies a different
tag (in `publishConfig.tag`), it won't publish.

## Some examples:

- version `1.2.3` is published as `@latest` if the branch is `master`
- version `1.2.3-beta.3` is published as `@beta` if branch is `release/1.2.3-rc.3`
- version `1.2.3-npmuser.3` is published as `@npmuser` from any branch if
  `npmuser` is logged-in to npm


## Publishing in CI

In CI you might configure publish to respond when tags of the right pattern are
 pushed to certain branches. For publishing to succeed in CI, be sure you export
 an `NPM_TOKEN` (more on [npm tokens][]) with publish permissions, and have an
 `.npmrc` file in the root of your package containing the following.

  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```

[semver]: https://github.com/npm/node-semver#readme
[npm tokens]: https://docs.npmjs.com/about-authentication-tokens
