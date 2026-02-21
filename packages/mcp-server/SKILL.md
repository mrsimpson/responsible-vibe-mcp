---
name: responsible-vibe
description: >
  Structured development workflows for AI-assisted coding. Use when starting 
  new features, fixing bugs, following TDD, refactoring code, or any development 
  task that benefits from planning and structure. Activate it when 
  users mention to build, enhance or fix code.
allowed-tools: >
  whats_next proceed_to_phase conduct_review start_development 
  resume_workflow reset_development list_workflows get_tool_info 
  setup_project_docs
license: MIT
metadata:
  version: '5.0.1'
  repository: https://github.com/mrsimpson/responsible-vibe-mcp
  author: mrsimpson
requires-mcp-servers:
  - name: responsible-vibe-workflows
    package: '@codemcp/workflows'
    description: 'Structured development workflows for AI-assisted coding'
    command: npx
    args: ['-y', '@codemcp/workflows']
---
