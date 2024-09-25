<template>
  <v-dialog
    max-width="600"
    v-model="props.statsDialog"
    @update:model-value="(newValue) => emit('update:statsDialog', newValue)"
  >
    <v-card>
      <v-card-title> Stats </v-card-title>
      <v-card-text>
        <h2>stats for {{ props.userData.username }}:</h2>
        <ul>
          <li v-for="(value, key) in props.userData.stats" :key="key">{{ key }}: {{ value }}</li>
        </ul>
      </v-card-text>
      <v-card-actions>
        <!--just an idea for the far far future...-->
        <v-btn>export stats</v-btn>
        <v-btn>import stats</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
const props = defineProps<{
  statsDialog: boolean
  userData: {
    username: string
    stats: {
      gamesPlayed: number
      setsFound: number
      speedrun3min: number
      speedrunWholeStack: number
    }
  }
}>()

const emit = defineEmits(['update:statsDialog'])
</script>
