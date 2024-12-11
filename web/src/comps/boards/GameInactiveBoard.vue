<template>
  <div
    class="w-[94%] h-full bg-purple-600 flex flex-row items-center justify-between"
  >
    <!-- Center content -->
    <div class="w-[30%] h-[70%] flex flex-col justify-between items-center grow px-32 py-2 max-lg:px-2">
      <div class="flex flex-row gap-4 justify-center items-center border-4 border-white rounded-lg hover:cursor-pointer hover:bg-zinc-400 transition duration-1000 p-4" @click="startGame">
        <p class="font-bold lg-label text-white">Start playing!</p>
        <OhVueIcon name="bi-play-fill" class="i-vue" fill="white" />
      </div>
      <div className="flex gap-4 flex-col max-lg:flex-row max-md:px-12">
        <div class="w-full gap-4 flex justify-center max-md:flex-col" >
          <p class="font-bold md-label text-white">Not sure how to play?</p>
          <a
            href="https://www.youtube.com/results?search_query=how+to+play+set+the+game"
            class="font-bold md-label text-blue-400 underline"
          >
            Click Here!
          </a>
        </div>
        <div class="flex flex-col gap-4">
          <a 
              href="https://drive.google.com/uc?export=download&id=1nJTnQkbb-Ug3WbEGax90I0qpI9p54PuO"
              class="font-bold md-label text-blue-400 underline text-center hover:cursor-pointer"
          >
              Download the APK file
          </a>
          <a 
            class="text-blue-400 underline md-label text-center font-bold"
            href="https://github.com/allhailalona/SetTheGame"
          >
            Visit the GitHub page for a DISCLAIMER and additional info
          </a>
        </div>
      </div>
    </div>

    <!-- Right side controls -->
    <div class="w-[25%] max-h-[90%] bg-yellow-500 flex flex-col gap-4 p-6 rounded-lg">
      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="drawACard"
      >
        <p class="font-bold md-label text-white">Draw A Card</p>
        <OhVueIcon name="gi-card-draw" class="icons" fill="white" />
      </div>
      
      <div
        v-if="cheatMode"
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="autoFindSet"
      >
        <p class="font-bold md-label text-white">Auto Find Set</p>
        <OhVueIcon name="si-iconfinder" class="i-vue" fill="white" />
      </div>

      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="stopGame"
      >
        <p class="font-bold md-label text-white">Stop Game</p>
        <OhVueIcon name="hi-solid-stop" class="i-vue" fill="white" />
      </div>

      <div
        class="flex flex-row gap-4 justify-between items-center hover:cursor-pointer"
        @click="retryGame"
      >
        <p class="font-bold md-label text-white">Retry Game</p>
        <OhVueIcon name="bi-arrow-counterclockwise" class="i-vue" fill="white" />
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