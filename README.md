![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# publish

Safety checks that save time and help your team publish to npm consistently.

```bash
# install globally
npm install -g @benglynn/publish

# or as part of your package
npm install --save-dev @benglynn/publish

# safely publish locally
publish

# or safely publish from CI when a tag is pushed
publish --ci
```

## What does publish do?

Publish is fussy and hard to make happy, it will attempt to publish to npm only
if:

- The working directory is a clean git working directory (if your local,
  remember to push! [#5][])
- The working directory has a `package.json` (run publish from the the root of
  the package you're publishing)
- The package.json version is in the form `[major].[minor].[patch]`
- The package.json has a `publishConfig` with a permitted `tag` (more below)
  property, such as `latest`
- the HEAD of the current branch is described by a lightweight tag of the form
  `v[major].[minor].[patch]-[dist-tag]` such as `v1.2.3-latest` or `v1.2.3-beta`
- The HEAD tag version and `package.json` version match
- The branch and dist-tag mapping is permitted (more below)

## npm version
Note the `v` at the start of the required git tag? Publish works really well
immediately after e.g. `npm version 1.2.3-next` because that command creates the
right tag for you.

## permitted dist-tags and branch mapping

Publish only recongnises the dist-tags `latest`, `beta`, `next` or
`[npmusername]`. One of these must be defined as the `tag` property in
`publishConfig`.

Further, publish will only succeed when you are publishing the:
- `latest` dist-tag from the `master` branch
- `beta` or `next` dist-tags from the `develop` branch
- `[npmusername]` dist-tag from any branch (but not in CI mode)

For example, publish will successfully publish:
- version `1.2.3` tagged `latest` from the `master` branch
- version `1.2.3` tagged `next` from the `develop` branch
- version `1.2.3` tagged `npmusername` from any `branch` if you're logged in to npm
  with npmusername (but not in CI mode)

See [#1][] if you want to customise permitted dist-tags and mappings.

## CI mode

`publish --ci`

The **--ci** flag means that publish will not look for an npm user to allow an
`[npmusername]` dist-tag. 

For publishing to succeed in CI, be sure you export an `NPM_TOKEN` (more on [npm
  tokens][]) with publish permissions, and have an `.npmrc` file in the root of
  your package containing the following.

  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```

[npm tokens]: https://docs.npmjs.com/about-authentication-tokens

[#1]: https://github.com/benglynn/publish/issues/1
[#5]: https://github.com/benglynn/publish/issues/5