import { useEffect, useRef, useState, useCallback } from 'react'
import Peer, { type DataConnection, type MediaConnection } from 'peerjs'
import { useGame } from '../context/GameContext'
import { useTranslation } from 'react-i18next'
import type { GameState, Player } from '../types/game'
import {
  rollDice,
  moveOneStep,
  applyLandingLogic,
  buyProperty,
  buyHouse,
  sellHouse,
  sellProperty,
  endTurn,
  proposeTrade,
  acceptTrade,
  rejectTrade,
  cancelTrade,
  handleBankrupt,
} from '../logic/gameLogic'
import { isValidGameAction, isValidGameState } from '../logic/validation.ts'

const COLORS = ['#1034A6', '#E0115F', '#D4AF37', '#008080']

const sanitizeName = (name: unknown, defaultName: string): string => {
  if (typeof name !== 'string') return defaultName
  const trimmed = name.trim()
  if (!trimmed) return defaultName
  return trimmed.slice(0, 15)
}

export const useNetworking = () => {
  const { t } = useTranslation()
  const { gameState, setGameState, isHost, setIsHost, myId, playerName, avatarName, iceServers } =
    useGame()
  const [peer, setPeer] = useState<Peer | null>(null)
  const [connectionError, setConnectionError] = useState<string | null>(null)
  const [isConnecting, setIsConnecting] = useState(false)
  const connections = useRef<{ [id: string]: DataConnection }>({})
  const [lobbyId, setLobbyId] = useState<string>('')

  const [myStream, setMyStream] = useState<MediaStream | null>(null)
  const [remoteStreams, setRemoteStreams] = useState<{ [id: string]: MediaStream }>({})
  const [voiceError, setVoiceError] = useState<string | null>(null)
  const mediaConnections = useRef<{ [id: string]: MediaConnection }>({})

  const broadcastState = useCallback((state: GameState) => {
    Object.values(connections.current).forEach((conn) => {
      if (conn.open) {
        conn.send({ type: 'SYNC', state })
      }
    })
  }, [])

  const handleAction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (action: any, from: string) => {
      if (!isHost) return
      if (!isValidGameAction(action)) {
        setConnectionError(t('errors.invalidAction'))
        return
      }

      setGameState((prev) => {
        let nextState = { ...prev }
        const currentPlayer = nextState.players[nextState.currentPlayerIndex]

        switch (action.type) {
          case 'ROLL': {
            if (!currentPlayer || currentPlayer.id !== from) return prev
            const [d1, d2] = rollDice()
            nextState = { ...nextState, lastDice: [d1, d2], turnPhase: 'ROLLING' }
            // Dice roll log removed per requirements
            break
          }
          case 'FINISH_ROLL':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            if (nextState.turnPhase !== 'ROLLING') return prev
            nextState = {
              ...nextState,
              turnPhase: 'MOVING',
              stepsLeft: nextState.lastDice[0] + nextState.lastDice[1],
            }
            break
          case 'MOVE_STEP':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            if (nextState.turnPhase !== 'MOVING' || (nextState.stepsLeft || 0) <= 0) return prev
            nextState = moveOneStep(nextState)
            nextState.stepsLeft = (nextState.stepsLeft || 1) - 1
            if (nextState.stepsLeft === 0) {
              nextState.turnPhase = 'ACTION'
              nextState = applyLandingLogic(nextState)
            }
            break
          case 'BUY':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            nextState = buyProperty(nextState, currentPlayer.position)
            break
          case 'BUY_HOUSE':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            nextState = buyHouse(nextState, action.tileId)
            break
          case 'SELL_HOUSE':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            nextState = sellHouse(nextState, action.tileId)
            break
          case 'SELL_PROPERTY':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            nextState = sellProperty(nextState, action.tileId)
            break
          case 'END_TURN':
            if (!currentPlayer || currentPlayer.id !== from) return prev
            nextState = endTurn(nextState)
            break

          case 'CHAT': {
            const player = nextState.players.find((p) => p.id === from)
            if (!player) return prev
            nextState.chatMessages = [
              ...nextState.chatMessages,
              { sender: player.name, message: action.message },
            ]
            break
          }
          case 'PROPOSE_TRADE':
            // Validation of offer is done in isValidGameAction
            nextState = proposeTrade(nextState, from, action.partnerId, action.offer)
            break
          case 'ACCEPT_TRADE': {
            const trade = nextState.trades.find((t) => t.id === action.tradeId)
            if (!trade || trade.toId !== from) return prev
            nextState = acceptTrade(nextState, action.tradeId)
            break
          }
          case 'REJECT_TRADE': {
            const trade = nextState.trades.find((t) => t.id === action.tradeId)
            if (!trade || trade.toId !== from) return prev
            nextState = rejectTrade(nextState, action.tradeId)
            break
          }
          case 'CANCEL_TRADE': {
            const trade = nextState.trades.find((t) => t.id === action.tradeId)
            if (!trade || trade.fromId !== from) return prev
            nextState = cancelTrade(nextState, action.tradeId)
            break
          }
          case 'JOIN':
            if (!prev.players.find((p) => p.id === from)) {
              const newPlayer: Player = {
                id: from,
                name: sanitizeName(action.name, `Player ${prev.players.length + 1}`),
                avatar: action.avatar || 'merchant',
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
            if (from !== lobbyId) return prev
            if (nextState.status === 'WAITING' && nextState.countdown === null) {
              nextState.countdown = 5
              nextState.logs = ['Host started the game countdown.', ...nextState.logs]
            }
            break
          case 'TICK_COUNTDOWN':
            if (from !== lobbyId) return prev
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
            if (from !== lobbyId) return prev
            if (nextState.status === 'WAITING' && nextState.countdown !== null) {
              nextState.countdown = null
              nextState.logs = ['Host cancelled the game start.', ...nextState.logs]
            }
            break
          case 'PLAYER_DISCONNECT': {
            const disconnectedPlayerIndex = nextState.players.findIndex((p) => p.id === from)
            if (disconnectedPlayerIndex !== -1) {
              const disconnectedPlayer = nextState.players[disconnectedPlayerIndex]
              const newPlayers = [...nextState.players]
              newPlayers.splice(disconnectedPlayerIndex, 1)
              nextState.players = newPlayers
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
          case 'BANKRUPT': {
            const bankruptPlayer = nextState.players.find((p) => p.id === from)
            if (!bankruptPlayer || bankruptPlayer.isBankrupt) return prev

            nextState = handleBankrupt(nextState, from)
            nextState.logs = [`${bankruptPlayer.name} has declared bankruptcy.`, ...nextState.logs]

            if (nextState.players[nextState.currentPlayerIndex].id === from) {
              nextState = endTurn(nextState)
            }

            const activePlayers = nextState.players.filter((p) => !p.isBankrupt)
            if (activePlayers.length <= 1) {
              nextState.status = 'FINISHED'
              const winnerName =
                activePlayers.length === 1 ? activePlayers[0].name : bankruptPlayer.name
              nextState.logs = [`${winnerName} has won the game!`, ...nextState.logs]
            }
            break
          }
          case 'REMATCH': {
            // Only accept REMATCH if it's from the lobby host (whose ID is the lobbyId)
            if (from !== lobbyId) return prev
            nextState = {
              ...nextState,
              status: 'WAITING',
              currentPlayerIndex: 0,
              turnPhase: 'ROLL',
              lastDice: [1, 1],
              countdown: null,
              prison: {},
              activeEvent: null,
              logs: ['Rematch initiated! Waiting to start...'],
              players: nextState.players.map((p) => ({
                ...p,
                balance: 1500,
                position: 0,
                properties: [],
                isBankrupt: false,
              })),
            }
            break
          }
          case 'CLEAR_EVENT': {
            // Only the current player or the host can clear the event
            if (from !== lobbyId && (!currentPlayer || from !== currentPlayer.id)) return prev
            nextState.activeEvent = null
            break
          }
          case 'JOIN_VOICE': {
            const playerIndex = nextState.players.findIndex((p) => p.id === from)
            if (playerIndex !== -1) {
              const newPlayers = [...nextState.players]
              newPlayers[playerIndex] = {
                ...newPlayers[playerIndex],
                hasJoinedVoice: true,
                isMuted: false,
              }
              nextState.players = newPlayers
            }
            break
          }
          case 'TOGGLE_MUTE': {
            const playerIndex = nextState.players.findIndex((p) => p.id === from)
            if (playerIndex !== -1) {
              const newPlayers = [...nextState.players]
              newPlayers[playerIndex] = { ...newPlayers[playerIndex], isMuted: action.isMuted }
              nextState.players = newPlayers
            }
            break
          }
          case 'KICK_PLAYER': {
            if (from !== lobbyId && from !== myId) return prev
            const kickedPlayerIndex = nextState.players.findIndex((p) => p.id === action.playerId)
            if (kickedPlayerIndex !== -1) {
              const kickedPlayer = nextState.players[kickedPlayerIndex]

              if (nextState.status === 'PLAYING') {
                // To keep index safe and clear properties, we handle them as bankrupt
                nextState = handleBankrupt(nextState, action.playerId)
                nextState.logs = [`${kickedPlayer.name} was kicked by the host.`, ...nextState.logs]

                if (nextState.players[nextState.currentPlayerIndex].id === action.playerId) {
                  nextState = endTurn(nextState)
                }

                const activePlayers = nextState.players.filter((p) => !p.isBankrupt)
                if (activePlayers.length <= 1) {
                  nextState.status = 'FINISHED'
                  const winnerName =
                    activePlayers.length === 1 ? activePlayers[0].name : kickedPlayer.name
                  nextState.logs = [`${winnerName} has won the game!`, ...nextState.logs]
                }
              } else {
                // In waiting/lobby, we can just remove them cleanly
                const newPlayers = [...nextState.players]
                newPlayers.splice(kickedPlayerIndex, 1)
                nextState.players = newPlayers
                nextState.logs = [`${kickedPlayer.name} was kicked by the host.`, ...nextState.logs]

                if (nextState.status === 'WAITING' && nextState.countdown !== null) {
                  nextState.countdown = null
                  nextState.logs = [
                    'Countdown cancelled because a player was kicked.',
                    ...nextState.logs,
                  ]
                }

                if (nextState.players.length > 0) {
                  if (kickedPlayerIndex < nextState.currentPlayerIndex) {
                    nextState.currentPlayerIndex -= 1
                  } else if (nextState.currentPlayerIndex >= nextState.players.length) {
                    nextState.currentPlayerIndex = 0
                  }
                }
              }
            }
            break
          }
        }
        return nextState
      })
    },
    [isHost, setGameState, lobbyId, myId, t],
  )

  const sendAction = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (action: any) => {
      if (isHost) {
        if (action.type === 'KICK_PLAYER') {
          const targetConn = connections.current[action.playerId]
          if (targetConn) {
            targetConn.close()
          }
        }
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

  const handleActionRef = useRef(handleAction)
  const isHostRef = useRef(isHost)
  const lobbyIdRef = useRef(lobbyId)

  useEffect(() => {
    handleActionRef.current = handleAction
    isHostRef.current = isHost
    lobbyIdRef.current = lobbyId
  }, [handleAction, isHost, lobbyId])

  const hasJoinedVoice = !!myStream

  // Answer incoming voice calls
  useEffect(() => {
    if (!peer || !hasJoinedVoice) return

    const handleCall = (call: MediaConnection) => {
      // Only answer if we've opted in to voice chat
      call.answer(myStream || undefined)

      call.on('stream', (remoteStream) => {
        setRemoteStreams((prev) => ({ ...prev, [call.peer]: remoteStream }))
      })

      call.on('close', () => {
        setRemoteStreams((prev) => {
          const newState = { ...prev }
          delete newState[call.peer]
          return newState
        })
      })

      call.on('error', () => {
        setVoiceError(t('errors.callError'))
      })

      mediaConnections.current[call.peer] = call
    }

    peer.on('call', handleCall)
    return () => {
      peer.off('call', handleCall)
    }
  }, [peer, myStream, hasJoinedVoice, t])

  useEffect(() => {
    const config =
      iceServers.length > 0
        ? { config: { iceServers: iceServers.map((url) => ({ urls: url })) } }
        : undefined
    const newPeer = new Peer(myId, config)
    newPeer.on('open', () => {
      setPeer(newPeer)
      setConnectionError(null)
    })

    newPeer.on('error', (err) => {
      setConnectionError(t('errors.peerConnectionError'))
      if (err.type === 'peer-unavailable') {
        setConnectionError(t('errors.lobbyNotFound'))
      } else if (err.type === 'network' || err.type === 'server-error') {
        setConnectionError(t('errors.networkError'))
      } else if (err.type === 'unavailable-id') {
        setConnectionError(t('errors.unavailableId'))
      } else {
        setConnectionError(t('errors.connectionError'))
      }
    })

    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        connections.current[conn.peer] = conn
      })

      conn.on('error', () => {
        setConnectionError(t('errors.failedToConnect'))
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn.on('data', (data: any) => {
        if (data.type === 'SYNC') {
          if (conn.peer === lobbyIdRef.current && isValidGameState(data.state)) {
            setGameState(data.state)
          } else {
            setConnectionError(t('errors.invalidSync'))
          }
        } else if (data.type === 'ACTION' && isHostRef.current) {
          handleActionRef.current(data.action, conn.peer)
        }
      })

      conn.on('close', () => {
        delete connections.current[conn.peer]
        if (isHostRef.current) {
          handleActionRef.current({ type: 'PLAYER_DISCONNECT' }, conn.peer)
        }
      })
    })

    return () => {
      newPeer.destroy()
    }
  }, [myId, setGameState, iceServers, t])

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
          name: sanitizeName(playerName, 'Host'),
          avatar: avatarName || 'merchant',
          balance: 1500,
          position: 0,
          properties: [],
          isBankrupt: false,
          color: COLORS[0],
        },
      ],
    }))
  }, [myId, setIsHost, setGameState, playerName, avatarName])

  const joinLobby = useCallback(
    (id: string) => {
      if (!peer) {
        setConnectionError(t('errors.notConnectedYet'))
        return
      }
      setIsConnecting(true)
      setConnectionError(null)
      const conn = peer.connect(id, { reliable: true })

      const timeout = setTimeout(() => {
        setConnectionError(t('errors.connectionTimedOut'))
        setIsConnecting(false)
        conn.close()
      }, 10000)

      conn.on('open', () => {
        clearTimeout(timeout)
        connections.current[id] = conn
        setLobbyId(id)
        setIsHost(false)
        setIsConnecting(false)
        // Send JOIN action to the host right after connecting
        conn.send({
          type: 'ACTION',
          action: { type: 'JOIN', name: playerName, avatar: avatarName },
        })
      })

      conn.on('error', () => {
        clearTimeout(timeout)
        setIsConnecting(false)
        setConnectionError(t('errors.joinLobbyFailed'))
      })

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      conn.on('data', (data: any) => {
        if (data.type === 'SYNC') {
          if (conn.peer === id && isValidGameState(data.state)) {
            setGameState(data.state)
          } else {
            setConnectionError(t('errors.invalidSync'))
          }
        }
      })

      conn.on('close', () => {
        clearTimeout(timeout)
        setIsConnecting(false)
        setConnectionError(t('errors.connectionClosedByHost'))
        setGameState((prev) => ({ ...prev, status: 'LOBBY' }))
      })
    },
    [peer, setGameState, setIsHost, playerName, avatarName, t],
  )

  // When other players join voice, call them if we have joined voice
  useEffect(() => {
    if (!peer || !myStream) return

    gameState.players.forEach((p) => {
      // Call them if they joined voice, and we haven't already connected, and they are not us
      if (p.id !== myId && p.hasJoinedVoice && !mediaConnections.current[p.id]) {
        const call = peer.call(p.id, myStream)
        if (call) {
          call.on('stream', (remoteStream) => {
            setRemoteStreams((prev) => ({ ...prev, [p.id]: remoteStream }))
          })
          call.on('error', () => {
            setVoiceError(t('errors.callOutError'))
          })
          mediaConnections.current[p.id] = call
        }
      }
    })
  }, [gameState.players, peer, myId, myStream, t])

  const toggleVoiceChat = async () => {
    try {
      if (!myStream) {
        // First time, request permissions
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        setMyStream(stream)
        setVoiceError(null)

        sendAction({ type: 'JOIN_VOICE' })

        // Call everyone in the lobby who has already joined voice
        if (peer) {
          gameState.players.forEach((p) => {
            if (p.id !== myId && p.hasJoinedVoice) {
              const call = peer.call(p.id, stream)
              if (call) {
                call.on('stream', (remoteStream) => {
                  setRemoteStreams((prev) => ({ ...prev, [p.id]: remoteStream }))
                })
                call.on('error', () => {
                  setVoiceError(t('errors.callOutError'))
                })
                mediaConnections.current[p.id] = call
              }
            }
          })
        }
      } else {
        // Toggle mute on existing stream
        const audioTrack = myStream.getAudioTracks()[0]
        if (audioTrack) {
          audioTrack.enabled = !audioTrack.enabled
          sendAction({ type: 'TOGGLE_MUTE', isMuted: !audioTrack.enabled })
        }
      }
    } catch {
      setVoiceError(t('errors.micPermissionDenied'))
    }
  }

  const isMuted = myStream ? !myStream.getAudioTracks()[0]?.enabled : true

  return {
    createLobby,
    joinLobby,
    lobbyId,
    sendAction,
    connectionError,
    setConnectionError,
    isConnecting,
    toggleVoiceChat,
    isMuted,
    remoteStreams,
    voiceError,
    setVoiceError,
    hasJoinedVoice,
  }
}
