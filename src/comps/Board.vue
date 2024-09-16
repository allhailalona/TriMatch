  <template>
    <div>
      <!-- Further attnetion will be required here to improve styling  -->
      <div class="w-max-full w-[800px] h-[90%] border-2 border-green-400 grid grid-cols-4">
        <div v-for="(card, index) in props.boardFeed" :key="index">
          <div 
            v-html="bufferToText(card.image.data)" 
            @click="getCardId(card._id)"
            class="inline-block border-[4px] border-black hover:cursor-pointer hover:border-pink-400 transition-colors duration-300"
          >
          </div>
        </div>
      </div>
    </div>
  </template>

  <script setup>
  import { reactive, watch, toRaw } from 'vue'

  let selectedCards = reactive([])

  const props = defineProps({
    boardFeed: {
      type: Array,
      required: true,
      validator: (value) => {
        return value.every(
          (item) =>
            typeof item._id === 'string' &&
            item.image &&
            item.image.type === 'Buffer' &&
            Array.isArray(item.image.data)
        )
      }
    }
  })

  // Watch for changes in the boardFeed prop
  watch(() => props.boardFeed, (newBoardFeed) => {
    console.log('boardFeed updated in Board component:', toRaw(newBoardFeed))
  }, { immediate: true, deep: true })

  // Decode buffers
  function bufferToText(buffer) {
    return String.fromCharCode(...buffer)
  }

  // On click logic
  function getCardId(id) {
    if (selectedCards.includes(id)) {
      let index = selectedCards.indexOf(id)
      index > -1 && selectedCards.splice(index, 1)
      console.log(toRaw(selectedCards))
    } else {
      selectedCards.push(id)
      console.log(toRaw(selectedCards))
      if (selectedCards.length === 3) {
        console.log('sending to validation')
        validate()
        selectedCards = []
      }
    }
  }

  async function validate() {
    try {
      console.log('hello from validate calling express.js')
      const res = await fetch('http://localhost:3000/validate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ selectedCards }),
      });

      const data = await res.json()
      console.log('done with express validate function data is', data)
      
    } catch (err) {
      console.error('error in validate function in Board.vue', err)
      throw err
    }
  }

  </script>
