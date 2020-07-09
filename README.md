![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# @benglynn/publish

Tools for npm package publishers.

```bash
npm install --save-dev @benglynn/publish
```

## safepublish

The safepublish script in your node bin (e.g. `npx safepublish`) hecks the
current directory is clean and that HEAD is described by a tag that is a valid
[semver][] and that matches the version in package.json. If the version and git
branch are a sensible pair, safepublish chooses a distribution tag for you and
attempts to publish. 

All publishing is dist-tagged. If the version has no pre-release (e.g. `1.2.3`)
the dist-tag is `@latest`. If the version has a pre-release (e.g. `1.2.3-rc.3`)
the dist-tag is the first part of the pre-release (e.g. `@rc`).

Publishing is only attempted from the `master` branch.

### Run safepublish locally

Run safepublish from the root of your package on the master branch. 

You can publish personally tagged releases from any branch. For example I can
publish `1.2.3-benglynn.3` locally from any branch. That's because the version
is a pre-release which starts with my (`npm whoami`) username.

### Trigger safepublish In CI

In CI configure publish to respond when tags with a semver pattern are pushed to
 master.  For publishing to succeed in CI, be sure you export an `NPM_TOKEN`
 (more on [npm tokens][]) with publish permissions, and have an `.npmrc` file in
 the root of your package containing the following.

  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```

## Developing publish

```bash
# testing
npm test
npm watch-test

# safepublish self
npm run safepublish
```

[semver]: https://github.com/npm/node-semver#readme
[npm tokens]: https://docs.npmjs.com/about-authentication-tokens
