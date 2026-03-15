import { useEffect, useRef, useState, useCallback } from 'react';
import Peer, { type DataConnection } from 'peerjs';
import { useGame } from '../context/GameContext';
import type { GameState, Player } from '../types/game';
import { rollDice, movePlayer, buyProperty, endTurn, executeTrade } from '../logic/gameLogic';

const COLORS = ['#1034A6', '#E0115F', '#D4AF37', '#008080'];

export const useNetworking = () => {
  const { gameState, setGameState, isHost, setIsHost, myId, playerName } = useGame();
  const [peer, setPeer] = useState<Peer | null>(null);
  const connections = useRef<{ [id: string]: DataConnection }>({});
  const [lobbyId, setLobbyId] = useState<string>('');

  const broadcastState = useCallback((state: GameState) => {
    Object.values(connections.current).forEach(conn => {
      if (conn.open) {
        conn.send({ type: 'SYNC', state });
      }
    });
  }, []);

  const handleAction = useCallback((action: any, from: string) => {
    if (!isHost) return;

    setGameState(prev => {
      let nextState = { ...prev };
      const currentPlayer = nextState.players[nextState.currentPlayerIndex];

      switch (action.type) {
        case 'ROLL':
          if (currentPlayer.id !== from) return prev;
          const [d1, d2] = rollDice();
          nextState = { ...nextState, lastDice: [d1, d2] };
          nextState.logs = [`${currentPlayer.name} rolled ${d1 + d2}`, ...nextState.logs];
          nextState = movePlayer(nextState, d1 + d2);
          break;
        case 'BUY':
          if (currentPlayer.id !== from) return prev;
          nextState = buyProperty(nextState, currentPlayer.position);
          break;
        case 'END_TURN':
          if (currentPlayer.id !== from) return prev;
          nextState = endTurn(nextState);
          break;
        case 'CHAT':
          {
            const sender = nextState.players.find(p => p.id === from)?.name || 'Unknown';
            nextState.logs = [`[CHAT] ${sender}: ${action.message}`, ...nextState.logs];
          }
          break;
        case 'PROPOSE_TRADE':
          nextState = executeTrade(nextState, from, action.partnerId, action.offer);
          break;
        case 'JOIN':
          if (!prev.players.find(p => p.id === from)) {
            const newPlayer: Player = {
              id: from,
              name: action.name || `Player ${prev.players.length + 1}`,
              balance: 1500,
              position: 0,
              properties: [],
              isBankrupt: false,
              color: COLORS[prev.players.length % COLORS.length]
            };
            nextState = { ...nextState, players: [...prev.players, newPlayer] };
            nextState.logs = [`${newPlayer.name} joined the game.`, ...nextState.logs];
          }
          break;
      }
      return nextState;
    });
  }, [isHost, setGameState]);

  const sendAction = useCallback((action: any) => {
    if (isHost) {
      handleAction(action, myId);
    } else {
      const hostConn = connections.current[lobbyId];
      if (hostConn && hostConn.open) {
        hostConn.send({ type: 'ACTION', action });
      }
    }
  }, [isHost, myId, handleAction, lobbyId]);

  const peerRef = useRef<Peer | null>(null);

  useEffect(() => {
    // If we already have a peer and it's open, don't recreate it
    // This helps mitigate StrictMode double-mounting destroying the connection
    if (peerRef.current && !peerRef.current.destroyed) {
      return;
    }

    // Connect to our local signaling server instead of the public PeerJS cloud.
    // In production, host should be updated to point to the deployed server.
    const isProd = import.meta.env.MODE === 'production';
    const newPeer = new Peer(myId, {
      host: isProd ? window.location.hostname : 'localhost',
      port: isProd ? Number(window.location.port || (window.location.protocol === 'https:' ? 443 : 80)) : 9000,
      path: '/myapp',
      secure: window.location.protocol === 'https:'
    });

    peerRef.current = newPeer;

    newPeer.on('open', () => {
      setPeer(newPeer);
    });

    newPeer.on('disconnected', () => {
      console.warn('PeerJS disconnected, attempting to reconnect...');
      if (peerRef.current && !peerRef.current.destroyed && peerRef.current.disconnected) {
        peerRef.current.reconnect();
      }
    });

    newPeer.on('error', (err) => {
      console.error('PeerJS error:', err);
      if (err.type === 'network' || err.type === 'server-error') {
        setTimeout(() => {
          if (peerRef.current && !peerRef.current.destroyed && peerRef.current.disconnected) {
            peerRef.current.reconnect();
          }
        }, 3000);
      }
    });

    newPeer.on('connection', (conn) => {
      conn.on('open', () => {
        connections.current[conn.peer] = conn;
        // The host might want to explicitly send a SYNC state when a connection opens
        // just to ensure the newly connected peer gets the very first state before they even JOIN.
      });

      conn.on('data', (data: any) => {
        if (data.type === 'SYNC') {
          // A host should not receive a SYNC. If it does, ignore or handle edge cases.
          // But just in case, we leave it.
          setGameState(data.state);
        } else if (data.type === 'ACTION') {
          // Both host and (technically) guests could receive ACTION, but usually guests send ACTION.
          // The issue was `&& isHost`. In React `useEffect` closures, `isHost` might be stale
          // if it wasn't carefully tracked.
          handleAction(data.action, conn.peer);
        }
      });

      conn.on('close', () => {
        delete connections.current[conn.peer];
      });

      conn.on('error', (err) => {
        console.error('Connection error:', err);
      });
    });

    return () => {
      // In StrictMode development, we avoid immediately destroying the peer
      // to prevent the "interrupted while loading" WebSocket error.
      // We will only destroy it if myId changes.
      if (import.meta.env.MODE !== 'development') {
        newPeer.destroy();
        peerRef.current = null;
      }
    };
  }, [isHost, myId, setGameState, handleAction]);

  useEffect(() => {
    if (isHost) {
      broadcastState(gameState);
    }
  }, [gameState, isHost, broadcastState]);

  const createLobby = useCallback(() => {
    setIsHost(true);
    setLobbyId(myId);
    setGameState(prev => ({
      ...prev,
      status: 'LOBBY', // Host starts in LOBBY state first, waits for players, then manually starts
      players: [{ id: myId, name: playerName || 'Host', balance: 1500, position: 0, properties: [], isBankrupt: false, color: COLORS[0] }]
    }));
  }, [myId, setIsHost, setGameState, playerName]);

  const joinLobby = useCallback((id: string) => {
    if (!peer) return;
    const conn = peer.connect(id, { reliable: true });

    conn.on('open', () => {
      connections.current[id] = conn;
      setLobbyId(id);
      setIsHost(false);

      // Send JOIN action to the host right after connecting
      // We must pass the correct action type and data
      conn.send({ type: 'ACTION', action: { type: 'JOIN', name: playerName } });
    });

    conn.on('data', (data: any) => {
      if (data.type === 'SYNC') {
        // Ensure state is fully overwritten to match the host
        setGameState(data.state);
      }
    });

    conn.on('close', () => {
      console.warn('Disconnected from host.');
      delete connections.current[id];
      // When the host disconnects, the guest should ideally return to the lobby/menu
      setGameState(prev => ({ ...prev, status: 'LOBBY' }));
    });

    conn.on('error', (err) => {
      console.error('Connection error with host:', err);
    });
  }, [peer, setGameState, setIsHost, playerName]);

  return { createLobby, joinLobby, lobbyId, sendAction };
};
