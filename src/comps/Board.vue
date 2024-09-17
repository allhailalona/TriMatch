<template>
  <div class="w-full h-[90%] border-2 border-green-400 flex justify-center items-center border-4 border-red-500 overflow-y-auto ">
    <div class="grid grid-cols-4 grid-rows-3 p-[30px] gap-[50px] border-4 border-yellow-500">
      <div v-for="(card, index) in boardFeed.slice(0, 12)" :key="index" class="flex justify-center items-center">
        <!--if this card is noted in the selectedCards array, it should have a constant pink border-->
        <div 
          v-html="bufferToText(card.image.data)" 
          @click="getCardId(card._id)"
          :class="[
            'inline-block border-[4px] hover:cursor-pointer transition-colors duration-200 transform scale-130 origin-center',
            selectedCards.includes(card._id) ? 'border-pink-400' : 'border-black hover:border-pink-400', 
            autoFoundSet.includes(card._id) && !selectedCards.includes(card._id) ? 'border-orange-400' : 'border-black hover:border-pink-400'
          ]"
        >
        </div>
      </div>
    </div>
  </div>
</template>

<script setup>
  import { watch, toRaw, inject } from 'vue'

  const boardFeed = inject('boardFeed')
  const selectedCards = inject('selectedCards')
  const autoFoundSet = inject('autoFoundSet')

  // Watch for changes in the boardFeed prop
  watch(() => boardFeed, (newBoardFeed) => {
    console.log('boardFeed updated in Board component:', toRaw(newBoardFeed))
  }, { immediate: true, deep: true })

  // Decode buffers
  function bufferToText(buffer) {
    return String.fromCharCode(...buffer)
  }

  // On click logic
  function getCardId(id) {
    if (selectedCards.includes(id)) {
      let index = selectedCards.indexOf(id)
      index > -1 && selectedCards.splice(index, 1)
      console.log(toRaw(selectedCards))
    } else {
      selectedCards.push(id)
      console.log(toRaw(selectedCards))
      if (selectedCards.length === 3) {
        validate()
        selectedCards.splice(0, boardFeed.length)
      }
    }
  }

  async function validate() {
    try {
      console.log('hello from validate calling express.js')
      const res = await fetch('http://localhost:3000/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCards }),
      });

      const data = await res.json()
      console.log('done with express, isSet is', data)
      
    } catch (err) {
      console.error('error in validate function in Board.vue', err)
      throw err
    }
  }

</script>

<style scoped>
.scale-130 {
  transform: scale(1.3);
}
</style>