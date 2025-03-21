# Guild Versioning Protocol

## Semantic Versioning

The guild follows [Semantic Versioning 2.0.0](https://semver.org/) for all software packages. Version numbers follow the pattern of `MAJOR.MINOR.PATCH` (e.g., `1.4.2`).

### Version Components

1. **MAJOR** version - Incremented for incompatible API changes
   - Breaking changes that require updates to consuming code
   - Significant architectural changes
   - Major UI overhauls that change user workflow

2. **MINOR** version - Incremented for added functionality in a backward-compatible manner
   - New features that don't break existing functionality
   - Expanded API capabilities
   - Notable enhancements to existing features

3. **PATCH** version - Incremented for backward-compatible bug fixes
   - Bug fixes
   - Performance improvements
   - Small refactorings
   - Documentation updates

## Guild-Specific Versioning Rules

### Default to Patch

When committing changes that require a version bump but you're uncertain about which component to increment:
1. **Default to patch version bump** unless specifically directed otherwise
2. Guild leads may override and request minor or major bumps during PR review

### Version Bump Workflow

1. For pull requests:
   - Always include a version bump in the package.json file
   - This helps prevent "No commits between branches" errors during PR creation
   - Document the reason for the version bump in commit messages

2. For version bump commits:
   - Use descriptive commit messages that explain the changes
   - Example: `"Bump version to 0.4.1 - Fix server connection display issue"`

### Pre-Release Versions

For pre-release or development versions:
1. Add a suffix to indicate pre-release status: `MAJOR.MINOR.PATCH-suffix`
   - Alpha: `0.4.0-alpha.1`
   - Beta: `0.4.0-beta.2`
   - Release Candidate: `0.4.0-rc.1`

2. Increment the suffix number for each pre-release update

## Version Bumping in Different Contexts

### Features

- Typically requires **MINOR** version bump
- Example: `0.4.0` → `0.5.0`

### Bug Fixes 

- Requires **PATCH** version bump
- Example: `0.4.0` → `0.4.1`

### API Changes

- Breaking changes require **MAJOR** version bump
- Example: `0.4.0` → `1.0.0`

## Practical Examples

### Example 1: Bug Fix

```
// Before
"version": "0.4.0"

// After
"version": "0.4.1"
```

Commit message: `"Bump version to 0.4.1 - Fix server connection issue"`

### Example 2: New Feature

```
// Before
"version": "0.4.1"

// After
"version": "0.5.0"
```

Commit message: `"Bump version to 0.5.0 - Add user authentication system"`

### Example 3: Breaking Change

```
// Before
"version": "0.5.0"

// After
"version": "1.0.0"
```

Commit message: `"Bump version to 1.0.0 - Redesign API for improved security"`

## Package-Specific Versioning

For monorepos or projects with multiple package.json files:
1. The top-level package.json contains the "official" version
2. Individual package versions should be synchronized when possible
3. Internal packages may have independent version numbers if necessary

## Documentation

When making version changes:
1. Update CHANGELOG.md with details of changes
2. Tag releases in the git repository
3. Include version information in sprint reports 