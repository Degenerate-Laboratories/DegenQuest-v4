# GitHub PR Workflow Using the CLI

This guide explains how to create pull requests using the GitHub CLI (`gh`) command line tool, which streamlines the PR creation process.

## Prerequisites

1. Install GitHub CLI:
   - macOS: `brew install gh`
   - Windows: `winget install --id GitHub.cli`
   - Linux: Varies by distribution, see [GitHub CLI installation guide](https://github.com/cli/cli#installation)

2. Authenticate with GitHub:
   ```bash
   gh auth login
   ```
   Follow the prompts to authenticate. This gives the CLI access to your GitHub account.

## Creating a Pull Request

### Basic PR Creation

The simplest way to create a PR:

```bash
gh pr create
```

This will open an interactive prompt asking for:
- Title for the PR
- Body text
- Base branch (where changes will be merged)

### Advanced PR Creation

For more control, use command-line options:

```bash
gh pr create --title "Your PR Title" --body "Description of changes" --base main
```

### Using PR Templates

If your repository has a PR template, you can use it with the `--body-file` option:

```bash
gh pr create --title "Feature: New Component" --body-file .github/pull_request_template.md --base main
```

This command:
- Creates a PR with the title "Feature: New Component"
- Uses the content of the PR template for the body
- Sets the target branch to "main"

## Workflow Example for Guild Members

1. Create your feature branch from the appropriate base branch:
   ```bash
   git checkout -b feature/your-feature-name main
   ```

2. Make your changes and commit them:
   ```bash
   git add .
   git commit -m "Descriptive commit message"
   ```

3. Push your branch to GitHub:
   ```bash
   git push -u origin feature/your-feature-name
   ```

4. Create a PR using the GitHub CLI:
   ```bash
   gh pr create --title "Feature: Your Feature Name" --body-file .github/pull_request_template.md --base main
   ```

5. If you need to make updates to your PR:
   ```bash
   # Make changes
   git add .
   git commit -m "Update based on feedback"
   git push
   ```

## Advanced GitHub CLI Options

### Checking PR Status

```bash
gh pr status
```

### Viewing PR Details

```bash
gh pr view [PR-NUMBER]
```

### Adding Reviewers

```bash
gh pr create --reviewer username1,username2
```

### Adding Labels

```bash
gh pr create --label bug,enhancement
```

### Creating Draft PRs

```bash
gh pr create --draft
```

## Troubleshooting

1. **Base branch issues**: If you see "No commits between base and head branches," ensure:
   - Your feature branch has unique commits
   - You're specifying the correct base branch (main/master/develop)

2. **Authentication issues**: Run `gh auth status` to verify your login

3. **PR creation errors**: Try the interactive mode first (`gh pr create` without options) to debug

## Guild Protocol Notes

- Always follow the guild's branching strategy
- Include all required information in the PR description
- Reference related issues or tasks
- Ensure sprint documentation is updated
- Complete all items in the PR checklist before requesting review 