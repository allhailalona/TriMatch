<template>
  <v-dialog
    max-width="600"
    v-model="props.loginDialog"
    @update:model-value="(newValue) => emit('update:loginDialog', newValue)"
  >
    <v-card class="h-full px-4 flex justify-center items-center flex-row border-4 border-red-400">
      <button @click="initiateGoogleAuth()"><OhVueIcon name="fc-google" scale="2" fill="white"/></button>
      <v-card-text class="h-full w-full flex justify-center items-center flex-row gap-4">
        <v-text-field
          v-if="!showOTPInput"
          label="Email"
          v-model="email"
          class="mt-[20px]"
          :class="{ 'bg-red-100': emailError }"
        ></v-text-field>
        <v-text-field
          v-else
          label="OTP"
          v-model="OTP"
          class="mt-[20px]"
          :class="{ 'bg-red-100': OTPError }"
        ></v-text-field>
      </v-card-text>
      <v-card-actions>
        <button v-if="!showOTPInput" @click="sendOTP()"><OhVueIcon name="io-send-sharp" scale="2" fill="black"/></button>
        <v-btn v-else @click="validateOTP()">validate OTP</v-btn>
      </v-card-actions>
    </v-card>
  </v-dialog>
</template>

<script lang="ts" setup>
import { ref, inject } from 'vue'
import { useUserStore } from '../../store'
import { OhVueIcon, addIcons } from 'oh-vue-icons'
import { FcGoogle, IoSendSharp } from 'oh-vue-icons/icons'

addIcons(FcGoogle, IoSendSharp)

const email = ref<string>('')
const emailError = ref<boolean>(false)
const OTP = ref<string>('')
const OTPError = ref<boolean>(false)
const showOTPInput = ref<boolean>(false)
const updateBoardFeed = inject('updateBoardFeed')

const userStore = useUserStore()

const props = defineProps<{
  loginDialog: boolean
}>()

const emit = defineEmits(['update:loginDialog'])

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
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
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

    if (!res.ok) {
      if (res.status === 429) {
        const data = await res.json()
        alert(data.error) // Display the error message
        return
      } else {
        // Handle the error response
        const errorData = await res.json()
        throw new Error(`Validation failed: ${errorData.message || 'Unknown error'}`)
      }
    }

    const { isValidated, userData } = await res.json()
    if (isValidated) {
      // The command to store cookies is not here but in server.ts
      // Neither u can access the cookies in front, they can be accessed via express by adding credentials: include in the request

      handleDialogClose() // Close loginDialog
      console.log('trying to clear boarda in LoginDialog.vue')
      updateBoardFeed([]) // Clear board

      console.log('hello from LoginDialog recieved data from server:', userData)

      // Update userData reactive
      userStore.isLoggedIn = true
      userStore.updateUserData(userData)
    }
  } catch (err) {
    throw err
  }
}

function handleDialogClose(): void {
  emit('update:loginDialog', false)
  emailError.value = false
  OTPError.value = false
  OTP.value = ''
  showOTPInput.value = false
}

async function initiateGoogleAuth() {
  // Redirect the user to your backend's Google authentication route
  console.log('init google auth was called')
  window.location.href = 'http://localhost:3000/auth/google'
}
</script>
