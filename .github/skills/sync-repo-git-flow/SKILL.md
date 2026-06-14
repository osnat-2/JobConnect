---
name: sync-repo-git-flow
description: Run Git flow (checkout, pull, stash, commit, push, PR) for a single repository path.
tools: ['run_in_terminal', 'get_terminal_output']
---

## Input Parameters
- `repo_path`: Absolute path to the local git repository.
- `feature_name`: Name of the feature (used for branch name).
- `commit_message`: Description for the commit and PR title.

## Execution Steps
1. Navigate to the repository: `cd {{repo_path}}`
2. Check status: `git status`
3. Stash local changes if any exist: `git stash`
4. Update master: `git checkout master && git pull origin master`
5. Create branch: `git checkout -b feature/{{feature_name}}`
6. Apply changes back: `git stash pop`
7. Stage and commit: `git add . && git commit -m "feat({{feature_name}}): {{commit_message}}"`
8. Push: `git push origin feature/{{feature_name}}`
9. Create Pull Request using GitHub CLI:
   `gh pr create --base master --head feature/{{feature_name}} --title "feat({{feature_name}}): {{commit_message}}" --body "Automated sync PR."`

## Output Expectation
Return the generated Pull Request URL from the terminal output, or an error message if any step fails.