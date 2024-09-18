<template>
  <div class="w-screen h-screen border border-black">
    <Navbar />
    <!-- Listen to game-started channel then call function below -->
    <Board :board-feed="fgs.boardFeed" />
    <!-- Pass props -->
  </div>
</template>

<script setup>
import Navbar from '@/comps/Navbar.vue'
import Board from '@/comps/Board.vue'

import { provide, reactive } from 'vue'

// fgs stands for frontGameState
const fgs = reactive({
  boardFeed: [],
  selectedCards: [],
  autoFoundSet: []
})

function updateBoardFeed(updateTo) {
  fgs.boardFeed = updateTo
}

function updateSelectedCards(updateTo) {
  fgs.selectedCards = updateTo
}

function updateAutoFoundSet(updateTo) {
  fgs.autoFoundSet = updateTo
}

provide('fgs', fgs)
provide('updateBoardFeed', updateBoardFeed)
provide('updateSelectedCards', updateSelectedCards)
provide('updateAutoFoundSet', updateAutoFoundSet)
</script>
