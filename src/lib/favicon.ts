/** Lucide `alarm-clock` / `alarm-clock-plus` icon nodes (viewBox 0 0 24 24). */
type IconNode = [string, Record<string, string>]

const ALARM_CLOCK: IconNode[] = [
  ['circle', { cx: '12', cy: '13', r: '8' }],
  ['path', { d: 'M12 9v4l2 2' }],
  ['path', { d: 'M5 3 2 6' }],
  ['path', { d: 'm22 6-3-3' }],
  ['path', { d: 'M6.38 18.7 4 21' }],
  ['path', { d: 'M17.64 18.67 20 21' }],
]

const ALARM_CLOCK_PLUS: IconNode[] = [
  ['circle', { cx: '12', cy: '13', r: '8' }],
  ['path', { d: 'M5 3 2 6' }],
  ['path', { d: 'm22 6-3-3' }],
  ['path', { d: 'M6.38 18.7 4 21' }],
  ['path', { d: 'M17.64 18.67 20 21' }],
  ['path', { d: 'M12 10v6' }],
  ['path', { d: 'M9 13h6' }],
]

let faviconRunning = false
let faviconLink: HTMLLinkElement | null = null
let themeListenerCount = 0
let themeMq: MediaQueryList | null = null

function faviconStroke(): string {
  const dark =
    document.documentElement.classList.contains('dark') ||
    window.matchMedia('(prefers-color-scheme: dark)').matches
  return dark ? 'oklch(0.985 0 0)' : 'oklch(0.205 0 0)'
}

function iconNodeToMarkup(nodes: IconNode[]): string {
  return nodes
    .map(([tag, attrs]) => {
      const a = Object.entries(attrs)
        .map(([k, v]) => `${k}="${v}"`)
        .join(' ')
      return `<${tag} ${a}/>`
    })
    .join('')
}

function buildFaviconSvg(running: boolean): string {
  const nodes = running ? ALARM_CLOCK_PLUS : ALARM_CLOCK
  const stroke = faviconStroke()
  return `<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="${stroke}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${iconNodeToMarkup(nodes)}</svg>`
}

function getFaviconLink(): HTMLLinkElement {
  if (faviconLink?.isConnected) return faviconLink
  faviconLink =
    document.querySelector<HTMLLinkElement>('link[rel="icon"]') ??
    (() => {
      const link = document.createElement('link')
      link.rel = 'icon'
      link.type = 'image/svg+xml'
      document.head.appendChild(link)
      return link
    })()
  return faviconLink
}

function applyFavicon(): void {
  const href = `data:image/svg+xml,${encodeURIComponent(buildFaviconSvg(faviconRunning))}`
  getFaviconLink().href = href
}

export function setFavicon(running: boolean): void {
  faviconRunning = running
  applyFavicon()
}

export function initFaviconThemeListener(): () => void {
  themeListenerCount += 1
  if (!themeMq) {
    themeMq = window.matchMedia('(prefers-color-scheme: dark)')
    themeMq.addEventListener('change', applyFavicon)
  }
  return () => {
    themeListenerCount -= 1
    if (themeListenerCount <= 0 && themeMq) {
      themeMq.removeEventListener('change', applyFavicon)
      themeMq = null
      themeListenerCount = 0
    }
  }
}
