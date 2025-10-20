import { defineConfig } from 'vitepress';

export default defineConfig({
  title: 'Responsible Vibe MCP',
  description:
    'Model Context Protocol server for intelligent conversation state management and development guidance',
  base: '/responsible-vibe-mcp/',
  ignoreDeadLinks: true,
  rewrites: {
    'README.md': 'index.md',
  },

  themeConfig: {
    nav: [
      { text: 'Documentation', link: '/' },
      { text: 'Workflows', link: '/workflows' },
    ],

    sidebar: [
      {
        text: 'User Guide',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'How It Works', link: '/user/how-it-works' },
          { text: 'Agent Setup', link: '/user/agent-setup' },
          { text: 'Vibe Engineering', link: '/user/advanced-engineering' },
          { text: 'Long-Term Memory', link: '/user/long-term-memory' },
          { text: 'Tutorial', link: '/user/tutorial' },
        ],
      },
      {
        text: 'Workflows',
        items: [
          { text: 'Workflow-Selection', link: '/user/workflow-selection' },
          { text: 'Explore All Workflows', link: '/workflows' },
          { text: 'Custom Workflows', link: '/user/custom-workflows' },
        ],
      },
    ],
  },

  head: [['link', { rel: 'icon', href: '/responsible-vibe-mcp/favicon.ico' }]],
});
