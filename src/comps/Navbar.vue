<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center gap-2">
    <v-btn @click="startGame()">Start Game</v-btn>
    <v-btn @click="autoFindSet()">Find A Set</v-btn>
    <v-btn @click="drawACard()">Draw A Card</v-btn>
    <v-btn @click="statsDialog = true">stats</v-btn>
    <v-btn v-if="userData.username === ''" @click="loginDialog = true">Login</v-btn>
    <template v-else>
      <h1>logged in as {{ userData.username }}</h1>
      <v-btn @click="logOut()">Log out</v-btn>
    </template>

    <LoginDialog v-model:loginDialog="loginDialog" v-model:userData="userData" />
    <StatsDialog v-model:statsDialog="statsDialog" :userData="userData" />
  </div>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'
import LoginDialog from './dialogs/LoginDialog.vue'
import StatsDialog from './dialogs/StatsDialog.vue'
import type { FGS, UpdateBoardFeed, Card } from '../frontendTypes'

const loginDialog = ref<boolean>(false)
const statsDialog = ref<boolean>(false)

const userData = ref({
  username: '',
  stats: {
    gamesPlayed: 0,
    setsFound: 0,
    speedrun3min: 0,
    speedrunWholeStack: 0
  }
})

const fgs = inject<FGS>('fgs')!
const updateBoardFeed = inject<UpdateBoardFeed>('updateBoardFeed')!

async function startGame(): Promise<void> {
  try {
    console.log('calling express start-game')
    const res = await fetch('http://localhost:3000/start-game', {
      method: 'POST'
    })

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json()
      throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
    }

    const data = await res.json()

    console.log('hello from Navbar just recieved boardFeed is', data)

    // To maintain reactivity of reactive variables, we must use .splice to update the array
    // Using boardFeed = data will cause boardFeed to point somewhere else
    fgs.boardFeed.splice(0, fgs.boardFeed.length, ...data)
  } catch (err) {
    throw err
  }
}

async function autoFindSet(): Promise<void> {
  try {
    if (fgs.boardFeed.length >= 12) {
      /*
          Convert boardFeed, which now contains image data as well, to an id only array, which looks
          like the selectedCards array, then MongoDB can find the relevant items in cardProps. This process is done in 
          the front to save bandwitch. sbf stands for strippedBoardFeed
        */

      // sbf stands for strippedBoardFeed!
      const sbf = fgs.boardFeed.map((card: Card) => card._id)
      console.log('sbf is', sbf)

      console.log('data is here calling express')
      const res = await fetch('http://localhost:3000/auto-find-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sbf })
      })

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
      }

      const data = await res.json()
      fgs.autoFoundSet.splice(0, fgs.autoFoundSet.length, ...data)
    } else {
      console.log('data is not here please start a game')
    }
  } catch (err) {
    throw err
  }
}

async function drawACard(): Promise<void> {
  try {
    // Make sure the game is running
    if (fgs.boardFeed.length >= 12) {
      // Allow the user to draw up to three cards, afterwards, make sure there is really NO set before drawing another one!
      if (fgs.boardFeed.length < 15) {
        const res = await fetch('http://localhost:3000/draw-a-card', {
          method: 'POST'
        })

        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json()
          throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
        }

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
    throw err
  }
}

async function logOut(): Promise<void> {
  try {
    const res = await fetch('http://localhost:3000/log-out', {
      method: 'POST',
      credentials: 'include'
    })

    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(`Error ${res.status} no active session`)
      } else {
        // Handle the error response
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
      }
    }

    // Redis key and cookies were both deleted in server.ts, time to reset userData
    console.log('updating userData after logout')
    userData.value = {
      username: '',
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0
      }
    }
  } catch (err) {
    throw err
  }
}
</script>
