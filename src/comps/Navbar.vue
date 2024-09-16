<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center">
    <v-btn @click="startGame()">Start Game</v-btn>
  </div>
</template>

<script setup> 
  import { defineEmits } from 'vue'

  const emit = defineEmits(['gameStarted'])

  async function startGame() {
    try {
      console.log('calling express start-game')
      const res = await fetch('http://localhost:3000/start-game', {
        method: 'POST',
      });

      const data = await res.json()
      emit('gameStarted', data) // Pass data to Parent comp on the 'gameStarted' comm channel
      
    } catch (err) {
      console.error('Error in startGame function', err)
      throw err
    }
  }
</script>