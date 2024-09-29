// This is Navbar.vue
<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center gap-2">
    <v-btn @click="startGame()">Start Game</v-btn>
    <v-btn @click="autoFindSet()">Find A Set</v-btn>
    <v-btn @click="drawACard()">Draw A Card</v-btn>
    <v-btn @click="statsDialog = true">stats</v-btn>
    <template v-if="userStore.isLoggedIn">
      <h1>logged in as {{ userStore.userData.username }}</h1>
      <v-btn @click="logOut()">Log out</v-btn>
    </template>
    <v-btn v-else  @click="loginDialog = true">Login</v-btn>


    <LoginDialog v-model:loginDialog="loginDialog"/>
    <StatsDialog v-model:statsDialog="statsDialog"/>
  </div>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'
import { useUserStore } from '../store'
import LoginDialog from './dialogs/LoginDialog.vue'
import StatsDialog from './dialogs/StatsDialog.vue'
import type { FGS, UpdateBoardFeed, Card } from '../frontendTypes'


const userStore = useUserStore()
userStore.setupWatcher()

const loginDialog = ref<boolean>(false)
const statsDialog = ref<boolean>(false)

const fgs = inject<FGS>('fgs')
const updateBoardFeed = inject<UpdateBoardFeed>('updateBoardFeed')!

async function startGame(): Promise<void> {
  try {
    // Increment gamesPlayed by one if the user is logged in
    if (userStore.userData.username.length >= 1) {
      userStore.updateUserDataOnMount({
        stats: {
          ...userStore.userData.stats,
          gamesPlayed: userStore.userData.stats.gamesPlayed + 1
        }
      })
    }
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
    userStore.isLoggedIn = false
    userStore.updateUserDataOnMount({
      _id: '',
      username: '',
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0
      }
    })
    updateBoardFeed([]) // Clean board
    userStore.syncWithServer() // Manually upload changes to DB
    console.log('just updated userData its now', userStore.userData)
  } catch (err) {
    throw err
  }
}
</script>
