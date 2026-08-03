# Contributing

Thanks for helping build Can I Get In? This project is open source, but project maintainers retain control of the roadmap, data model, and production deployment.

## Workflow

- Main branch should be protected.
- No direct public pushes to `main`.
- Major features should begin with an issue or discussion.
- Keep pull requests focused and reviewable.
- Maintainer review is required before merge.
- Do not add Phase 2 features unless they are needed for the Phase 1 foundation.

## Product Standards

- Use plain public role names: Visitor, Contributor, Moderator, Admin.
- Avoid legal or ADA-compliance determinations.
- Do not shame businesses.
- Prefer factual observations and uncertainty notes.
- Do not overstate AI results or imply guaranteed access.

## Development

```bash
npm install
npm run dev
npm run lint
npm run typecheck
npm run test
npm run build
```

## Pull Requests

Before opening a PR:

- Run linting, type checking, tests, and a production build.
- Document schema, RLS, or product assumption changes.
- Include screenshots for UI changes when practical.
- Keep accessibility and mobile layouts in mind.
