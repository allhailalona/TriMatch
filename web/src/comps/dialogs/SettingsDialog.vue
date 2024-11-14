<template>
  <v-dialog
    max-width="600"
    :model-value="props.settingsDialog"
    @update:model-value="(newValue) => emit('update:settingsDialog', newValue)"
    @click:outside="() => emit('update:settingsDialog', false)"
  >
    <v-card class="px-4 py-8 border-4 border-red-400">
      <v-card-text>
        <!-- Mode 1 with Accordion -->
        <div class="mb-4 border border-gray-200 rounded">
          <div
            class="flex items-center justify-between p-3 cursor-pointer"
            @click="toggleAccordion(1)"
          >
            <div class="flex items-center">
              <input
                type="radio"
                :value="1"
                class="w-6 h-6"
                v-model="gameMode"
                @change="handleChangeGameMode"
                @click.stop
              />
              <label class="ml-2 text-lg">Whole Stack Speed Run</label>
            </div>
            <span class="text-xl">{{ accordion1Open ? "▼" : "▶" }}</span>
          </div>
          <div v-if="accordion1Open" class="p-3 border-t">
            "Full stack marathon - Stopwatch runs until you complete all 81
            cards. Race against yourself and track your best time!"
          </div>
        </div>

        <!-- Mode 2 with Accordion -->
        <div class="border border-gray-200 rounded">
          <div
            class="flex items-center justify-between p-3 cursor-pointer"
            @click="toggleAccordion(2)"
          >
            <div class="flex items-center">
              <input
                type="radio"
                :value="2"
                class="w-6 h-6"
                v-model="gameMode"
                @change="handleChangeGameMode"
                @click.stop
              />
              <label class="ml-2 text-lg">3 Minutes Speed Run</label>
            </div>
            <span class="text-xl">{{ accordion2Open ? "▼" : "▶" }}</span>
          </div>
          <div v-if="accordion2Open" class="p-3 border-t">
            "3-minute speedrun challenge - Complete as much as you can! Your
            final score is recorded when the timer hits zero."
          </div>
        </div>

        <!-- Cheat Mode checkbox -->
        <div class="mt-5 flex flex-row justify-between items-center">
          <div class="flex items-center">
            <input
              type="checkbox"
              v-model="cheatMode"
              @click="handleChangeCheatMode"
              class="h-6 w-6 mr-3 hover:cursor-pointer"
            />
            <label
              for="cheat-mode"
              class="font-bold text-lg hover:cursor-default"
              >Cheat Mode</label
            >
          </div>
          <h1
            class="hover:cursor-pointer text-xl font-bold text-blue-500 underline"
          >
            DISCLAIMER
          </h1>
        </div>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineEmits, defineProps, ref, inject, onMounted } from "vue";
import type { Ref } from "vue";

const props = defineProps<{ settingsDialog: boolean }>();
const emit = defineEmits<{ "update:settingsDialog": [boolean] }>();

const gameMode = inject("gameMode") as Ref<string>;
const cheatMode = inject("cheatMode") as Ref<boolean | string>;

const accordion1Open: Ref<boolean> = ref(false);
const accordion2Open: Ref<boolean> = ref(false);

const handleChangeCheatMode = () => {
  cheatMode.value = !cheatMode.value;
  console.log("changed cheat mode to", cheatMode.value);

  localStorage.setItem("cheatMode", cheatMode.value.toString());
};

const handleChangeGameMode = () => {
  localStorage.setItem("gameMode", gameMode.value.toString());
  console.log("gameMode onMounted is", gameMode.value);
};

onMounted(() => {
  const savedGameMode = localStorage.getItem("gameMode") || "1";
  gameMode.value = savedGameMode;

  const savedCheatMode = localStorage.getItem("cheatMode") || true;
  cheatMode.value = savedCheatMode;

  console.log("gameMode onMounted is", gameMode.value);
  console.log("chea tmode is", cheatMode.value);
});

const toggleAccordion = (number: number) => {
  if (number === 1) {
    accordion1Open.value = !accordion1Open.value;
    accordion2Open.value = false;
  } else {
    accordion2Open.value = !accordion2Open.value;
    accordion1Open.value = false;
  }
};
</script>

<style scoped>
input[type="radio"] {
  cursor: pointer;
}

label {
  cursor: pointer;
}
</style>
