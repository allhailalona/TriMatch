<template>
  <div class="w-screen h-screen border border-black bg-zinc-700">
    <Navbar />
    <!-- Listen to game-started channel then call function below -->
    <Board :board-feed="fgs.boardFeed" />
    <!-- Pass props -->
  </div>
</template>

<script lang="ts" setup>
import Navbar from '@/comps/Navbar.vue'
import Board from '@/comps/Board.vue'
import { FGS } from '@/frontendTypes'

import { provide, reactive } from 'vue'

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
