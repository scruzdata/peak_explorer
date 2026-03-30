export interface TocHeading {
  id: string
  text: string
  level: number // 2 | 3
}

export function slugifyHeading(text: string): string {
  return text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9\s-]/g, '')
    .trim()
    .replace(/\s+/g, '-')
    .slice(0, 80)
}

export function extractHeadingsFromJson(contentJson: any): TocHeading[] {
  if (!contentJson?.content) return []
  const headings: TocHeading[] = []

  for (const node of contentJson.content) {
    if (node.type === 'heading' && (node.attrs?.level === 2 || node.attrs?.level === 3)) {
      const text = (node.content ?? [])
        .filter((c: any) => c.type === 'text')
        .map((c: any) => c.text as string)
        .join('')
      if (text.trim()) {
        headings.push({ id: slugifyHeading(text), text: text.trim(), level: node.attrs.level })
      }
    }
  }
  return headings
}
