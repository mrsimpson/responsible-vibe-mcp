# Git Commits

responsible-vibe-mcp server supports configurable automatic git commits during development. This allows for simpler rollbacks – independent of whether the agent itself supports rollbacks (which usually only roll-back conversation history).

## Configuration

Git commit behavior is configured via **environment variables** before starting the server:

```bash
# Set commit behavior
export COMMIT_BEHAVIOR=end  # Options: "step", "phase", "end", "none"

# Optional: Custom commit message template.
export COMMIT_MESSAGE_TEMPLATE="feat: custom commit message format"
```

### Environment Variables

#### `COMMIT_BEHAVIOR` (Required)

- **`step`**: Creates commits after each development step, providing detailed progress tracking
- **`phase`**: Creates commits before phase transitions, marking major milestones
- **`end`**: Creates a single commit when development is complete (recommended default)
- **`none`**: Disables automatic commits, giving you full manual control

All intermediate commits will simply add all artifacts and create a WIP commit with a generic message.

The commit at the end of the development will be instructed with an optional custom template via a task in the development plan.

#### `COMMIT_MESSAGE_TEMPLATE` (Optional)

Customize the commit message format. Default: "Create a conventional commit. In the message, first summarize the intentions and key decisions from the development plan. Then, add a brief summary of the key changes and their side effects and dependencies"

## Troubleshooting

### Plugin Not Active

- Verify `COMMIT_BEHAVIOR` environment variable is set before starting the server
- Check server logs for "CommitPlugin registered successfully" message
- Ensure the value is one of: `step`, `phase`, `end`, `none`

### No Commits Created

- Verify the directory is a git repository (`git status`)
- Check that there are actual file changes to commit
- Ensure git configuration is correct (`git config user.name` and `git config user.email`)
- For step/phase modes: commits are created automatically during phase transitions

### No Final Commit Task in Plan File

- Ensure `COMMIT_BEHAVIOR` was set when `start_development` was called
- The task is added to the final phase (usually "Commit") of the plan file
- Check that the `afterPlanFileCreated` hook was executed during plan creation

### Git Errors

- Git errors are logged but don't interrupt development flow
- Check git repository status and permissions
- Verify git configuration is correct
- Ensure no merge conflicts or other git issues
