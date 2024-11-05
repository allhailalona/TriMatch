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
      if (this.isLoggedIn) {
        const res = await fetch(
          `${import.meta.env.VITE_SERVER_URL || "http://localhost:3000/"}sync-with-server`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(this.userData),
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
      }
    },
  },
});
