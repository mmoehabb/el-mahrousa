import type { Tile } from '../types/game'

export const GAME_CONFIG = {
  CURRENCY: 'EGP',
  STARTING_BALANCE: 1500,
  GO_REWARD: 200,
}

export type EventOutcome =
  | { type: 'gain'; amount: number; title: string; description: string }
  | { type: 'loss'; amount: number; title: string; description: string }
  | { type: 'move'; target: number; title: string; description: string }
  | { type: 'jail'; target: number; title: string; description: string }

export const HAZAK_EVENTS: readonly EventOutcome[] = [
  {
    type: 'gain',
    amount: 150,
    title: 'Lottery Win',
    description: 'You won the local lottery! Collect 150.',
  },
  {
    type: 'gain',
    amount: 50,
    title: 'Found Wallet',
    description: 'You found a lost wallet on the street and kept the cash! Collect 50.',
  },
  {
    type: 'gain',
    amount: 200,
    title: 'Bank Error',
    description: 'Bank error in your favor! Collect 200.',
  },
  {
    type: 'loss',
    amount: 100,
    title: 'Speeding Ticket',
    description: 'You were caught speeding. Pay 100.',
  },
  { type: 'loss', amount: 50, title: 'Doctor Fee', description: 'Pay hospital fees. Pay 50.' },
  {
    type: 'loss',
    amount: 200,
    title: 'Scammed',
    description: 'You fell for a phishing scam! Pay 200.',
  },
  {
    type: 'move',
    target: 0,
    title: 'Advance to Start',
    description: 'Advance to Go! Collect 200.',
  },
  {
    type: 'move',
    target: 10,
    title: 'Prison Visitor',
    description: 'Just visiting the Prison.',
  },
  {
    type: 'jail',
    target: 10,
    title: 'Go to Prison',
    description: 'Go directly to Prison. Do not pass Go, do not collect 200.',
  },
]

export const BOARD_DATA: Tile[] = [
  // Bottom Row
  { id: 0, name: 'GO', type: 'SPECIAL' },
  { id: 1, name: 'Helwan', type: 'PROPERTY', group: 'Brown', price: 60, rent: [2, 10, 30, 90, 160, 250], housePrice: 50, color: '#8B4513' },
  { id: 2, name: 'Sodfa', type: 'EVENT' },
  { id: 3, name: 'El Marg', type: 'PROPERTY', group: 'Brown', price: 60, rent: [4, 20, 60, 180, 320, 450], housePrice: 50, color: '#8B4513' },
  { id: 4, name: 'Income Tax', type: 'TAX', price: 200 },
  { id: 5, name: 'Ramses Station', type: 'AIRPORT', price: 200 },
  { id: 6, name: 'Shoubra', type: 'PROPERTY', group: 'LightBlue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50, color: '#87CEEB' },
  { id: 7, name: 'Hazak', type: 'EVENT' },
  { id: 8, name: 'Ain Shams', type: 'PROPERTY', group: 'LightBlue', price: 100, rent: [6, 30, 90, 270, 400, 550], housePrice: 50, color: '#87CEEB' },
  { id: 9, name: 'El Matareya', type: 'PROPERTY', group: 'LightBlue', price: 120, rent: [8, 40, 100, 300, 450, 600], housePrice: 50, color: '#87CEEB' },

  // Left Column
  { id: 10, name: 'Prison', type: 'SPECIAL' },
  { id: 11, name: 'Dokki', type: 'PROPERTY', group: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100, color: '#FF69B4' },
  { id: 12, name: 'Electricity Company', type: 'UTILITY', price: 150 },
  { id: 13, name: 'Mohandeseen', type: 'PROPERTY', group: 'Pink', price: 140, rent: [10, 50, 150, 450, 625, 750], housePrice: 100, color: '#FF69B4' },
  { id: 14, name: 'Agouza', type: 'PROPERTY', group: 'Pink', price: 160, rent: [12, 60, 180, 500, 700, 900], housePrice: 100, color: '#FF69B4' },
  { id: 15, name: 'Cairo Station', type: 'AIRPORT', price: 200 },
  { id: 16, name: 'Heliopolis', type: 'PROPERTY', group: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100, color: '#FFA500' },
  { id: 17, name: 'Sodfa', type: 'EVENT' },
  { id: 18, name: 'Nasr City', type: 'PROPERTY', group: 'Orange', price: 180, rent: [14, 70, 200, 550, 750, 950], housePrice: 100, color: '#FFA500' },
  { id: 19, name: 'Maadi', type: 'PROPERTY', group: 'Orange', price: 200, rent: [16, 80, 220, 600, 800, 1000], housePrice: 100, color: '#FFA500' },

  // Top Row
  { id: 20, name: 'Vacation', type: 'SPECIAL' },
  { id: 21, name: 'Zamalek', type: 'PROPERTY', group: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150, color: '#FF0000' },
  { id: 22, name: 'Hazak', type: 'EVENT' },
  { id: 23, name: 'Garden City', type: 'PROPERTY', group: 'Red', price: 220, rent: [18, 90, 250, 700, 875, 1050], housePrice: 150, color: '#FF0000' },
  { id: 24, name: 'Downtown', type: 'PROPERTY', group: 'Red', price: 240, rent: [20, 100, 300, 750, 925, 1100], housePrice: 150, color: '#FF0000' },
  { id: 25, name: 'Giza Station', type: 'AIRPORT', price: 200 },
  { id: 26, name: 'Manial', type: 'PROPERTY', group: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150, color: '#FFD700' },
  { id: 27, name: 'Sayeda Zeinab', type: 'PROPERTY', group: 'Yellow', price: 260, rent: [22, 110, 330, 800, 975, 1150], housePrice: 150, color: '#FFD700' },
  { id: 28, name: 'Water Company', type: 'UTILITY', price: 150 },
  { id: 29, name: 'El Hussein', type: 'PROPERTY', group: 'Yellow', price: 280, rent: [24, 120, 360, 850, 1025, 1200], housePrice: 150, color: '#FFD700' },

  // Right Column
  { id: 30, name: 'Go To Prison', type: 'SPECIAL' },
  { id: 31, name: 'New Cairo', type: 'PROPERTY', group: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, color: '#008000' },
  { id: 32, name: 'Rehab City', type: 'PROPERTY', group: 'Green', price: 300, rent: [26, 130, 390, 900, 1100, 1275], housePrice: 200, color: '#008000' },
  { id: 33, name: 'Sodfa', type: 'EVENT' },
  { id: 34, name: 'Madinaty', type: 'PROPERTY', group: 'Green', price: 320, rent: [28, 150, 450, 1000, 1200, 1400], housePrice: 200, color: '#008000' },
  { id: 35, name: 'Monorail Station', type: 'AIRPORT', price: 200 },
  { id: 36, name: 'Hazak', type: 'EVENT' },
  { id: 37, name: 'Sheikh Zayed', type: 'PROPERTY', group: 'DarkBlue', price: 350, rent: [35, 175, 500, 1100, 1300, 1500], housePrice: 200, color: '#00008B' },
  { id: 38, name: 'Super Tax', type: 'TAX', price: 100 },
  { id: 39, name: 'New Capital', type: 'PROPERTY', group: 'DarkBlue', price: 400, rent: [50, 200, 600, 1400, 1700, 2000], housePrice: 200, color: '#00008B' },
]
