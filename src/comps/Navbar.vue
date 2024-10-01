<template>
  <div class="w-[6%] h-full p-2">
    <div class="w-full h-full p-2 rounded-lg flex flex-col justify-center items-center gap-8 shadow-2xl" style="background-color: #fcba03;">
      <div class="container">
        <button @click="startGame()"><OhVueIcon name="bi-play-fill" scale="2" fill="white"/></button>
        <h1 class="growing-div">Start Game</h1>
      </div>
      
      <div class="container">
        <button @click="autoFindSet()"><OhVueIcon name="si-iconfinder" scale="2" fill="white"/></button>
        <h1 class="growing-div">Auto Find Set</h1>
      </div>
      
      <div class="container">
        <button @click="drawACard()"><OhVueIcon name="gi-card-draw" scale="2" fill="white"/></button>
        <h1 class="growing-div"> Draw A Card</h1>
      </div>
      
      <div class="container">
        <button @click="statsDialog = true"><OhVueIcon name="io-stats-chart-sharp" scale="2" fill="white"/></button>
        <h1 class="growing-div">View User Stats</h1>
      </div>

      <template v-if="userStore.isLoggedIn">
        <div class="container">
          <button @click="logOut()"><OhVueIcon name="bi-box-arrow-right" scale="2" fill="white"/></button>
          <h1 class="growing-div">Log out from: {{ userStore.userData.username }}</h1>
        </div>    
      </template>
      <div v-else class="container">
        <button @click="loginDialog = true"><OhVueIcon name="bi-box-arrow-in-left" scale="2" fill="white"/></button>
        <h1 class="growing-div">Log in</h1>
      </div>

      <LoginDialog v-model:loginDialog="loginDialog"/>
      <StatsDialog v-model:statsDialog="statsDialog"/>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'
import { useUserStore } from '../store'
import LoginDialog from './dialogs/LoginDialog.vue'
import StatsDialog from './dialogs/StatsDialog.vue'
import type { FGS, UpdateBoardFeed, Card } from '../frontendTypes'
import { OhVueIcon, addIcons } from 'oh-vue-icons'
import { BiPlayFill, BiArrowRepeat, GiCardDraw, SiIconfinder, BiBoxArrowInLeft, BiBoxArrowRight, IoStatsChartSharp } from 'oh-vue-icons/icons'

addIcons(BiPlayFill, BiArrowRepeat, GiCardDraw, SiIconfinder, BiBoxArrowInLeft, BiBoxArrowRight, IoStatsChartSharp)


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
      userStore.updateUserData({
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
    updateBoardFeed([]) // Clean board
    userStore.syncWithServer() // Manually upload changes to DB
    userStore.isLoggedIn = false
    userStore.updateUserData({
      _id: '',
      username: '',
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0
      }
    })
    console.log('just updated userData its now', userStore.userData)
  } catch (err) {
    throw err
  }
}
</script>

<style scoped>
.container {
  position: relative;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: row;
}

.growing-div {
  position: absolute;
  left: calc(100% + 10px);
  top: 0;
  width: 0;
  height: 50px;
  border-radius: 5px;
  background-color: white;
  display: flex;
  justify-content: center;
  align-items: center;
  transition: width 0.7s ease;
  overflow: hidden;
  white-space: nowrap;
  z-index: 10; /* Ensure it appears above other content */
}

.container:hover .growing-div {
  width: 250px; /* Adjust as needed */
}
</style>
