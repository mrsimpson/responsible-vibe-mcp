---
name: commit
description: Commits all changeswith a comprehensive conventional commit message
arguments:
  - name: squash
    description: Whether the commit shall include all changes compared to main
    required: false
  - name: include_unstaged
    description: Whether the commit shall include all changes compared to main
    required: false
---

{{#if squash}}We want to squash all changes compared to main. Reset soft, then re-analyze the diff{{/if}}

Commit the changes {{#if include_unstaged}}including the currently not staged files{{/if}}

For the commit message, use the following format:

```
<conventional commit type>: a brief description of the impact of the staged diff.

## High level changes

<What components have been touched and how did this alter the existing behaviour. Bullet points>

## Motivation

<What was the reasoning why this change was performed>

## Details
<Detailed changes and how they interrelate between each other and the existing codebase>
```
