<template>
  <div class="w-full h-[90%] border-2 border-green-400 flex justify-center items-center flex-row">
    <div class="grid grid-cols-4 grid-rows-3 p-[30px] gap-[50px] border-4 border-yellow-500">
      <!-- loop the first 12 items of the array -->
      <div
        v-for="(card, index) in fgs.boardFeed.slice(0, 12)"
        :key="index"
        class="flex justify-center items-center"
      >
        <!--if this card is noted in the selectedCards array, it should have a constant pink border-->
        <div
          v-html="bufferToText(card.image.data)"
          @click="getCardId(card._id)"
          :class="[
            'inline-block border-[4px] rounded-lg bg-white hover:cursor-pointer transition-colors duration-200 transform scale-130 origin-center',
            fgs.selectedCards.includes(card._id)
              ? 'border-pink-400'
              : 'border-black hover:border-pink-400',
            fgs.autoFoundSet.includes(card._id) && !fgs.selectedCards.includes(card._id)
              ? 'border-orange-400'
              : 'border-black hover:border-pink-400'
          ]"
        ></div>
      </div>
    </div>
    <div
      v-if="fgs.boardFeed.length > 12 && fgs.boardFeed.length <= 15"
      class="grid grid-cols-1 grid-rows-3 p-[30px] gap-[50px] border-4 border-yellow-500"
    >
      <div
        v-for="(card, index) in fgs.boardFeed.slice(12)"
        :key="index + 12"
        class="flex justify-center items-center"
      >
        <div
          v-html="bufferToText(card.image.data)"
          @click="getCardId(card._id)"
          :class="[
            'inline-block border-[4px] rounded-lg bg-white hover:cursor-pointer transition-colors duration-200 transform scale-130 origin-center',
            fgs.selectedCards.includes(card._id)
              ? 'border-pink-400'
              : 'border-black hover:border-pink-400',
            fgs.autoFoundSet.includes(card._id) && !fgs.selectedCards.includes(card._id)
              ? 'border-orange-400'
              : 'border-black hover:border-pink-400'
          ]"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { watch, toRaw, inject } from 'vue'
import { FGS, UpdateBoardFeed, UpdateSelectedCards } from '../frontendTypes'

const fgs = inject<FGS>('fgs')
const updateBoardFeed = inject<UpdateBoardFeed>('updateBoardFeed')!
const updateSelectedCards = inject<UpdateSelectedCards>('updateSelectedCards')!

// Watch for changes in the boardFeed prop
watch(
  () => fgs.boardFeed,
  (newBoardFeed) => {
    console.log('boardFeed updated in Board component:', toRaw(newBoardFeed))
  },
  { immediate: true, deep: true }
)

// Decode buffers
function bufferToText(buffer: number) {
  return String.fromCharCode(...buffer)
}

// On click logic
function getCardId(id: string): void {
  if (fgs.selectedCards.includes(id)) {
    let index = fgs.selectedCards.indexOf(id)
    index > -1 && fgs.selectedCards.splice(index, 1)
    console.log(toRaw(fgs.selectedCards))
  } else {
    fgs.selectedCards.push(id)
    console.log(toRaw(fgs.selectedCards))
    if (fgs.selectedCards.length === 3) {
      validate()
      fgs.selectedCards.splice(0, fgs.boardFeed.length)
    }
  }
}

async function validate(): Promise<void> {
  try {
    console.log('hello from validate calling express.js')
    const res = await fetch('http://localhost:3000/validate', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ selectedCards: fgs.selectedCards })
    })

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json()
      throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
    }

    const data = await res.json()
    console.log('hello from Board.vue after validate call datqa is', data)

    // The double validation is not strictly necessary, this is handled in express... but I can't miss a chance to debug
    if (data.isValidSet && data.boardFeed) {
      updateBoardFeed(data.boardFeed) // Update cards on board
      updateSelectedCards([]) // Clear selectedCards
    }
  } catch (err) {
    throw err
  }
}
</script>

<style scoped>
.scale-130 {
  transform: scale(1.3);
}
</style>
