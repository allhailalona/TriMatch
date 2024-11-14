<template>
  <div class="w-[95%] h-full flex justify-center items-center flex-row">
    <v-alert
      v-model="showGameAlert"
      variant="tonal"
      closable
      class="fixed top-8 left-1/2 transform -translate-x-1/2 z-50 min-w-[500px] bg-white py-6 px-8"
      title="Game Over!"
      style="background-color: white !important"
      :title-class="'!text-5xl !font-black !mb-4 !leading-tight'"
      :text-class="'!text-2xl'"
      prominent
      @click:close="showGameAlert = false"
    >
      <!-- Icon before the title -->
      <template #prepend>
        <span
          class="text-4xl font-bold mr-4"
          :class="{
            'text-green-500': isRecordBroken === true,
            'text-blue-500':
              isRecordBroken === false || isRecordBroken === null,
          }"
        >
          {{ isRecordBroken === true ? "✓" : "ℹ" }}
        </span>
      </template>

      <!-- Close button -->
      <template #close>
        <span
          class="text-red-500 font-bold text-3xl hover:text-red-700 cursor-pointer"
          style="position: absolute; top: 8px; right: 12px"
          @click="showGameAlert = false"
        >
          ×
        </span>
      </template>
      {{ gameAlertMessage }}
    </v-alert>
    <div class="grid grid-cols-4 grid-rows-3 p-[30px] gap-[50px]">
      <!-- loop the first 12 items of the array -->
      <div
        v-for="(card, index) in fgs.boardFeed.slice(0, 12)"
        :key="index"
        class="flex justify-center items-center"
      >
        <!--if this card is noted in the selectedCards array, it should have a constant pink border-->
        <div
          v-html="String.fromCharCode(...card.image.data)"
          @click="selectCard(card._id)"
          :class="getCardClasses(card._id)"
        ></div>
      </div>
    </div>
    <div
      v-if="fgs!.boardFeed.length > 12"
      class="grid grid-cols-1 grid-rows-3 p-[20px] gap-[50px]"
    >
      <div
        v-for="(card, index) in fgs.boardFeed.slice(12)"
        :key="index + 12"
        class="flex justify-center items-center"
      >
        <div
          v-html="String.fromCharCode(...card.image.data)"
          @click="selectCard(card._id)"
          :class="getCardClasses(card._id)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRaw, inject, onMounted, onUnmounted, ref } from "vue";
import { io, Socket } from "socket.io-client";
import { useUserStore } from "../store";
import type { FGS, UpdateBoardFeed, UpdateSelectedCards } from "../types";

const userStore = useUserStore();

const fgs = inject<FGS>("fgs");
const updateBoardFeed = inject<UpdateBoardFeed>("updateBoardFeed")!;
const updateSelectedCards = inject<UpdateSelectedCards>("updateSelectedCards")!;

const showGameAlert = ref(false);
const gameAlertMessage = ref("");
const isRecordBroken = ref<boolean | null>(null); // To show V or I in game over notification

// Store socket instance outside component
let socket: Socket | null = null;

onMounted(() => {
  // Only create new connection if one doesn't exist
  if (!socket) {
    socket = io(import.meta.env.VITE_SERVER_URL || "http://localhost:3000/", {
      transports: ["websocket"],
    });

    // Set up event listeners
    socket.on("connect", () => {
      console.log("Connected to socket server");
    });

    socket.on("3minSpeedRunGameEnded", async (data) => {
      // Check login status and record status
      let message = "";
      if (data.isRecordBroken === true) {
        // User is logged in and new record
        isRecordBroken.value = data.isRecordBroken;
        message = `You found ${data.setsFound} sets - You broke a record! Congratulations!`;
      } else if (data.isRecordBroken === false) {
        // User is logged in but no new record
        isRecordBroken.value = data.isRecordBroken;
        message = `You found ${data.setsFound} sets - No record broken`;
      } else if (data.isRecordBroken == null) {
        // User is guest (undefined or null) since the isRecordBroken wasn't sent from the server
        message = `You are a guest, login to store new records. You found ${data.setsFound} sets`;
        document.cookie =
          "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Remove guest sessionId cookie from the front
      }

      // Show notification
      gameAlertMessage.value = message;
      showGameAlert.value = true;
      startAlertTimer();

      // Reset game temp data
      fgs.boardFeed = [];
      fgs.selectedCards = [];
      fgs.autoFoundSet = [];
    });
  }
});

