import { getCurrentInstance, onUnmounted } from 'vue'
import { _Method } from './types'

export const noop = () => {}

export function addSubscription<T extends _Method>(
  subscriptions: T[],
  callback: T,
  detached?: boolean,
  onCleanup: () => void = noop
) {
  subscriptions.push(callback)

  const removeSubscription = () => {
    const idx = subscriptions.indexOf(callback)
    if (idx > -1) {
      subscriptions.splice(idx, 1)
      onCleanup()
    }
  }

  if (!detached && getCurrentInstance()) {
    onUnmounted(removeSubscription)
  }

  return removeSubscription
}

export function triggerSubscription(subscriptions, ...args) {
  subscriptions.forEach(cb => cb(...args))
}
