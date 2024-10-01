<template>
  <div class="w-screen h-screen border border-black bg-zinc-700">
    <Navbar />
    <!-- Listen to game-started channel then call function below -->
    <GameBoard :board-feed="fgs.boardFeed" />
    <!-- Pass props -->
  </div>
</template>

<script lang="ts" setup>
import { provide, reactive, onMounted } from 'vue'
import { useUserStore } from './store'
import Navbar from '@/comps/Navbar.vue'
import GameBoard from './comps/GameBoard.vue'
import type { FGS, Card, UserData } from '@/frontendTypes'

const userStore = useUserStore()

/* two scenarios for onMounted - 
  1. recieveing data from google auth
  2. check for an existing session and restore data */
onMounted( async () => {
  // Check if the user data is returned via URL after Google authentication
  const params = new URLSearchParams(window.location.search);
  const user = params.get('user');

  let userData = null 
  if (user) { // This is scenario 1
    try {
      // Parse user data from the URL
      userData = JSON.parse(decodeURIComponent(user));
      console.log('detected User data from URL:', userData);

      // Clear the URL so that user data isn't visible
      window.history.replaceState({}, document.title, '/');
    } catch (err) {
      console.error('Detected data in the redirect URL but encountered an error:', err);
      throw err
    }
  } else { // This is scenario 2
    try {
      console.log('there is no data in the URL, checking for existing sessions')
      // This logic checks for an existing session
      const res = await fetch('http://localhost:3000/on-mount-fetch', {
        method: 'POST', 
        credentials: 'include'
      })

      // Error handling for cookie requests
      if (!res.ok) {
        if (res.status === 401) {
          // We don't want to stop exec here, only to notify the front there is no active session
          const errorData = await res.json()
          throw new Error(`Error ${res.status} in onMounted hook: ${errorData.error || 'Unknown error'}`)
        } else {
          // Handle the error response
          const errorData = await res.json()
          throw new Error(`Validation failed: ${errorData.error || 'Unknown error'}`)
        }
      }

      userData = await res.json()
      console.log('hello from App.vue onMounted fetchedData is', userData)
    } catch (err) {
      throw err
    }
  }

  console.log('done with onMounted func, userData is', userData)

  // Update user data in the store
  userStore.isLoggedIn = true;
  userStore.updateUserData(userData);
  console.log('just updated store value is:', userStore.userData)
})

// fgs stands for frontGameState
const fgs = reactive<FGS>({
  boardFeed: [],
  selectedCards: [],
  autoFoundSet: []
})

function updateBoardFeed(updateTo: Card[]) {
  fgs.boardFeed = updateTo
}

function updateSelectedCards(updateTo: Card[]) {
  fgs.selectedCards = updateTo
}

function updateAutoFoundSet(updateTo: Card[]) {
  fgs.autoFoundSet = updateTo
}

provide('fgs', fgs)
provide('updateBoardFeed', updateBoardFeed)
provide('updateSelectedCards', updateSelectedCards)
provide('updateAutoFoundSet', updateAutoFoundSet)
</script>
