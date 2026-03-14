import { useEffect, useRef, useState, useCallback } from 'react'
import Peer, { type DataConnection } from 'peerjs'
import { useGame } from '../context/GameContext'
import type { GameState, Player } from '../types/game'
import {
  rollDice,
  moveOneStep,
  applyLandingLogic,
  buyProperty,
  endTurn,
  executeTrade,
} from '../logic/gameLogic'

const COLORS = ['#1034A6', '#E0115F', '#D4AF37', '#008080']

export const useNetworking = () => {
  const { gameState, setGameState, isHost, setIsHost, myId, playerName } = useGame()
  const [peer, setPeer] = useState<Peer | null>(null)
  const connections = useRef<{ [id: string]: DataConnection }>({})
  const [lobbyId, setLobbyId] = useState<string>('')

  const broadcastState = useCallback((state: GameState) => {
    Object.values(connections.current).forEach((conn) => {
      if (conn.open) {
        conn.send({ type: 'SYNC', state })
      }
    })
  }, [])

  const handleAction = useCallback(
    (action: any, from: string) => {
      if (!isHost) return

      setGameState((prev) => {
        let nextState = { ...prev }
        const currentPlayer = nextState.players[nextState.currentPlayerIndex]

        switch (action.type) {
          case 'ROLL':
            if (currentPlayer.id !== from) return prev
            const [d1, d2] = rollDice()
            nextState = { ...nextState, lastDice: [d1, d2], turnPhase: 'ROLLING' }
            nextState.logs = [`${currentPlayer.name} rolled ${d1 + d2}`, ...nextState.logs]
            break
          case 'FINISH_ROLL':
            if (nextState.turnPhase !== 'ROLLING') return prev
            nextState = {
              ...nextState,
              turnPhase: 'MOVING',
              stepsLeft: nextState.lastDice[0] + nextState.lastDice[1],
            }
            break
          case 'MOVE_STEP':
            if (nextState.turnPhase !== 'MOVING' || (nextState.stepsLeft || 0) <= 0) return prev
            nextState = moveOneStep(nextState)
            nextState.stepsLeft = (nextState.stepsLeft || 1) - 1
            if (nextState.stepsLeft === 0) {
              nextState.turnPhase = 'ACTION'
              nextState = applyLandingLogic(nextState)
            }
            break
          case 'BUY':
            if (currentPlayer.id !== from) return prev
            nextState = buyProperty(nextState, currentPlayer.position)
            break
          case 'END_TURN':
            if (currentPlayer.id !== from) return prev
            nextState = endTurn(nextState)
            break

          case 'CHAT':
            {
              const sender = nextState.players.find((p) => p.id === from)?.name || 'Unknown'
              nextState.chatMessages = [
                ...nextState.chatMessages,
                { sender, message: action.message },
              ]
            }
            break
          case 'PROPOSE_TRADE':
            nextState = executeTrade(nextState, from, action.partnerId, action.offer)
            break
          case 'JOIN':
            if (!prev.players.find((p) => p.id === from)) {
              const newPlayer: Player = {
                id: from,
                name: action.name || `Player ${prev.players.length + 1}`,
                balance: 1500,
                position: 0,
                properties: [],
                isBankrupt: false,
                color: COLORS[prev.players.length % COLORS.length],
              }
              nextState = { ...nextState, players: [...prev.players, newPlayer] }
              nextState.logs = [`${newPlayer.name} joined the game.`, ...nextState.logs]
            }
            break
          case 'START_COUNTDOWN':
            if (nextState.status === 'WAITING' && nextState.countdown === null) {
              nextState.countdown = 5
              nextState.logs = ['Host started the game countdown.', ...nextState.logs]
            }
            break
          case 'TICK_COUNTDOWN':
            if (nextState.status === 'WAITING' && typeof nextState.countdown === 'number') {
              nextState.countdown -= 1
              if (nextState.countdown <= 0) {
                nextState.status = 'PLAYING'
                nextState.countdown = null
                nextState.logs = ['Game started!', ...nextState.logs]
              }
            }
            break
          case 'CANCEL_COUNTDOWN':
            if (nextState.status === 'WAITING' && nextState.countdown !== null) {
              nextState.countdown = null
              nextState.logs = ['Host cancelled the game start.', ...nextState.logs]
            }
            break
          case 'PLAYER_DISCONNECT': {
            const disconnectedPlayer = nextState.players.find((p) => p.id === from)
            if (disconnectedPlayer) {
              nextState.players = nextState.players.filter((p) => p.id !== from)
              nextState.logs = [`${disconnectedPlayer.name} left the game.`, ...nextState.logs]

              if (nextState.status === 'WAITING' && nextState.countdown !== null) {
                nextState.countdown = null
                nextState.logs = [
                  'Countdown cancelled because a player disconnected.',
                  ...nextState.logs,
                ]
              }

              // If there are players left, adjust currentPlayerIndex if needed
              if (nextState.players.length > 0) {
                if (nextState.currentPlayerIndex >= nextState.players.length) {
                  nextState.currentPlayerIndex = 0
                }
              }
            }
            break
          }
        }
        return nextState
      })
    },
    [isHost, setGameState],
  )

  const sendAction = useCallback(
    (action: any) => {
      if (isHost) {
        handleAction(action, myId)
      } else {
        const hostConn = connections.current[lobbyId]
        if (hostConn && hostConn.open) {
          hostConn.send({ type: 'ACTION', action })
        }
      }
    },
    [isHost, myId, handleAction, lobbyId],
  )

  useEffect(() => {
    const newPeer = new Peer(myId)
    newPeer.on('open', () => {
      setPeer(newPeer)
    })

    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        connections.current[conn.peer] = conn
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn.on('data', (data: any) => {
        if (data.type === 'SYNC') {
          setGameState(data.state)
        } else if (data.type === 'ACTION' && isHost) {
          handleAction(data.action, conn.peer)
        }
      })

      conn.on('close', () => {
        delete connections.current[conn.peer]
        if (isHost) {
          handleAction({ type: 'PLAYER_DISCONNECT' }, conn.peer)
        }
      })
    })

    return () => {
      newPeer.destroy()
    }
  }, [isHost, myId, setGameState, handleAction])

  useEffect(() => {
    if (isHost) {
      broadcastState(gameState)
    }
  }, [gameState, isHost, broadcastState])

  const createLobby = useCallback(() => {
    setIsHost(true)
    setLobbyId(myId)
    setGameState((prev) => ({
      ...prev,
      status: 'WAITING',
      countdown: null,
      players: [
        {
          id: myId,
          name: playerName || 'Host',
          balance: 1500,
          position: 0,
          properties: [],
          isBankrupt: false,
          color: COLORS[0],
        },
      ],
    }))
  }, [myId, setIsHost, setGameState, playerName])

  const joinLobby = useCallback(
    (id: string) => {
      if (!peer) return
      const conn = peer.connect(id)
      conn.on('open', () => {
        connections.current[id] = conn
        setLobbyId(id)
        setIsHost(false)

        // Send JOIN action to the host right after connecting
        conn.send({ type: 'ACTION', action: { type: 'JOIN', name: playerName } })
      })

      conn.on('data', (data: any) => {
        if (data.type === 'SYNC') {
          setGameState(data.state)
        }
      })
    },
    [peer, setGameState, setIsHost, playerName],
  )

  return { createLobby, joinLobby, lobbyId, sendAction }
}
