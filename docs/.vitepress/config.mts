export default {
  theme: '@vitepress/theme-default',
  lang: 'en-US',
  title: 'Graphics Blog',
  description: "A Graphics Blog by Kobe Dereyne going over rendering topics, math, and more.",

  base: '/graphics-blog/',

  markdown: {
    math: true,
  },

  lastUpdated: true,
  cleanUrls: true,

  appearance: 'dark',

  themeConfig: {
    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Series',
        items: [
        ],
      },
      { text: 'About', link: '/about' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kobazaaa' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/kobe-dereyne-925ba02a3/' },
    ],

    footer: {
      message: 'Also see my <a href="https://kobazaaa.github.io">portfolio</a>.',
      copyright: 'Copyright © 2026-present Kobe Dereyne',
    },

    docFooter: {
      prev: 'Previous chapter',
      next: 'Next chapter',
    },
  },
}
