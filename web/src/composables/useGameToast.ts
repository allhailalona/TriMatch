// composables/useGameToast.ts
import { useToast } from "vue-toastification";

export function useGameToast() {
  const toast = useToast();

  const gameOverToast = (type: 'guest' | 'broken' | 'notbroken', setsFound: number) => {
    switch(type) {
      case 'guest':
        toast.info(`You found ${setsFound} sets! Login to save records`, { timeout: 10000 });
        break;
      case 'broken':
        toast.success(`Congratulations! New record with ${setsFound} sets!`, { timeout: 10000 });
        break;
      case 'notbroken':
        toast.info(`You found ${setsFound} sets - no record broken`, { timeout: 10000 });
        break;
    }
  }

  const isSetValidAlert = (isValid: boolean) => {
    if (isValid) {
      toast.success("Found set!", { timeout: 2000 });
    } else {
      toast.error("Not a valid set", { timeout: 2000 });
    }
  }

  return {
    gameOverToast,
    isSetValidAlert
  };
}