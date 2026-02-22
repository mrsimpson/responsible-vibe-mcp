---
name: responsible-vibe
description: >
  Structured development workflows for AI-assisted coding. Use when starting 
  new features, fixing bugs, following TDD, refactoring code, or any development 
  task that benefits from planning and structure. Activate it when 
  users mention to build, enhance or fix code.
license: MIT
metadata:
  version: '${VERSION}'
  repository: https://github.com/mrsimpson/responsible-vibe-mcp
  author: mrsimpson
requires-mcp-servers:
  - name: responsible-vibe-workflows
    package: '@codemcp/workflows'
    description: 'Structured development workflows for AI-assisted coding'
    command: npx
    args: ['-y', '@codemcp/workflows']
---
