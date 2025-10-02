import { defineConfig } from 'vitepress';
import { resolve } from 'node:path';
import { withMermaid } from 'vitepress-plugin-mermaid';

export default withMermaid(
  defineConfig({
    title: 'Responsible Vibe MCP',
    description:
      'Model Context Protocol server for intelligent conversation state management and development guidance',
    base: '/responsible-vibe-mcp/',
    ignoreDeadLinks: true, // Temporarily ignore dead links
    rewrites: {
      'README.md': 'index.md',
    },
    vite: {
      resolve: {
        alias: {
          '@workflow-visualizer': resolve(
            __dirname,
            '../../workflow-visualizer/src'
          ),
        },
      },
      server: {
        fs: {
          allow: ['../..'],
        },
      },
    },

    themeConfig: {
      nav: [
        { text: 'Documentation', link: '/' },
        { text: 'Workflows', link: '/workflows' },
        {
          text: 'GitHub',
          link: 'https://github.com/mrsimpson/vibe-feature-mcp',
        },
      ],

      sidebar: [
        {
          text: 'Getting Started',
          items: [
            { text: 'Overview', link: '/' },
            { text: 'How It Works', link: '/user/how-it-works' },
            { text: 'Quick Setup', link: '/user/agent-setup' },
            { text: 'Hands-On Tutorial', link: '/user/tutorial' },
          ],
        },
        {
          text: 'User Guides',
          items: [
            {
              text: 'Automatic Workflow Selection',
              link: '/user/workflow-selection',
            },
            {
              text: 'Advanced Engineering',
              link: '/user/advanced-engineering',
            },
            { text: 'Long-Term Memory', link: '/user/long-term-memory' },
            { text: 'Custom Workflows', link: '/user/custom-state-machine' },
            { text: 'Git Commits', link: '/user/git-commit-feature' },
          ],
        },
        {
          text: 'Interactive Workflows',
          items: [{ text: 'Explore All Workflows', link: '/workflows' }],
        },
        {
          text: 'Development',
          items: [
            { text: 'Architecture', link: '/dev/architecture' },
            { text: 'Development Guide', link: '/dev/development' },
            { text: 'Logging', link: '/dev/logging' },
            { text: 'Publishing', link: '/dev/publishing' },
          ],
        },
      ],

      socialLinks: [
        {
          icon: 'github',
          link: 'https://github.com/mrsimpson/vibe-feature-mcp',
        },
        {
          icon: 'npm',
          link: 'https://www.npmjs.com/package/responsible-vibe-mcp',
        },
      ],

      footer: {
        message: 'Released under the MIT License.',
        copyright: 'Copyright © 2025 Oliver Jägle',
      },
    },

    head: [
      ['link', { rel: 'icon', href: '/responsible-vibe-mcp/favicon.ico' }],
    ],
  })
);
