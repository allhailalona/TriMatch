<template>
  <div class="w-full h-[10%] border-2 border-red-500 flex justify-center items-center gap-2">
    <v-btn @click="startGame()">Start Game</v-btn>
    <v-btn @click="autoFindSet()">Find A Set</v-btn>
    <v-btn @click="drawACard()">Draw A Card</v-btn>
    <v-btn @click="viewStats()">stats</v-btn>
    <v-btn v-if="userData.username === ''" @click="dialog = true">Login</v-btn>
    <template v-else>
      <h1>logged in as {{ userData.username }}</h1>
      <v-btn @click="logOut()">Log out</v-btn>
    </template>
  </div>
  <v-dialog max-width="600" v-model="dialog" @update:model-value="handleDialogClose()">
    <v-card>
      <v-card-text>
        <v-btn>Google Auth</v-btn>
        <v-alert v-if="emailError" type="error" class="mb-2">
          Please input a valid email address.
        </v-alert>
        <v-text-field
          v-if="!showOTPInput"
          label="Email"
          v-model="email"
          :class="{ 'bg-red-100': emailError }"
        ></v-text-field>
        <v-text-field
          v-else
          label="OTP"
          v-model="OTP"
          :class="{ 'bg-red-100': OTPError }"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <v-btn v-if="!showOTPInput" @click="sendOTP()">send OTP</v-btn>
        <v-btn v-else @click="validateOTP()">validate OTP</v-btn>
        <v-btn @click="handleDialogClose()">Close</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, reactive, inject } from 'vue'
import { FGS, UpdateBoardFeed } from '@/types'

const dialog = ref<boolean>(false)
const showOTPInput = ref<boolean>(false)
const emailError = ref<boolean>(false)
const email = ref<string>('lotanbar3@gmail.com')
const OTP = ref<string>('')
const OTPError = ref<boolean>(false)

let userData = reactive({
  username: '' as string
})

const fgs = inject<FGS>('fgs')!
const updateBoardFeed = inject<UpdateBoardFeed>('updateBoardFeed')!

async function startGame(): Promise<void> {
  try {
    console.log('calling express start-game')
    const res = await fetch('http://localhost:3000/start-game', {
      method: 'POST'
    })

    if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
    }

    const data = await res.json()

    console.log('hello from Navbar just recieved boardFeed is', data)

    // To maintain reactivity of reactive variables, we must use .splice to update the array
    // Using boardFeed = data will cause boardFeed to point somewhere else
    fgs.boardFeed.splice(0, fgs.boardFeed.length, ...data)
  } catch (err) {
    throw err
  }
}

async function autoFindSet(): Promise<void> {
  try {
    if (fgs.boardFeed.length >= 12) {
      /*
        Convert boardFeed, which now contains image data as well, to an id only array, which looks
        like the selectedCards array, then MongoDB can find the relevant items in cardProps. This process is done in 
        the front to save bandwitch. sbf stands for strippedBoardFeed
      */

      // sbf stands for strippedBoardFeed!
      const sbf = fgs.boardFeed.map((card: Card) => card._id)
      console.log('sbf is', sbf)

      console.log('data is here calling express')
      const res = await fetch('http://localhost:3000/auto-find-set', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ sbf })
      })

      if (!res.ok) {
      // Handle the error response
      const errorData = await res.json();
      throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
    }

      const data = await res.json()
      fgs.autoFoundSet.splice(0, fgs.autoFoundSet.length, ...data)
    } else {
      console.log('data is not here please start a game')
    }
  } catch (err) {
    throw err
  }
}

async function drawACard(): Promise<void> {
  try {
    // Make sure the game is running
    if (fgs.boardFeed.length >= 12) {
      // Allow the user to draw up to three cards, afterwards, make sure there is really NO set before drawing another one!
      if (fgs.boardFeed.length < 15) {
        const res = await fetch('http://localhost:3000/draw-a-card', {
          method: 'POST'
        })

        if (!res.ok) {
          // Handle the error response
          const errorData = await res.json();
          throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
        }

        const data = await res.json()
        console.log('hello from drawACard in Navbar.vue', data)
        updateBoardFeed(data)
        console.log('fgs.boardFeed is', fgs.boardFeed.length)
      } else {
        // Run the autoFindSet here to make sure the user really needs more than 15 cards
        console.log('there are more than 15 cards, start working on a set!')
      }
    } else {
      console.log('a game is not started please start one!')
    }
  } catch (err) {
    throw err
  }
}

async function sendOTP(): Promise<void> {
  try {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (emailRegex.test(email.value)) {
      emailError.value = false
      showOTPInput.value = true
      const res = await fetch('http://localhost:3000/send-otp', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ email: email.value })
      })

      if (!res.ok) {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
      }
    } else {
      emailError.value = true
    }
  } catch (err) {
    throw err
  }
}

async function validateOTP(): Promise<boolean | void> {
  try {
    const res = await fetch('http://localhost:3000/validate-otp', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ OTP: OTP.value, email: email.value }),
      credentials: 'include'
    })

    if (res.ok) {
      const data = await res.json()
      console.log('hello from Navbar.vue data is', data)
      if (data.isValidated) {
        // The command to store cookies is not here but in server.ts
        // Neither u can access the cookies in front, they are accessed via express by adding
        // credentials: include

        // Changes in front
        dialog.value = false // Close dialog
        userData.username = data.username
      }
    } else {
      if (res.status === 429) {
        const data = await res.json()
        alert(data.error) // Display the error message
        return
      } else {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
      }
    }
  } catch (err) {
    throw err
  }
}

function handleDialogClose(): void {
  dialog.value = false
  emailError.value = false
  OTPError.value = false
  OTP.value = ''
  showOTPInput.value = false
}

async function logOut(): Promise<void> {
  try {
    const res = await fetch('http://localhost:3000/log-out', {
      method: 'POST',
      credentials: 'include'
    })

    
    if (!res.ok) {
      if (res.status === 401) {
        throw new Error(`Error ${res.status} no active session`)
      } else {
        // Handle the error response
        const errorData = await res.json();
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`);
      }
    }
  } catch (err) {
    throw err
  }
}

async function viewStats() {
  try {
    if (userData.username === '') {
      alert('u have to be logged in to view stats')
    } else {
      const res = await fetch('http://localhost:3000/view-stats', {
      method: 'POST',
      credentials: 'include'
    })

    if (!res.ok) {
      throw new Error ('')
    }
    }
  } catch (err) {
    throw err
    
  }
}
</script>
