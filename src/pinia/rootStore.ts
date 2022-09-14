import { App, EffectScope, Ref, getCurrentInstance, inject } from 'vue'
export interface Pinia {
  install: (app: App) => void

  /**
   * root state
   */
  state: Ref<Record<string, any>>

  /**
   * Adds a store plugin to extend every store
   *
   * @param plugin - store plugin to add
   */
  use(plugin: any): Pinia
  _p: []

  /**
   * App linked to this Pinia instance
   *
   * @internal
   */
  _a: App | null

  /**
   * Effect scope the pinia is attached to
   *
   * @internal
   */
  _e: EffectScope

  /**
   * Registry of stores used by this pinia.
   *
   * @internal
   */
  _s: Map<string, any>

  /**
   * Added by `createTestingPinia()` to bypass `useStore(pinia)`.
   *
   * @internal
   */
  _testing?: boolean
}

export let activePinia: Pinia | undefined

export const setActivePinia = (pinia: Pinia | undefined) => (activePinia = pinia)

export const getActivePinia = () => (getCurrentInstance() && inject(piniaSymbol)) || activePinia

export const piniaSymbol = Symbol()
