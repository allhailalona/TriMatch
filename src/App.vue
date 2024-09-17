<template>
  <div class="w-screen h-screen border border-black">
    <Navbar/> <!-- Listen to game-started channel then call function below -->
    <Board :board-feed="boardFeed"/> <!-- Pass props -->
  </div>
</template>

<script setup>
  import Navbar from '@/comps/Navbar.vue'
  import Board from '@/comps/Board.vue'

  import { provide, reactive } from 'vue'

  let boardFeed = reactive([])
  let selectedCards = reactive([])
  let autoFoundSet = reactive([])

  provide('boardFeed', boardFeed)
  provide('selectedCards', selectedCards)
  provide('autoFoundSet', autoFoundSet)
</script>