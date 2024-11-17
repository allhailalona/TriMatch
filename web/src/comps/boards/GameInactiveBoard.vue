<template>
  <div
    class="w-[94%] h-full bg-purple-600 flex flex-row items-center justify-between"
  >
    <!-- Center content -->
    <div class="w-[30%] flex flex-col justify-center items-center gap-12 ml-[300px] pr-20">
      <div class="flex flex-row gap-4 text-center border-4 border-white rounded-lg hover:cursor-pointer p-4" @click="startGame">
        <p class="font-bold text-2xl text-white">Start playing!</p>
        <OhVueIcon name="bi-play-fill" scale="2" fill="white" />
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
        <a 
            href="https://drive.google.com/uc?export=download&id=1nJTnQkbb-Ug3WbEGax90I0qpI9p54PuO"
            class="font-bold text-lg text-blue-400 underline text-center hover:cursor-pointer"
        >
            Download the APK file
        </a>
        <a 
          class="text-blue-400 underline text-lg text-center font-bold"
          href="https://github.com/allhailalona/SetTheGame"
        >
          Visit the GitHub page for a DISCLAIMER and additional info
        </a>
      </div>
    </div>

    <!-- Right side controls -->
    <div class="w-[25%] bg-yellow-500 flex flex-col gap-4 p-6 rounded-lg">
      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="drawACard"
      >
        <p class="font-bold text-2xl text-white">Draw A Card</p>
        <OhVueIcon name="gi-card-draw" scale="2" fill="white" />
      </div>
      
      <div
        v-if="cheatMode"
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="autoFindSet"
      >
        <p class="font-bold text-2xl text-white">Auto Find Set</p>
        <OhVueIcon name="si-iconfinder" scale="2" fill="white" />
      </div>

      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="stopGame"
      >
        <p class="font-bold text-2xl text-white">Stop Game</p>
        <OhVueIcon name="hi-solid-stop" scale="2" fill="white" />
      </div>

      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="retryGame"
      >
        <p class="font-bold text-2xl text-white">Retry Game</p>
        <OhVueIcon name="bi-arrow-counterclockwise" scale="2" fill="white" />
      </div>
    </div>
  </div>
</template>

<script setup>
import { inject } from "vue";
import { useGameLogic } from "@/composables/useGameLogic";
import { addIcons, OhVueIcon } from "oh-vue-icons";
import { BiPlayFill, GiCardDraw, SiIconfinder, HiSolidStop, BiArrowCounterclockwise } from "oh-vue-icons/icons";

addIcons(BiPlayFill, GiCardDraw, SiIconfinder,  HiSolidStop, BiArrowCounterclockwise,);

const cheatMode = inject("cheatMode");

const { startGame, drawACard, autoFindSet, stopGame, retryGame } = useGameLogic();
</script>