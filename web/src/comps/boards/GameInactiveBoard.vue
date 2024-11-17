<template>
  <div
    class="w-[94%] h-full bg-purple-600 flex flex-row items-center justify-between"
  >
    <div class="w-[20%] h-[40%] py-7 flex flex-col justify-around">
      <p class="text-xl font-bold text-white">View User Stats</p>
      <p class="text-xl font-bold text-white">Log In/Out</p>
      <p class="text-xl font-bold text-white">Settings</p>
    </div>

    <div class="w-[30%] flex flex-col justify-center items-center gap-12 pr-20">
      <p class="font-bold text-lg text-white text-center">
        {{
          gameMode
            ? "Greetings! The default game mode is whole stack stopwatch. Feel free to change it from settings."
            : "Please choose a game mode from settings before playing!"
        }}
      </p>

      <div class="w-full flex justify-center hover:cursor-pointer">
        <div class="flex flex-row gap-4" @click="startGame">
          <p class="font-bold text-2xl text-white">Start playing!</p>
          <OhVueIcon name="bi-play-fill" scale="2" fill="white" />
        </div>
      </div>

      <div class="w-full flex justify-center">
        <div class="flex flex-row gap-2">
          <p class="font-bold text-lg text-white">Not sure how to play?</p>
          <a
            href="https://www.youtube.com/results?search_query=how+to+play+set+the+game"
            class="font-bold text-lg text-blue-400 underline"
          >
            Click Here!
          </a>
        </div>
      </div>

      <div class="pt-20 flex flex-col gap-5">
        <p class="font-bold text-lg text-blue-400 underline text-center hover:cursor-pointer">Download the Android App</p>
        <a 
          class="text-blue-400 underline text-lg text-center font-bold"
          href="https://github.com/allhailalona/SetTheGame"
        >
          Visit the GitHub page for a DISCLAIMER and additional info
        </a>
      </div>
    </div>

    <div
      class="h-[20%] bg-yellow-500 flex flex-col justify-center items-center rounded-lg"
    >
      <div
        class="h-[50%] flex flex-row gap-4 justify-between items-center p-2 px-4"
        @click="drawACard"
      >
        <p class="font-bold text-2xl text-white">Draw A Card</p>
        <OhVueIcon name="gi-card-draw" scale="2" fill="white" />
      </div>
      <div
        v-if="cheatMode"
        class="h-[50%] flex flex-row gap-4 justify-between items-center p-2 px-4"
        @click="autoFindSet"
      >
        <p class="font-bold text-2xl text-white">Auto Find Set</p>
        <OhVueIcon name="si-iconfinder" scale="2" fill="white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { useGameLogic } from "@/composables/useGameLogic";
import { addIcons, OhVueIcon } from "oh-vue-icons";
import { BiPlayFill, GiCardDraw, SiIconfinder } from "oh-vue-icons/icons";

addIcons(BiPlayFill, GiCardDraw, SiIconfinder);

const gameMode = inject("gameMode");
const cheatMode = inject("cheatMode");

const { startGame, drawACard, autoFindSet } = useGameLogic();
</script>
