export type TileType = 'PROPERTY' | 'AIRPORT' | 'UTILITY' | 'TAX' | 'EVENT' | 'SPECIAL';

export interface Tile {
  id: number;
  name: string;
  type: TileType;
  group?: string; // For properties
  price?: number;
  rent?: number[]; // [base, 1h, 2h, 3h, 4h, hotel]
  housePrice?: number;
  color?: string;
}

export interface Player {
  id: string;
  name: string;
  position: number;
  balance: number;
  properties: number[]; // IDs of tiles
  isBankrupt: boolean;
  color: string;
}

export interface GameState {
  players: Player[];
  currentPlayerIndex: number;
  tiles: Tile[];
  status: 'LOBBY' | 'PLAYING' | 'FINISHED';
  turnPhase: 'ROLL' | 'ACTION' | 'END';
  lastDice: [number, number];
  logs: string[];
}
