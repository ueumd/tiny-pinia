import {
  computed,
  effectScope,
  getCurrentInstance,
  inject,
  isRef,
  reactive,
  toRefs,
  watch
} from 'vue'
import { activePinia, Pinia, piniaSymbol, setActivePinia } from './rootStore'
import { triggerSubscription, addSubscription } from './subscriptions'

// export function defineStore(idOrOptions: string, options: StoreOptions): () => void
// export function defineStore(idOrOptions: StoreOptionsId): () => void
export function defineStore(idOrOptions: any, setup?: any, setupOptions?: any) {
  let id: string
  let options: any

  // 第一个传是ID
  if (typeof idOrOptions === 'string') {
    id = idOrOptions
    options = setup
  } else {
    // 对象
    options = idOrOptions
    id = idOrOptions.id
  }

  const isSetupStore = typeof setup === 'function'

  // 创建store 并添加到pinia._m中
  function useStore() {
    const currentInstance = getCurrentInstance()

    // 使用inject获取pinia
    let pinia: Pinia | undefined | null = currentInstance && inject(piniaSymbol)

    if (pinia) setActivePinia(pinia)

    pinia = activePinia

    // 第一次如果，没有这个id, 则创建仓库
    if (!pinia?._s.has(id)) {
      if (isSetupStore) {
        createSetupStore(id, setup, pinia)
      } else {
        createOptionsStore(id, options, pinia)
      }
    }

    const store = pinia?._s.get(id)

    return store
  }

  return useStore
}

export const isObject = value => {
  return typeof value === 'object' && value !== null
}

function mergeReactiveObject(target, partialState) {
  for (const key in partialState) {
    if (!partialState.hasOwnProperty(key)) continue
    const oldValue = target[key]
    const newValue = partialState[key]
    if (isObject(oldValue) && isObject(newValue) && isRef(newValue)) {
      target[key] = mergeReactiveObject(oldValue, newValue)
    } else {
      target[key] = newValue
    }
  }
  return target
}

function createSetupStore(id, setup, pinia) {
  let scope

  // _e 能停止所有的store
  // 每个store还能停止自己的
  const setupStore = pinia._e.run(() => {
    scope = effectScope()
    return scope.run(() => setup())
  })

  function wrapAction(name, action) {
    return function () {
      // 触发action的时候 可以触发一些额外的逻辑
      const afterCallbackList: any = []
      const onErrorCallbackList: any = []

      function after(callback) {
        afterCallbackList.push(callback)
      }

      function onError(callback) {
        onErrorCallbackList.push(callback)
      }

      // 触发action
      triggerSubscription(actionSubscribes, {
        after,
        onError,
        store,
        name
      })

      let ret
      try {
        ret = action.apply(store, arguments) // 直接出错
      } catch (error) {
        triggerSubscription(onErrorCallbackList, error)
      }

      if (ret instanceof Promise) {
        return ret
          .then(value => {
            triggerSubscription(afterCallbackList, value)
          })
          .catch(error => {
            triggerSubscription(onErrorCallbackList, error)
            return Promise.reject(error)
          })
      } else {
        triggerSubscription(afterCallbackList, ret)
      }
      return ret
    }
  }

  for (const key in setupStore) {
    const prop = setupStore[key]
    if (typeof prop === 'function') {
      setupStore[key] = wrapAction(key, prop)
    }
  }

  function $patch(partialStateOrMutation) {
    if (typeof partialStateOrMutation === 'function') {
      partialStateOrMutation(store)
    } else {
      mergeReactiveObject(store, partialStateOrMutation)
    }
  }

  // 用于监听state中属性的变化
  // 当用户状态变化的时候 可以监控到变化 并且通知用户 发布订阅
  let actionSubscribes = []
  const partialStore = {
    $patch,
    $subscribe(callback, options) {
      // watch
      scope.run(() =>
        watch(
          pinia.state.value[id],
          state => {
            // 监控状态变化
            callback({ type: 'dirct' }, state)
          },
          options
        )
      )
    },
    $onAction: addSubscription.bind(null, actionSubscribes),
    $dispose: () => {
      scope.stop()
      actionSubscribes = []
      pinia._s.delete(id) // 删除store, 数据变化了不会在更新视图
    }
  }

  // 每一个store都是一个响应式对象
  const store = reactive(partialStore)

  Object.defineProperty(store, '$state', {
    get: () => pinia.state.value[id],
    set: state => $patch($state => Object.assign($state, state))
  })

  // 最终会将处理好的setupStore 放到store的身上
  Object.assign(store, setupStore) // reactive 中放ref 会被拆包  store.count.value

  // 每个store 都会应用一下插件
  pinia._p.forEach(plugin => Object.assign(store, plugin({ store, pinia, app: pinia._a, id })))

  pinia._s.set(id, store)
  return store as any
}

function createOptionsStore(id: string, options: any, pinia) {
  const { state, getters, actions } = options

  function setup() {
    // 自动proxy
    pinia.state.value[id] = state ? state() : {}

    const localState = toRefs(pinia.state.value[id])

    return Object.assign(
      localState,
      actions,
      Object.keys(getters || {}).reduce((computeGetters, name) => {
        computeGetters[name] = computed(() => {
          return getters[name].call(store, store)
        })
        return computeGetters
      }, {})
    )
  }

  const store = createSetupStore(id, setup, pinia)

  // 重置
  store.$reset = () => {
    const newState = state ? state() : {}
    store.$patch($state => {
      Object.assign($state, newState)
    })
  }

  return store as any
}
