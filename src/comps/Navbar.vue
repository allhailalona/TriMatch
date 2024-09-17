<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center">
    <v-btn @click="startGame()">Start Game</v-btn>
    <v-btn @click="findSet()">Find A Set</v-btn>
  </div>
</template>

<script setup> 
  import { inject } from 'vue'

  const boardFeed = inject('boardFeed')
  const selectedCards = inject('selectedCards')

  async function startGame() {
    try {
      console.log('calling express start-game')
      const res = await fetch('http://localhost:3000/start-game', {
        method: 'POST',
      });

      const data = await res.json()
      
      // To maintain reactivity of reactive variables, we must use .splice to update the array
      // Using boardFeed = data will cause boardFeed to point somewhere else
      boardFeed.splice(0, boardFeed.length, ...data)
    } catch (err) {
      throw new Error ('error in startGame function', err)
    }
  }

  async function findSet() {
    try {
      if (cardsData) {
        const res = await fetch('http://localhost:3000/find-set', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ selectedCards }),
        });
          
        const data = await res.json()
        console.log(data)

      } else {
        console.log('data is not here please start a game')
      }
    } catch (err) {
      throw new Error ('error in findSet function', err)
    }

    
  }
</script>