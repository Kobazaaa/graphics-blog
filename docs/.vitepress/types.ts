// Shared between config.mts and the theme components that consume its output.

export type SidebarItem = {
  text: string
  link: string
  collapsed?: boolean
  items?: SidebarItem[]
}

export type ChapterIndexEntry = {
  number: string
  title: string
  link: string
  depth: number
}

export type SeriesEntry = {
  title: string
  link: string
  chapters: number
  finished: number
}
