![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# @benglynn/publish

Tools for npm package publishers. 


```bash
npm install --save-dev @benglynn/publish
```

## safepublish

The safepublish script in your node bin (e.g. `npx safepublish`) checks that the
current directory is clean and that HEAD is described by a tag that is both a
valid [semver][] and a match for the version in package.json. Also that the
branch is okay for that version.

If everything checks out, safepublish chooses an appropriate dist-tag and
attempts to publish. If not, it tells you what to fix. Failure always exits
with a failure code.

All publishing is dist-tagged. If the version has no pre-release (e.g. `1.2.3`)
the dist-tag is `@latest`. If the version has a pre-release (e.g. `1.2.3-rc.3`)
the dist-tag is the first part of the pre-release (e.g. `@rc`).

Publishing is only attempted from the `master` branch (but read on).

### Run safepublish locally

Run safepublish from the root of your package on the master branch. 

You can publish personally tagged releases from any branch. For example I can
publish `1.2.3-benglynn.3` locally from any branch because the version is a
pre-release which starts with my (`npm whoami`) username.

### Trigger safepublish In CI

In CI configure safepublish to run when tags with a semver pattern are pushed to
 master.
 
 For publishing to succeed in CI, be sure you export an `NPM_TOKEN`
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
