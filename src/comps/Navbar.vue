<template>
  <div class="flex justify-center">
    <v-btn @click="startGame()">Start Game</v-btn>
  </div>
</template>

<script setup> 
  async function startGame() {
    try {
      console.log('calling express start-game')
      const res = await fetch('http://localhost:3000/start-game', {
        method: 'POST',
      });

      const data = await res.json()
    } catch (err) {
      console.error('Error in startGame function', err)
      throw err
    }
  }
</script>