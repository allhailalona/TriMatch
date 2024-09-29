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

onMounted( async () => {
  try {
    console.log('the app just started!')
    const res = await fetch('http://localhost:3000/on-app-start', {
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

    const data = await res.json()
    console.log('hello from App.vue onMounted fetchedData is', data)
    userStore.setLoggedIn(true)
    userStore.updateUserDataOnMount(data)
    console.log('hello again just updated store to', userStore.userData)
  } catch (err) {
    throw err
  }

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
