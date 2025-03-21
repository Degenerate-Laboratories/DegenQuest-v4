# Branching Strategy

## Primary Branch
- **master**: The main production branch for this project. All deployment builds are made from this branch.

## Development Workflow
1. All feature development should branch off from the **master** branch
2. Branch naming convention:
   - Feature branches: `feature/feature-name`
   - Bug fixes: `bugfix/issue-description`
   - Hotfixes: `hotfix/issue-description`
   - Releases: `release/version-number`

## Merging Rules
1. All code must be reviewed via pull request before merging to **master**
2. Branches should be rebased on **master** before merging
3. Delete branches after merging to keep the repository clean

## Notes
The project standardizes on using **master** as the primary branch name for all repositories. 