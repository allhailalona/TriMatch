import { defineStore } from 'pinia'
import { watch } from 'vue'

export const useUserStore = defineStore('user', {
  state: () => ({
    userData: {
      _id: '',
      username: '',
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0
      }
    },
    isLoggedIn: false
  }),
  actions: {
    updateUserData(data) {
      this.userData = { ...this.userData, ...data }
    },
    setLoggedIn(status) {
      this.isLoggedIn = status
    },
    setupWatcher() {
      // Listens to changes and stores them in local storage, this will run on login as well since userData is created
      watch(
        () => this.userData,
        (newValue) => {
          localStorage.setItem(`${this.userData._id}:localStorage`, JSON.stringify(newValue))
          this.syncWithServer() // For debugging purposes in dev mode I'm calling the function manually
        },
        { deep: true }
      )
    },
    setupInterval() {
      setInterval(this.syncWithServer, 2 * 60 * 1000) // Sync local storage with server every 2 minutes
    },
    async syncWithServer() {
      // Runs every 2 minutes and after logout
      if (this.isLoggedIn) {
        try {
          const res = await fetch('http://localhost:3000/sync-with-server', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(this.userData),
            credentials: 'include'
          })
          if (!res.ok) {
            if (res.status === 401) {
              const errorData = await res.json()
              throw new Error(
                `Error ${res.status} in syncWithServer in store.ts: ${errorData.error || 'Unknown error'}`
              )
            } else if (res.status === 500) {
              const errorData = await res.json() // Try to fetch an error message
              throw new Error(
                `Error ${res.status} in syncWithServer in store.ts: ${errorData.error || 'Unknown error'}`
              ) // Otherwise simply include an unknown error
            }
          }
        } catch (err) {
          console.error('unkown error in SyncWithServer in store.ts')
          throw err
        }
      }
    }
  }
})
