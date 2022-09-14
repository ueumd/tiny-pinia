<template>
  <div>
    <div>
      <span>价格： {{ store.price }}</span>
      <span>数量： {{ store.count }}</span>
    </div>
    <div>总价格:{{ store.totalPrice }}</div>


    <div>
      <span>价格： {{ store2.price }}</span>
      <span>数量： {{ store2.count }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useCounterStore, useCounterStore2 } from '@/store'
const store = useCounterStore()
const store2 = useCounterStore2()
</script>

<style scoped></style>
