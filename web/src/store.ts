import { defineStore } from "pinia";
import { watch } from "vue";

export const useUserStore = defineStore("user", {
  state: () => ({
    userData: {
      _id: "",
      username: "",
      stats: {
        gamesPlayed: 0,
        setsFound: 0,
        speedrun3min: 0,
        speedrunWholeStack: 0,
      },
    },
    isLoggedIn: false,
  }),
  actions: {
    updateUserData(data) {
      this.userData = { ...this.userData, ...data };
    },
    setLoggedIn(status) {
      this.isLoggedIn = status;
    },
    setupWatcher() {
      // Listens to changes and stores them in local storage, this will run on login as well since userData is created
      watch(
        () => this.userData,
        (newValue) => {
          localStorage.setItem(
            `${this.userData._id}:localStorage`,
            JSON.stringify(newValue),
          );
          this.syncWithServer(); // For debugging purposes in dev mode I'm calling the function manually
        },
        { deep: true },
      );
    },
    setupInterval() {
      setInterval(this.syncWithServer, 2 * 60 * 1000); // Sync local storage with server every 2 minutes
    },
    async syncWithServer() {
      // Runs every 2 minutes and after logout
      if (this.isLoggedIn && this.userData.username.length > 0) {
        console.log('user is logged In and a username was found!')
        // Create a clean object with just the data we need
        const userDataToPass = {
          _id: this.userData._id,
          username: this.userData.username,
          stats: {
            gamesPlayed: this.userData.stats.gamesPlayed,
            setsFound: this.userData.stats.setsFound,
            speedrun3min: this.userData.stats.speedrun3min,
            speedrunWholeStack: this.userData.stats.speedrunWholeStack,
          }
        };

        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/"}sync-with-server`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(userDataToPass),
            credentials: "include",
          },
        );
        
        if (!res.ok) {
          const errorData = await res.json();
          if (res.status === 401) {
            throw new Error(
              `Error 401 in syncWithServer in store.ts: ${errorData.error || "Unknown error"}`,
            );
          } else if (res.status === 500) {
            throw new Error(
              `Unknown error in syncWithServer in store.ts: ${errorData.error || "Unknown error"}`,
            ); // Otherwise simply include an unknown error
          }
        }
      } else {
        console.log('no active login was found user data is empty, sync with server WILL NOT run')
      }      
    },
  },
});
