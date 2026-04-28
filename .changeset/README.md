# Changesets

This directory is managed by [@changesets/cli](https://github.com/changesets/changesets).

## How it works

- When you make a change that should be in the next release, run `pnpm changeset` and follow the prompts
- This creates a markdown file in this directory describing the change
- When ready to release, run `pnpm changeset version` to bump versions and update CHANGELOG.md
- Commit the version changes, then tag and push to trigger release workflows
