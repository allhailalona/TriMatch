<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center">
    <v-btn @click="startGame()">Start Game</v-btn>
    <v-btn @click="autoFindSet()">Find A Set</v-btn>
    <v-btn @click="drawACard()">Draw A Card</v-btn>
  </div>
</template>

<script setup>
import { inject } from 'vue'

const fgs = inject('fgs')
const updateBoardFeed = inject('updateBoardFeed')

async function startGame() {
  try {
    console.log('calling express start-game')
    const res = await fetch('http://localhost:3000/start-game', {
      method: 'POST'
    })

    const data = await res.json()

    console.log('hello from Navbar just recieved boardFeed is', data)

    // To maintain reactivity of reactive variables, we must use .splice to update the array
    // Using boardFeed = data will cause boardFeed to point somewhere else
    fgs.boardFeed.splice(0, fgs.boardFeed.length, ...data)
  } catch (err) {
    throw err('error in startGame function', err)
  }
}

async function autoFindSet() {
  try {
    if (fgs.boardFeed.length >= 12) {
      /*
        Convert boardFeed, which now contains image data as well, to an id only array, which looks
        like the selectedCards array, then MongoDB can find the relevant items in cardProps. This process is done in 
        the front to save bandwitch. sbf stands for strippedBoardFeed
      */

      // sbf stands for strippedBoardFeed!
      const sbf = fgs.boardFeed.map((card) => card._id)
      console.log('sbf is', sbf)

      console.log('data is here calling express')
      const res = await fetch('http://localhost:3000/auto-find-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sbf })
      })

      const data = await res.json()
      fgs.autoFoundSet.splice(0, fgs.autoFoundSet.length, ...data)
    } else {
      console.log('data is not here please start a game')
    }
  } catch (err) {
    throw err('error in autoFindSet function', err)
  }
}

async function drawACard() {
  try {
    // Make sure the game is running
    if (fgs.boardFeed.length >= 12) {
      // Allow the user to draw up to three cards, afterwards, make sure there is really NO set before drawing another one!
      if (fgs.boardFeed.length < 15) {
        const res = await fetch('http://localhost:3000/draw-a-card', {
          method: 'POST'
        })

        const data = await res.json()
        console.log('hello from drawACard in Navbar.vue', data)
        updateBoardFeed(data)
        console.log('fgs.boardFeed is', fgs.boardFeed.length)
      } else {
        // Run the autoFindSet here to make sure the user really needs more than 15 cards
        console.log('there are more than 15 cards, start working on a set!')
      }
    } else {
      console.log('a game is not started please start one!')
    }
  } catch (err) {
    throw err('error in drawACard function in Navbar.vue')
  }
}
</script>
