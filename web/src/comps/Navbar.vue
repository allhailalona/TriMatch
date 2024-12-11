<template>
  <div :class="`${!isGameActive ? 'w-[20%]' : 'lg:w-[5%] max-md:w-[6%]'} h-full flex justify-center items-center bg-purple-600`">
    <div class="w-full h-[30%] max-md:h-[40%] rounded-r-lg flex flex-col justify-center items-center lg:gap-8 gap-6 lg:px-4 shadow-2xl bg-yellow-500">      
      <!-- Stats button -->
      <div class="w-full flex justify-between hover:cursor-pointer px-2" @click="statsDialog = true">
        <OhVueIcon name="io-stats-chart-sharp" class="i-vue" fill="white" />
        <h1 v-if="!isGameActive" class="font-bold md-label max-md:pl-5 text-white">View Stats</h1>
      </div>

      <!-- Conditional login/logout button -->
      <template v-if="userStore.isLoggedIn">
        <div class="w-full flex justify-between hover:cursor-pointer px-2" @click="logOut()">
          <OhVueIcon name="bi-box-arrow-right" class="i-vue" fill="white" />
          <h1 v-if="!isGameActive" class="font-bold md-label text-white">Log Out</h1>
        </div>
      </template>
      <div v-else @click="loginDialog = true" class="w-full flex justify-between hover:cursor-pointer px-2">
        <OhVueIcon name="bi-box-arrow-in-left" class="i-vue" fill="white" />
        <h1 v-if="!isGameActive" class="font-bold md-label text-white">Log In</h1>
      </div>

      <!-- Settings button -->
      <div class="w-full flex justify-between hover:cursor-pointer px-2" @click="settingsDialog = true">
        <OhVueIcon name="io-settings-sharp" class="i-vue" fill="white" />
        <h1 v-if="!isGameActive"  class="font-bold md-label max-md:pl-4 text-white">Settings</h1>
      </div>
    </div>
  </div>
  <!-- Dialog components -->
  <LoginDialog v-model:loginDialog="loginDialog"/>
  <StatsDialog v-model:statsDialog="statsDialog" />
  <SettingsDialog v-model:settingsDialog="settingsDialog" />
</template>
 
 <script lang="ts" setup>
 import { ref, inject } from "vue";
 import { useUserStore } from "../store";
 import LoginDialog from "./dialogs/LoginDialog.vue";
 import StatsDialog from "./dialogs/StatsDialog.vue";
 import SettingsDialog from "./dialogs/SettingsDialog.vue";
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
 
 const userStore = useUserStore();
 userStore.setupWatcher();
 
 const loginDialog = ref<boolean>(false);
 const statsDialog = ref<boolean>(false);
 const settingsDialog = ref<boolean>(false);
 
 const updateBoardFeed = inject("updateBoardFeed") as UpdateBoardFeed
 const resetGameState = inject('resetGameState') as () => Promise<void>
const isGameActive = inject('isGameActive') as boolean
 
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
