# Game Design Document: Egyptian Monopoly (Misr-opoly)

## 1. Concept

A localized, streamlined version of the classic Monopoly game tailored for the Egyptian market. It features Egyptian cities, currency (EGP), and a 24-tile board for faster, more engaging gameplay. The game is P2P (Peer-to-Peer) using WebRTC (PeerJS).

## 2. Core Loop

- **Roll**: Players roll two dice to move around the board.
- **Act**: Buy unowned property, pay rent to owners, or trigger special events (Sodfa/Hazak).
- **Build**: Develop properties with houses/hotels to increase rent.
- **Trade**: Negotiate with other players for properties and cash to complete color sets.
- **Win**: Be the last player standing (Bankrupt mode) or have the highest net worth (Timed mode).

## 3. The Board (24 Tiles)

The board is a square with 6 tiles per side (including corners).

| Index | Name                        | Type      | Group / Detail       |
| ----- | --------------------------- | --------- | -------------------- |
| 0     | GO (Start)                  | Special   | Collect 200 EGP      |
| 1     | Cairo (Zamalek)             | Property  | Group 1 (Brown)      |
| 2     | Sodfa (Chance)              | Event     | Random Effect        |
| 3     | Cairo (Garden City)         | Property  | Group 1 (Brown)      |
| 4     | Income Tax                  | Tax       | Pay 100 EGP          |
| 5     | Cairo International Airport | Transport | Airport              |
| 6     | Prison (Visiting)           | Special   | Just Visiting        |
| 7     | Alexandria (Stanley)        | Property  | Group 2 (Light Blue) |
| 8     | Alexandria (Agami)          | Property  | Group 2 (Light Blue) |
| 9     | Hazak (Luck)                | Event     | Random Effect        |
| 10    | Alexandria (Gleem)          | Property  | Group 2 (Light Blue) |
| 11    | Suez Canal Company          | Utility   | Utility              |
| 12    | Vacation (Free Parking)     | Special   | No Effect            |
| 13    | Luxor (Karnak)              | Property  | Group 3 (Red)        |
| 14    | Sodfa (Chance)              | Event     | Random Effect        |
| 15    | Luxor (Valley of Kings)     | Property  | Group 3 (Red)        |
| 16    | Aswan (Philae)              | Property  | Group 3 (Red)        |
| 17    | EgyptAir                    | Transport | Airport              |
| 18    | Go To Prison                | Special   | Move to Tile 6       |
| 19    | Hurghada (El Gouna)         | Property  | Group 4 (Gold)       |
| 20    | Hazak (Luck)                | Event     | Random Effect        |
| 21    | Hurghada (Sahl Hasheesh)    | Property  | Group 4 (Gold)       |
| 22    | Super Tax                   | Tax       | Pay 150 EGP          |
| 23    | Telecom Egypt               | Utility   | Utility              |

## 4. Mechanics

- **Trading**: Players can initiate trades at any time before rolling. Trades can include any number of properties and cash.
- **Houses/Hotels**: Can only be built when a player owns all properties of a color group.
- **Bankruptcy**: Occurs when a player owes more than their total assets. Assets are auctioned or transferred to the creditor.

## 5. Technical Architecture (P2P)

- **Host**: The player who creates the lobby. Acts as the authoritative state manager.
- **Peers**: Send "Intent" messages (e.g., `ROLL_DICE`, `BUY_PROPERTY`).
- **Sync**: Host broadcasts the updated state to all peers after every action.
- **Reconnection**: If the host leaves, the next player in the list becomes the host (Future Plan).

## 6. Customization & Future Proofing

- **Currency**: Defined in `config/gameConfig.ts`. Easily changeable from "EGP" to any string.
- **Map**: The board is generated from a JSON definition. Adding new cities or changing map size only requires updating the JSON.
- **UI**: Uses Tailwind CSS. Themes can be swapped by changing the color palette in `tailwind.config.js`.
