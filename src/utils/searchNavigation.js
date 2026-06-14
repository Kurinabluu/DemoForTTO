let pendingSearchNavigation = null

export function markSearchPageReset() {
  pendingSearchNavigation = 'reuse-cache'
}

export function consumeSearchNavigationIntent() {
  const intent = pendingSearchNavigation
  pendingSearchNavigation = null
  return intent
}
