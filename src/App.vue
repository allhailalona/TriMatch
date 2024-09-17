<template>
  <div class="w-screen h-screen border border-black">
    <Navbar/> <!-- Listen to game-started channel then call function below -->
    <Board :board-feed="boardFeed"/> <!-- Pass props -->
  </div>
</template>

<script setup>
  import Navbar from '@/comps/Navbar.vue'
  import Board from '@/comps/Board.vue'

  import { provide, reactive, watch } from 'vue'

  let boardFeed = reactive([])
  let selectedCards = reactive([])

  provide('boardFeed', boardFeed)
  provide('selectedCards', selectedCards)

  watch(() => boardFeed, (newBoardFeed) => {
    console.log('hello from App.vue watcher boardFeed was updated to ', newBoardFeed)
  }, { immediate: true, deep: true })
  
</script>