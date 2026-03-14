import React, { createContext, useContext, useState } from 'react';
import type { GameState } from '../types/game';
import { createInitialState } from '../logic/gameLogic';

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
  isHost: boolean;
  setIsHost: (isHost: boolean) => void;
  myId: string;
  playerName: string;
  setPlayerName: (name: string) => void;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(createInitialState());
  const [isHost, setIsHost] = useState(false);
  const [myId] = useState(Math.random().toString(36).substring(7));
  const [playerName, setPlayerName] = useState(() => sessionStorage.getItem('playerName') || '');

  const handleSetPlayerName = (name: string) => {
    setPlayerName(name);
    sessionStorage.setItem('playerName', name);
  };

  return (
    <GameContext.Provider value={{ gameState, setGameState, isHost, setIsHost, myId, playerName, setPlayerName: handleSetPlayerName }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error('useGame must be used within a GameProvider');
  return context;
};