onUnmounted(() => {
  if (socket) {
    // Remove all listeners before disconnecting
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
});

// Auto close notification after 5 seconds
function startAlertTimer() {
  setTimeout(() => {
    showGameAlert.value = false;
  }, 5000); // 5 seconds
}

// Select cards logic
function selectCard(id: string): void {
  if (fgs.selectedCards.includes(id)) {
    let index = fgs.selectedCards.indexOf(id);
    fgs.selectedCards.splice(index, 1);
    console.log(toRaw(fgs.selectedCards));
  } else {
    fgs.selectedCards.push(id);
    console.log(toRaw(fgs.selectedCards));
    if (fgs.selectedCards.length === 3) {
      validate();
      fgs.selectedCards.splice(0, fgs.boardFeed.length);
    }
  }
}

function getCardClasses(cardId: string) {
  return [
    "inline-block border-[4px] rounded-lg bg-white hover:cursor-pointer transition-colors duration-200 transform scale-130 origin-center",
    fgs.selectedCards.includes(cardId)
      ? "border-green-600"
      : fgs.autoFoundSet.includes(cardId)
        ? "border-orange-400"
        : "border-black hover:border-green-600",
  ];
}

async function validate(): Promise<void> {
  const res = await fetch(
    `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/"}validate`,
    {
      method: "POST",
      credentials: "include",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ selectedCards: fgs.selectedCards }),
    },
  );

  if (!res.ok) {
    // Handle the error response
    const errorData = await res.json();
    throw new Error(`Validation failed: ${errorData.error || "Unknown error"}`);
  }

  const data = await res.json();
  console.log("hello from Board.vue after validate call data is", data);

  // If the game is over, show score and/or record notice (if user is logged in)
  if (data.newScore) {
    // Check login status and record status
    let message = "";
    if (data.isRecordBroken === true) {
      // User is logged in and new record
      isRecordBroken.value = data.isRecordBroken;
      message = `You found ${data.newScore} - You broke a record! Congratulations!`;
    } else if (data.isRecordBroken === false) {
      // User is logged in but no new record
      isRecordBroken.value = data.isRecordBroken;
      message = `You found ${data.newScore} - No record broken`;
    } else if (data.isRecordBroken == null) {
      // User is guest (undefined or null) since the isRecordBroken wasn't sent from the server
      message = `You found ${data.newScore} - Login to store records`;
      // That's the web version, the guest sessionId is stored in cookies and was already deleted in the server
    }

    // Show notification
    gameAlertMessage.value = message;
    showGameAlert.value = true;
    startAlertTimer();

    // Reset game temp data
    fgs.boardFeed = [];
    fgs.selectedCards = [];
    fgs.autoFoundSet = [];
  } else {
    // Update local storage only if user is logged in
    if (data.isValidSet) {
      if (userStore.userData.username.length >= 1) {
        userStore.updateUserData({
          stats: {
            ...userStore.userData.stats,
            setsFound: userStore.userData.stats.setsFound + 1,
          },
        });
      }

      // As an antichceat measure, the entire boardFeed is returned from Redis on each request
      updateBoardFeed(data.boardFeed); // Update cards on board
      updateSelectedCards([]); // Clear selectedCards
    }
  }
}
</script>

<style scoped>
.scale-130 {
  transform: scale(1.3);
}
</style>
