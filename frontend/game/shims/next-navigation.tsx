/** Vite /play bundle — no Next App Router; use full page navigation. */

export function useRouter() {
  return {
    push(href: string) {
      window.location.assign(href)
    },
    replace(href: string) {
      window.location.replace(href)
    },
    refresh() {
      window.location.reload()
    },
    back() {
      window.history.back()
    },
    forward() {
      window.history.forward()
    },
    prefetch() {
      /* no-op */
    },
  }
}

export function usePathname() {
  return window.location.pathname
}

export function redirect(url: string) {
  window.location.assign(url)
}
