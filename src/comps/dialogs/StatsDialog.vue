  <template>
    <v-dialog
      max-width="600"
      v-model="dialogValue"
      @update:model-value="(newValue) => emit('update:statsDialog', newValue)"
    >
      <v-card>
        <v-card-title> User Stats: </v-card-title>
        <v-card-text>
          <ul>
            <li v-for="(value, key) in userStore.userData.stats" :key="key">
              {{ key }}: {{ value }}
            </li>
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
  import { defineProps, defineEmits, computed } from 'vue'
  import { useUserStore } from '../../store'

  const userStore = useUserStore()

  const props = defineProps<{ statsDialog: boolean }>()

  const emit = defineEmits(['update:statsDialog'])

  // Use a computed property to handle the two-way binding with v-model
  const dialogValue = computed({
    get: () => props.statsDialog,
    set: (value: boolean) => emit('update:statsDialog', value)
  })
  </script>
