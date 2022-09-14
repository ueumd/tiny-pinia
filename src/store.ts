import { defineStore } from '@/pinia'
export const useCounterStore = defineStore({
  id: 'counter',
  state: () => {
    return {
      count: 10,
      price: 100
    }
  },
  getters: {
    totalPrice() {
      return `¥${this.count * this.price}`
    }
  },
  actions: {
    increment(num) {
      this.count += num
    }
  }
})

export const useCounterStore2 = defineStore('counter2', {
  state: () => {
    return {
      count: 10,
      price: 100
    }
  },
  getters: {
    totalPrice() {
      return `¥${this.count * this.price}`
    }
  },
  actions: {
    increment(num) {
      this.count += num
    }
  }
})
