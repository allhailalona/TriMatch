<template>
  <v-dialog
    max-width="600"
    v-model="dialogValue"
    @update:model-value="(newValue) => emit('update:statsDialog', newValue)"
  >
    <v-card>
      <v-card-title> User Stats: </v-card-title>
      <v-card-text>
        <ul class="text-h6">
          <li class="mb-2">Games Played: {{ userStore.userData.stats.gamesPlayed }}</li>
          <li class="mb-2">Sets Found: {{ userStore.userData.stats.setsFound }}</li>
          <li class="mb-2">3m Speed Run Record: {{ userStore.userData.stats.speedrun3min }} sets found!</li>
          <li class="mb-2">Whole Stack Speed Run Record: {{ userStore.userData.stats.speedrunWholeStack }} seconds to complete stack</li>
        </ul>
      </v-card-text>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from "vue";
import { useUserStore } from "../../store";

const userStore = useUserStore();

const props = defineProps<{ statsDialog: boolean }>();

const emit = defineEmits(["update:statsDialog"]);

// Use a computed property to handle the two-way binding with v-model
const dialogValue = computed({
  get: () => props.statsDialog,
  set: (value: boolean) => emit("update:statsDialog", value),
});
</script>
