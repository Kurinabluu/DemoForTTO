let openLoginDialogHandler = null

export function registerLoginDialogOpener(handler) {
  openLoginDialogHandler = typeof handler === 'function' ? handler : null
}

export function requestOpenLoginDialog() {
  openLoginDialogHandler?.()
}
