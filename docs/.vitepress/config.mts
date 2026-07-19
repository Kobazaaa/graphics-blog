import { scanSeries } from './config/scanSeries'

const series = scanSeries()

export default {
  theme: '@vitepress/theme-default',
  lang: 'en-US',
  title: 'Graphics Blog',
  description: "A Graphics Blog by Kobe Dereyne going over rendering topics, math, and more.",

  base: '/graphics-blog/',

  head: [
    ['link', { rel: 'icon', type: 'image/png', href: '/graphics-blog/images/logo-dark.png' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.googleapis.com' }],
    ['link', { rel: 'preconnect', href: 'https://fonts.gstatic.com', crossorigin: '' }],
    [
      'link',
      {
        rel: 'stylesheet',
        href: 'https://fonts.googleapis.com/css2?family=IBM+Plex+Mono:wght@400;500&family=IBM+Plex+Sans:ital,wght@0,400;0,500;0,600;0,700;1,400&display=swap',
      },
    ],
  ],

  rewrites: series.rewrites,

  markdown: {
    math: true,
  },

  lastUpdated: false,
  cleanUrls: true,

  appearance: 'light',

  themeConfig: {
    logo: { dark: '/images/logo-dark.png', light: '/images/logo-light.png' },

    seriesIndex: series.seriesIndex,
    chapterIndex: series.chapterIndex,
    sidebar: series.sidebar,
    outline: { label: 'Contents' },

    search: {
      provider: 'local',
    },

    nav: [
      { text: 'Home', link: '/' },
      {
        text: 'Series',
        items: series.nav,
      },
      { text: 'About', link: '/about' },
    ],

    socialLinks: [
      { icon: 'github', link: 'https://github.com/kobazaaa' },
      { icon: 'linkedin', link: 'https://www.linkedin.com/in/kobe-dereyne-925ba02a3/' },
    ],

    footer: {
      copyright: 'Copyright © 2026-present Kobe Dereyne',
    },

    docFooter: {
      prev: 'Previous chapter',
      next: 'Next chapter',
    },
  },
}
