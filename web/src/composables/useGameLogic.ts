// useGameLogic.ts
import { inject } from 'vue'
import type { Ref } from 'vue'
import { useUserStore } from '../store'
import type { FGS, Card } from '../types'

export function useGameLogic() {
  // Get stores and injected values
  const userStore = useUserStore()
  const fgs = inject('fgs') as FGS
  const gameMode = inject('gameMode') as Ref<number>
  const isGameActive = inject('isGameActive') as Ref<boolean>
  const updateBoardFeed = inject('updateBoardFeed') as (data: Card[]) => void
  const resetGameState = inject('resetGameState') as () => Promise<void>

  // Main game functions
  const startGame = async () => {
    console.log('about to start game calling ', import.meta.env.VITE_SERVER_URL)
    resetGameState()
    isGameActive.value = true

    if (userStore.userData.username.length >= 1) {
      userStore.updateUserData({
        stats: {
          ...userStore.userData.stats,
          gamesPlayed: userStore.userData.stats.gamesPlayed + 1,
        },
      })
    }

    const url = new URL(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000/'}start-game`)
    url.searchParams.append('gameMode', gameMode.value)

    try {
      const res = await fetch(url, {
        method: 'GET',
        credentials: 'include',
        headers: {
          'X-Request-Origin': '/start-game',
          'X-Source': 'web',
        },
      })
      
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')
      
      updateBoardFeed(data.boardFeed)
      isGameActive.value = true // Set game as active when started
    } catch (error) {
      console.error('Start game error:', error)
      throw error
    }
  }

  const autoFindSet = async () => {
    if (fgs.boardFeed.length < 12) {
      console.log('data is not here please start a game')
      return
    }

    const sbf = fgs.boardFeed.map(card => card._id)
    const params = new URLSearchParams({ sbf }).toString()
    
    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000/'}auto-find-set?${params}`, {
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' }
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')

      fgs.autoFoundSet.splice(0, fgs.autoFoundSet.length, ...data)
    } catch (error) {
      console.error('Auto find set error:', error)
      throw error
    }
  }

  const drawACard = async () => {
    if (fgs.boardFeed.length < 12) {
      console.log('a game is not started please start one!')
      return
    }

    if (fgs.boardFeed.length >= 15) {
      console.log('there are more than 15 cards, start working on a set!')
      return 
    }

    try {
      const res = await fetch(`${import.meta.env.VITE_SERVER_URL || 'http://localhost:3000/'}draw-a-card`, {
        credentials: 'include'
      })

      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Unknown error')

      updateBoardFeed(data)
    } catch (error) {
      console.error('Draw card error:', error) 
      throw error
    }
  }

  return {
    startGame,
    autoFindSet,
    drawACard
  }
}