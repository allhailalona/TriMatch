<template>
  <div class="w-screen h-screen bg-purple-700 flex items-center flex-row">
    <Navbar />
    <GameActiveBoard v-if="isGameActive" :board-feed="fgs.boardFeed" />
    <GameInactiveBoard v-else />
  </div>

  <!-- Mobile Warning Overlay -->
  <div v-if="isMobile === 1" class="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
    <div class="bg-white p-6 rounded-lg max-w-sm text-center">
      <h2 class="text-xl mb-4">Mobile dimensions detected</h2>
      <p class="mb-6">This site requires a wide screen for the web version. For smaller screens, a tablet-only APK is available.</p>
      <div class="space-y-2">
        <a 
          href='https://drive.google.com/uc?export=download&id=1fhaajKuhlFWrvcqhzrPFiZKUYKAc-7Tb' 
          class="w-full bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-600"
        >
          Download APK
        </a>
        <button @click="proceedInLandscape" class="w-full bg-gray-500 text-white py-2 px-4 rounded hover:bg-gray-600">
          Proceed anyways (Site might look terrible)
        </button>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { provide, reactive, onMounted, onBeforeUnmount, ref } from "vue";
import { debounce } from 'lodash'
import { useUserStore } from "./store";
import Navbar from "@/comps/Navbar.vue";
import GameActiveBoard from "./comps/boards/GameActiveBoard.vue";
import GameInactiveBoard from './comps/boards/GameInactiveBoard.vue'
import type { FGS, Card } from "@/types";

const userStore = useUserStore();

// Screen breakpoints
const MOBILE_WIDTH = 768;
const MOBILE_HEIGHT = 450;

const isMobile = ref(window.innerWidth < MOBILE_WIDTH || window.innerHeight < MOBILE_HEIGHT);

// Add orientation detection
const checkMobile = debounce(() => {
  isMobile.value = window.innerWidth < MOBILE_WIDTH || window.innerHeight < MOBILE_HEIGHT;
  
  if (isMobile.value) {
    const isLandscape = window.innerWidth > window.innerHeight;
    console.log('these are mobile dimensions', isLandscape ? '(landscape)' : '(portrait)');
  }
}, 250);

const proceedInLandscape = () => {
  isMobile.value = false; // This will hide the overlay
}

/* two scenarios for onMounted - 
  1. recieveing data from google auth (otp auth sends data in res.status(200).json format...)
  2. check for an existing session and restore data */
onMounted(async () => {
  // Add resize listener
  window.addEventListener('resize', checkMobile);
  // Initial check
  checkMobile();

  // Check if the user data is returned via URL after Google authentication
  const params = new URLSearchParams(window.location.search);
  const user = params.get("user");

  let userData = null;
  if (user) {
    // This is scenario 1 - successful google auth
    try {
      // Parse user data from the URL
      userData = JSON.parse(decodeURIComponent(user));

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

// Add cleanup
onBeforeUnmount(() => {
  window.removeEventListener('resize', checkMobile);
});

// fgs stands for frontGameState
const fgs = reactive<FGS>({
  boardFeed: [],
  selectedCards: [],
  autoFoundSet: [],
});

const gameMode = ref<number>(0);
const cheatMode = ref<boolean | string>(true);
const isGameActive = ref<boolean>(false)
const setsFound = ref<number>(9)

function updateBoardFeed(updateTo: Card[]) {
  fgs.boardFeed = updateTo;
}

function updateSelectedCards(updateTo: string[]) {
  fgs.selectedCards = updateTo;
}

function updateAutoFoundSet(updateTo: string[]) {
  fgs.autoFoundSet = updateTo;
}

// utils/gameStateManager.ts (or .js)
async function resetGameState() {
  console.log('reset game state func was called')
  // Render GameInactiveBoard.vue instead
  isGameActive.value = false
  setsFound.value = 0

  // Clear state
  fgs.boardFeed = [];
  fgs.selectedCards = [];
  fgs.autoFoundSet = [];

  // Clear timer
  const clearTimerRes = await fetch('${import.meta.env.VITE_SERVER_URL}/clear-timer', {
    method: 'POST'
  });

  if (!clearTimerRes.ok) {
    throw new Error('Timer clear failed');
  }
}

provide("fgs", fgs)
provide("gameMode", gameMode);
provide("cheatMode", cheatMode);
provide('isGameActive', isGameActive)
provide('setsFound', setsFound)
provide("updateBoardFeed", updateBoardFeed);
provide("updateSelectedCards", updateSelectedCards);
provide("updateAutoFoundSet", updateAutoFoundSet);
provide('resetGameState', resetGameState)
</script>
