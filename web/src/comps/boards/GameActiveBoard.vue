    <template>
      <div class="h-full flex grow items-center justify-around flex-row bg-purple-600">
        <!-- Left stats panel -->
        <div class="h-full w-[15%]">
          <p class="md-label font-bold text-white">{{ gameMode == 1 ? 'Whole Stack' : '3min Speed run' }}</p>
          <p class="md-label font-bold text-white">Sets found: {{ setsFound }}</p>
          <Time :mode="gameMode == 1 ? 'countdown' : 'timer'" />
        </div>

        <!-- Center game board -->
        <div class="h-full flex grow justify-center items-center flex-row">
          <div class="grid grid-cols-4 grid-rows-3">
            <div v-for="(card, index) in fgs.boardFeed.slice(0, 12)" :key="index" 
              @click="selectCard(card._id)"
              :class="getCardClasses(card._id)"
            >
              <div class="svg-content" v-html="String.fromCharCode(...card.image.data)"></div>
            </div>
          </div>
          
          <div v-if="fgs.boardFeed.length > 12" class="grid grid-cols-1 grid-rows-3">
            <div v-for="(card, index) in fgs.boardFeed.slice(12)" :key="index + 12"
              @click="selectCard(card._id)"
              :class="getCardClasses(card._id)"
            >
              <div class="svg-content" v-html="String.fromCharCode(...card.image.data)"></div>
            </div>
          </div>
        </div>

        <!-- Right control panel - updated with all buttons -->
        <div class="h-full flex items-center">
          <div class="lg:h-[45%] max-lg:h-[60%] w-full bg-yellow-500 flex flex-col justify-center items-center lg:gap-6 max-lg:gap-4 rounded-l-lg p-2 md:pr-4">
            <div class="flex flex-row gap-4 justify-between items-center p-2 hover:cursor-pointer" @click="drawACard">
              <OhVueIcon name="gi-card-draw" class="i-vue" fill="white"/>
            </div>
            <div v-if="cheatMode" 
                class="flex flex-row gap-4 justify-between items-center p-2 hover:cursor-pointer"
                @click="autoFindSet">
              <OhVueIcon name="si-iconfinder" class="i-vue" fill="white"/>
            </div>
            <div class="flex flex-row gap-4 justify-between items-center p-2 hover:cursor-pointer" @click="resetGameState">
              <OhVueIcon name="hi-solid-stop" class="i-vue" fill="white"/>
            </div>
            <div class="flex flex-row gap-4 justify-between items-center p-2 hover:cursor-pointer" @click="startGame">
              <OhVueIcon name="bi-arrow-counterclockwise" class="i-vue" fill="white"/>
            </div>
          </div>
        </div>
      </div>
    </template>

    <script lang="ts" setup>
    import { toRaw, inject, onMounted, onUnmounted } from "vue";
    import { io, Socket } from "socket.io-client";
    import { addIcons, OhVueIcon } from 'oh-vue-icons'
    import { GiCardDraw, SiIconfinder } from 'oh-vue-icons/icons'
    import { useGameToast } from '@/composables/useGameToast'
    import { useGameLogic } from '@/composables/useGameLogic'
    import Time from '../Time.vue'
    import { useUserStore } from "../../store";
    import type { FGS, UpdateBoardFeed, UpdateSelectedCards } from "../../types";

    addIcons( GiCardDraw, SiIconfinder)

    const userStore = useUserStore();

    const { autoFindSet, drawACard, startGame } = useGameLogic()
    const { gameOverToast, isSetValidAlert } = useGameToast()

    const fgs = inject("fgs") as FGS;
    const gameMode = inject('gameMode') as number
    const cheatMode = inject('cheatMode') as boolean
    const setsFound = inject('setsFound') as number // An insecure practice, to be improved.
    const updateBoardFeed = inject<UpdateBoardFeed>("updateBoardFeed")!;
    const updateSelectedCards = inject<UpdateSelectedCards>("updateSelectedCards");
    const resetGameState = inject('resetGameState') as () => Promise<void>

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
          if (data.isRecordBroken === true) {
            gameOverToast('broken', data.setsFound)
          } else if (data.isRecordBroken === false) {
            gameOverToast('notbroken', data.setsFound)
          } else if (data.isRecordBroken == null) {
            gameOverToast('guest', data.setsFound)
            document.cookie =
              "sessionId=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;"; // Remove guest sessionId cookie from the front
          }

          resetGameState()
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
      "inline-block rounded-lg bg-white hover:cursor-pointer transition-colors duration-200 flex justify-center items-center",
      "lg:m-1 sm:m-0.5 lg:border-[5px] md:border-[4px] sm:border-[3px]",
      "lg:w-32 lg:h-48 md:w-24 md:h-36 sm:w-16 sm:h-24", 
      fgs.selectedCards.includes(cardId)
        ? "border-green-600"
        : fgs.autoFoundSet.includes(cardId)
          ? "border-orange-400" 
          : "border-black hover:border-green-600"
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

      if (data.isValidSet) {
        setsFound.value++
        isSetValidAlert(true)
      } else {
        isSetValidAlert(false)
      }

      // If the game is over, show score and/or record notice (if user is logged in)
      if (data.newScore) {
        // Check login status and record status
        if (data.isRecordBroken === true) {
          gameOverToast('broken', data.setsFound)
        } else if (data.isRecordBroken === false) {
          gameOverToast('notbroken', data.setsFound)
        } else if (data.isRecordBroken == null) {
          gameOverToast('guest', data.setsFound)
          // That's the web version, the guest sessionId is stored in cookies and was already deleted in the server
        }

        resetGameState()
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
    .svg-content {
    transform: scale(1.3);
    }

    @media (max-width: 960px) and (min-width: 641px) {
    .svg-content {
      transform: scale(1);
    }
    }

    @media (max-width: 640px) {
    .svg-content {
      transform: scale(0.6);
    }
    }
  </style>


