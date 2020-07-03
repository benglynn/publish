![Test](https://github.com/benglynn/publish/workflows/Test/badge.svg)

# publish (beta)

 Safe, consistent npm package publishing, locally or from CI.

```bash
# install globally
npm install -g @benglynn/publish

# or as part of your package
npm install --save-dev @benglynn/publish

# publish locally
publish

# or set up CI to run this when a tag is pushed
publish --ci
```

## Why do I need this?

Work faster and make fewer mistakes. Publish is fussy. It won't put your work on
npm unless everything looks right:

- The git working directory is clean
- The current working directory has a `package.json` (run publish in the root of
  the package you're publishing)
- the HEAD of the current branch is described by a lightweight tag of the
  form `v[major].[minor].[patch]-[dist-tag].` such as `v1.2.3-latest` or
  `v1.2.3-beta`
- The HEAD tag version and `package.json` version match
- The branch and dist-tag are permitted (more below)

If that all checks out, publish will ask for OTP details (you have set up 2FA
haven't you?) and go ahead an publish.

## dist-tag/gbranch mapping

Out-of-the box, publish will let you publish with the:
- `latest` dist-tag from the `master` branch
- `beta` or `next` dist-tags from the `develop` branch
- `[npmusername]` dist-tag from any branch (but not in CI mode)

For example, publish will successfully publish:
- `v1.2.3-latest` from the `master` branch
- `v1.2.3-next` from the `develop` branch
- `v1.2.3-npmusername` from any branch if you're logged in to npm with `npmusername` (but not in CI mode)

See [#1][] if you want to customise this mapping.

## CI mode

`publish --ci`

In continuous integration mode publish will *not* stop to ask for an OTP, nor
allow an `[npmusername]` dist-tag. This is what you want if, for example,
publish is run from a Github action triggered when a new tag is pushed.

For publishing to succeed in CI, be sure you export an `NPM_TOKEN` (more on [npm tokens][]) with publish
  permissions, and have an `.npmrc` file in the root of your package containing
  the following.
  ```
  //registry.npmjs.org/:_authToken=${NPM_TOKEN}
  ```

[npm tokens]: https://docs.npmjs.com/about-authentication-tokens

[#1]: https://github.com/benglynn/publish/issues/1