<template>
  <div class="w-screen h-screen border border-black">
    <Navbar @game-started="updateBoardFeed"/> <!-- Listen to game-started channel then call function below -->
    <Board :board-feed="boardFeed"/> <!-- Pass props -->
  </div>
</template>

<script setup>
  import Navbar from '@/comps/Navbar.vue'
  import Board from '@/comps/Board.vue'

  import { ref } from 'vue'

  // attention - change ref to reactive later!
  let boardFeed = ref([])

  function updateBoardFeed(data) {
    boardFeed.value = data // Upon calling function, assign the recieved data to the new ref
  }
  
</script>