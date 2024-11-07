<template>
  <div
    class="w-screen h-screen bg-zinc-700 flex items-center flex-row"
    style="background-color: #8b39a1"
  >
    <Navbar />
    <!-- Listen to game-started channel then call function below -->
    <GameBoard :board-feed="fgs.boardFeed" />
    <!-- Pass props -->
  </div>
</template>

<script lang="ts" setup>
import { provide, reactive, onMounted, ref } from "vue";
import { useUserStore } from "./store";
import Navbar from "@/comps/Navbar.vue";
import GameBoard from "./comps/GameBoard.vue";
import type { FGS, Card } from "@/types";

const userStore = useUserStore();

/* two scenarios for onMounted - 
  1. recieveing data from google auth (otp auth sends data in res.status(200).json format...)
  2. check for an existing session and restore data */
onMounted(async () => {
  // Check if the user data is returned via URL after Google authentication
  const params = new URLSearchParams(window.location.search);
  const user = params.get("user");

  let userData = null;
  if (user) {
    // This is scenario 1 - successful google auth
    try {
      // Parse user data from the URL
      userData = JSON.parse(decodeURIComponent(user));
      console.log("detected User data from URL:", userData);

      // Clear the URL so that user data isn't visible
      window.history.replaceState({}, document.title, "/");
    } catch (err) {
      console.error(
        "Detected data in the redirect URL but encountered an error:",
        err,
      );
      throw err;
    }
  } else {
    // This is scenario 2 - session management
    console.log("there is no data in the URL, checking for existing sessions");
    // This logic checks for an existing session
    const res = await fetch(
      `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/"}on-mount-fetch`,
      {
        method: "GET",
        credentials: "include",
      },
    );

    // Error handling for cookie requests
    if (!res.ok) {
      const errorData = await res.json();
      if (res.status === 401) {
        throw new Error(
          `Error ${res.status} in onMounted hook: ${errorData.error || "Unknown error"}`,
        );
      } else {
        throw new Error(
          `Validation failed: ${errorData.error || "Unknown error"}`,
        );
      }
    }

    userData = await res.json();
  }

  // Update user data in the store
  userStore.isLoggedIn = true;
  userStore.updateUserData(userData);
});

// fgs stands for frontGameState
const fgs = reactive<FGS>({
  boardFeed: [],
  selectedCards: [],
  autoFoundSet: [],
});

const gameMode = ref<number>(1)
const cheatMode = ref<boolean | string>(true)

function updateBoardFeed(updateTo: Card[]) {
  fgs.boardFeed = updateTo;
}

function updateSelectedCards(updateTo: Card[]) {
  fgs.selectedCards = updateTo;
}

function updateAutoFoundSet(updateTo: Card[]) {
  fgs.autoFoundSet = updateTo;
}

provide("fgs", fgs);
provide('gameMode', gameMode)
provide('cheatMode', cheatMode)
provide("updateBoardFeed", updateBoardFeed);
provide("updateSelectedCards", updateSelectedCards);
provide("updateAutoFoundSet", updateAutoFoundSet);
</script>
