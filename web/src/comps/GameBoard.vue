<template>
  <div class="w-[95%] h-full flex justify-center items-center flex-row">
    <div class="grid grid-cols-4 grid-rows-3 p-[30px] gap-[50px]">
      <!-- loop the first 12 items of the array -->
      <div
        v-for="(card, index) in fgs.boardFeed.slice(0, 12)"
        :key="index"
        class="flex justify-center items-center"
      >
        <!--if this card is noted in the selectedCards array, it should have a constant pink border-->
        <div
          v-html=String.fromCharCode(...card.image.data)
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
          v-html=String.fromCharCode(...card.image.data)
          @click="selectCard(card._id)"
          :class="getCardClasses(card._id)"
        ></div>
      </div>
    </div>
  </div>
</template>

<script lang="ts" setup>
import { toRaw, inject } from "vue";
import { useUserStore } from "../store";
import type {
  FGS,
  UpdateBoardFeed,
  UpdateSelectedCards,
} from "../types";

const userStore = useUserStore();

const fgs = inject<FGS>("fgs");
const updateBoardFeed = inject<UpdateBoardFeed>("updateBoardFeed")!;
const updateSelectedCards = inject<UpdateSelectedCards>("updateSelectedCards")!;

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
  const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000/'}validate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ selectedCards: fgs.selectedCards }),
  });

  if (!res.ok) {
    // Handle the error response
    const errorData = await res.json();
    throw new Error(
      `Validation failed: ${errorData.message || "Unknown error"}`,
    );
  }

  const data = await res.json();
  console.log("hello from Board.vue after validate call data is", data);

  // Update local storage only if user is logged in
  if (data.isValidSet && data.boardFeed !== undefined) {
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
</script>

<style scoped>
.scale-130 {
  transform: scale(1.3);
}
</style>
