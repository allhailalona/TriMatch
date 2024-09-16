<template>
  <div>
    <!-- Further attnetion will be required here to improve styling  -->
    <div class="w-max-full w-[800px] h-[90%] border-2 border-green-400 grid grid-cols-4">
      <div v-for="(svg, index) in svgArr.slice(0, 12)" :key="index">
        <div v-html="svg" class="inline-block border-2 border-black"></div>
      </div>
    </div>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  boardFeed: {
    type: Array,
    required: true,
    validator: (value) => {
      return value.every(
        (item) =>
          typeof item._id === 'string' &&
          item.image &&
          item.image.type === 'Buffer' &&
          Array.isArray(item.image.data)
      )
    }
  }
})

const svgArr = computed(() =>
  props.boardFeed.map((card) => {
    const buffer = card.image.data
    const parsedBuffer = String.fromCharCode(...buffer)

    return parsedBuffer
  })
)

console.log('hello from board comp svgArr is', svgArr)
</script>
