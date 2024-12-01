<template>
  <div class="w-[6%] h-full p-2 flex justify-center items-center bg-purple-600">
    <div
      class="w-full min-h[40%] h-[60%] p-2 rounded-lg flex flex-col justify-center items-center gap-10 shadow-2xl"
      style="background-color: #fcba03"
    >
      <div class="container" v-if="isGameActive">
        <button @click="resetGameState">
          <OhVueIcon name="hi-solid-stop" scale="2" fill="white" />
        </button>
      </div>

      <!-- Reset button container -->
      <div class="container" v-if="isGameActive">
        <button @click="startGame">
          <OhVueIcon name="bi-arrow-counterclockwise" scale="2" fill="white" />
        </button>
      </div>
      
      <div class="container">
        <button @click="statsDialog = true">
          <OhVueIcon name="io-stats-chart-sharp" scale="2" fill="white" />
        </button>
      </div>

      <template v-if="userStore.isLoggedIn">
        <div class="container">
          <button @click="logOut()">
            <OhVueIcon name="bi-box-arrow-right" scale="2" fill="white" />
          </button>
        </div>
      </template>
      <div v-else class="container">
        <button @click="loginDialog = true">
          <OhVueIcon name="bi-box-arrow-in-left" scale="2" fill="white" />
        </button>
      </div>

      <div class="container">
        <button @click="settingsDialog = true">
          <OhVueIcon name="io-settings-sharp" scale="1.5" fill="white" />
        </button>
      </div>

      <LoginDialog v-model:loginDialog="loginDialog" />
      <StatsDialog v-model:statsDialog="statsDialog" />
      <SettingsDialog v-model:settingsDialog="settingsDialog" />
    </div>
  </div>
</template>
 
 <script lang="ts" setup>
 import { ref, inject } from "vue";
 import { useUserStore } from "../store";
 import LoginDialog from "./dialogs/LoginDialog.vue";
 import StatsDialog from "./dialogs/StatsDialog.vue";
 import SettingsDialog from "./dialogs/SettingsDialog.vue";
 import { useGameLogic } from '../composables/useGameLogic'
 import type { UpdateBoardFeed } from "../types";
 import { OhVueIcon, addIcons } from "oh-vue-icons";
 import {
  BiBoxArrowInLeft,
  BiBoxArrowRight,
  IoStatsChartSharp,
  IoSettingsSharp,
 } from "oh-vue-icons/icons";
 
 addIcons(
  BiBoxArrowInLeft,
  BiBoxArrowRight,
  IoStatsChartSharp,
  IoSettingsSharp,
 );
 
 const { startGame } = useGameLogic()
 const userStore = useUserStore();
 userStore.setupWatcher();
 
 const loginDialog = ref<boolean>(false);
 const statsDialog = ref<boolean>(false);
 const settingsDialog = ref<boolean>(false);
 
 const isGameActive = inject('isGameActive') as boolean
 const updateBoardFeed = inject("updateBoardFeed") as UpdateBoardFeed
 const resetGameState = inject('resetGameState') as () => Promise<void>
 
 async function logOut(): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/"}log-out`,
    {
      method: "POST",
      credentials: "include",
    },
  );
 
  if (!res.ok) {
    if (res.status === 401) {
      throw new Error(`Error ${res.status} no active session`);
    } else {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(
        `Validation failed: ${errorData.error || "Unknown error"}`,
      );
    }
  }
 
  resetGameState()
 
  // Redis key and cookies were both deleted in server.ts, time to reset userData
  console.log("updating userData after logout");
  updateBoardFeed([]); // Clean board
  userStore.syncWithServer(); // Manually upload changes to DB
  userStore.isLoggedIn = false; // Reset UI
  userStore.updateUserData({
    // Reset userData for future logins
    _id: "",
    username: "",
    stats: {
      gamesPlayed: 0,
      setsFound: 0,
      speedrun3min: 0,
      speedrunWholeStack: 0,
    },
  });
  console.log("just updated userData its now", userStore.userData);
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
 
 .info-div {
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
  overflow: hidden;
  white-space: nowrap;
  z-index: 10; /* Ensure it appears above other content */
 }
 
 .show-info {
  width: 250px; /* Adjust as needed */
 }
 </style>