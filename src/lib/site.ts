export const SITE_URL: string = process.env.NEXT_PUBLIC_BASE_URL || 'https://jurisnexa.ai'

export const SITE_NAME = 'JurisNexa.ai'

export function absoluteUrl(path: string): string {
  if (/^https?:\/\//i.test(path)) return path
  return `${SITE_URL}${path.startsWith('/') ? path : `/${path}`}`
}