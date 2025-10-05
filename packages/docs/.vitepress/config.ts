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
        text: 'Getting Started',
        items: [
          { text: 'Overview', link: '/' },
          { text: 'How It Works', link: '/user/how-it-works' },
        ],
      },
      {
        text: 'Interactive Workflows',
        items: [{ text: 'Explore All Workflows', link: '/workflows' }],
      },
    ],
  },

  head: [['link', { rel: 'icon', href: '/responsible-vibe-mcp/favicon.ico' }]],
});
