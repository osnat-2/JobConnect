name: sync-repo-direct-main
description: Run Git flow to pull, stage, commit, and push directly to the main branch.
tools: ['run_in_terminal', 'get_terminal_output']
---

## Input Parameters
- `repo_path`: Absolute path to the local git repository.
- `commit_message`: Description for the commit.

## Execution Steps
1. Navigate to the repository: `cd {{repo_path}}`
2. Ensure we are on main and get latest changes: `git checkout main && git pull origin main`
3. Stage all current changes: `git add .`
4. Commit the changes: `git commit -m "{{commit_message}}"`
5. Push directly to main: `git push origin main`

## Output Expectation
Return the terminal execution output confirming the direct push to main, or an error message if any step fails.