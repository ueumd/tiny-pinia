import { effectScope, markRaw, ref } from 'vue'
import type { App } from 'vue'
import { setActivePinia, piniaSymbol, Pinia } from './rootStore'

/**
 * 返回一个pinia对象，内部提供install方法，方便注册
 * _a 用于保存Vue的实例对象
 * _s 参数用于保存所有的模块
 * _e 最外层的作用域scope
 * state 通过作用域创建的ref对象,初始值是一个空对象{}
 */
export function createPinia() {
  // 创建一个scope用于控制依赖收集
  const scope = effectScope(true)

  // 初始化一个state 用于保存store所有的状态
  const state: any = scope.run(() => ref({}))

  const _p: Pinia['_p'] = []

  const pinia: Pinia = markRaw({
    install(app: App) {
      setActivePinia(pinia)

      // 保存Vue的实例对象
      pinia._a = app

      // 将pinia注入组件
      app.provide(piniaSymbol, pinia)

      // 将pinia挂载到全局
      app.config.globalProperties.$pinia = pinia
    },
    use(plugin: never) {
      _p.push(plugin)
      return this
    },
    _p,
    _a: null,
    _e: scope,
    _s: new Map(),
    state
  })

  return pinia
}
