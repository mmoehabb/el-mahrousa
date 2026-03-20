"use strict";
var __assign = (this && this.__assign) || function () {
    __assign = Object.assign || function(t) {
        for (var s, i = 1, n = arguments.length; i < n; i++) {
            s = arguments[i];
            for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p))
                t[p] = s[p];
        }
        return t;
    };
    return __assign.apply(this, arguments);
};
var __spreadArray = (this && this.__spreadArray) || function (to, from, pack) {
    if (pack || arguments.length === 2) for (var i = 0, l = from.length, ar; i < l; i++) {
        if (ar || !(i in from)) {
            if (!ar) ar = Array.prototype.slice.call(from, 0, i);
            ar[i] = from[i];
        }
    }
    return to.concat(ar || Array.prototype.slice.call(from));
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.executeTrade = exports.handleBankrupt = exports.endTurn = exports.buyProperty = exports.sellProperty = exports.sellHouse = exports.buyHouse = exports.applyLandingLogic = exports.applyEventLogic = exports.moveOneStep = exports.rollDice = exports.createInitialState = void 0;
var gameConfig_ts_1 = require("../config/gameConfig.ts");
var gameConfig_ts_2 = require("../config/gameConfig.ts");
var createInitialState = function () { return ({
    players: [],
    currentPlayerIndex: 0,
    tiles: gameConfig_ts_2.BOARD_DATA,
    status: 'LOBBY',
    turnPhase: 'ROLL',
    lastDice: [1, 1],
    logs: ['started'],
    countdown: null,
    chatMessages: [],
    prison: {},
    activeEvent: null,
}); };
exports.createInitialState = createInitialState;
// Generates a float between 0 (inclusive) and 1 (exclusive) using crypto
var secureRandom = function () {
    var array = new Uint32Array(1);
    crypto.getRandomValues(array);
    return array[0] / (0xffffffff + 1);
};
var rollDice = function () {
    return [Math.floor(secureRandom() * 6) + 1, Math.floor(secureRandom() * 6) + 1];
};
exports.rollDice = rollDice;
var moveOneStep = function (state) {
    var player = state.players[state.currentPlayerIndex];
    var newPosition = (player.position + 1) % state.tiles.length;
    var newState = __assign({}, state);
    var newPlayers = __spreadArray([], state.players, true);
    // Passed GO
    if (newPosition < player.position) {
        newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: newPosition, balance: player.balance + gameConfig_ts_1.GAME_CONFIG.GO_REWARD });
        newState.logs = __spreadArray([
            { key: 'passedStart', params: { name: player.name, amount: gameConfig_ts_1.GAME_CONFIG.GO_REWARD } }
        ], newState.logs, true);
    }
    else {
        newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: newPosition });
    }
    newState.players = newPlayers;
    return newState;
};
exports.moveOneStep = moveOneStep;
var applyEventLogic = function (state) {
    var _a;
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[player.position];
    var newState = __assign({}, state);
    if (tile.name === 'Hazak') {
        // Hazak Random Outcomes
        var events = [
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
                target: 12,
                title: 'Vacation',
                description: 'Take a trip to the Vacation tile.',
            },
            {
                type: 'jail',
                target: 6,
                title: 'Go to Prison',
                description: 'Go directly to Prison. Do not pass Go, do not collect 200.',
            },
        ];
        var event_1 = events[Math.floor(secureRandom() * events.length)];
        var newPlayers = __spreadArray([], state.players, true);
        if (event_1.type === 'gain') {
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance + event_1.amount });
        }
        else if (event_1.type === 'loss') {
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance - event_1.amount });
        }
        else if (event_1.type === 'move') {
            // If moving passes start (and not just going backward to start), collect Go Reward
            if (event_1.target < player.position && event_1.target !== 0) {
                newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: event_1.target, balance: player.balance + gameConfig_ts_1.GAME_CONFIG.GO_REWARD });
            }
            else if (event_1.target === 0) {
                newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: event_1.target, balance: player.balance + gameConfig_ts_1.GAME_CONFIG.GO_REWARD });
            }
            else {
                newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: event_1.target });
            }
        }
        else if (event_1.type === 'jail') {
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: event_1.target });
            newState.prison = __assign(__assign({}, newState.prison), (_a = {}, _a[player.id] = { turnsLeft: 2 }, _a));
        }
        newState.players = newPlayers;
        newState.activeEvent = {
            title: event_1.title,
            description: event_1.description,
            type: event_1.type,
            playerName: player.name,
        };
        // Check if debt forces turn to stay ACTION
        if (newPlayers[state.currentPlayerIndex].balance >= 0) {
            newState.turnPhase = 'END';
        }
        else {
            newState.turnPhase = 'ACTION'; // Must sell properties or bankrupt
        }
    }
    else if (tile.name === 'Sodfa') {
        // Sodfa Random Teleportation
        // Get all PROPERTY, AIRPORT, UTILITY tiles
        var properties = state.tiles.filter(function (t) {
            return ['PROPERTY', 'AIRPORT', 'UTILITY'].includes(t.type);
        });
        var randomTile = properties[Math.floor(secureRandom() * properties.length)];
        var newPlayers = __spreadArray([], state.players, true);
        if (randomTile.id < player.position) {
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: randomTile.id, balance: player.balance + gameConfig_ts_1.GAME_CONFIG.GO_REWARD });
        }
        else {
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: randomTile.id });
        }
        newState.players = newPlayers;
        newState.activeEvent = {
            title: 'Sodfa Teleport',
            description: "Sodfa! You have been teleported to ".concat(randomTile.name, "!"),
            type: 'move',
            playerName: player.name,
        };
        // Since they moved, we should apply landing logic for their new tile immediately,
        // but without clearing the event popup.
        // However, they can only land on PROPERTY, AIRPORT, UTILITY, so we can run a subset of logic or recurse safely.
        // For safety, let's just let them end their turn or pay rent here.
        var tempState = (0, exports.applyLandingLogic)(__assign(__assign({}, newState), { turnPhase: 'ACTION' }));
        tempState.activeEvent = newState.activeEvent; // keep event
        return tempState;
    }
    return newState;
};
exports.applyEventLogic = applyEventLogic;
var applyLandingLogic = function (state) {
    var _a;
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[player.position];
    var newState = __assign({}, state);
    if (tile.type === 'EVENT') {
        return (0, exports.applyEventLogic)(newState);
    }
    if (tile.type === 'TAX') {
        var taxAmount = tile.price || 0;
        var newPlayers = __spreadArray([], state.players, true);
        newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance - taxAmount });
        newState.players = newPlayers;
        newState.logs = __spreadArray([
            "".concat(player.name, " paid ").concat(taxAmount, " ").concat(gameConfig_ts_1.GAME_CONFIG.CURRENCY, " in tax")
        ], newState.logs, true);
        if (newPlayers[state.currentPlayerIndex].balance >= 0) {
            newState.turnPhase = 'END';
        }
    }
    else if (tile.type === 'PROPERTY' || tile.type === 'AIRPORT' || tile.type === 'UTILITY') {
        var owner_1 = state.players.find(function (p) { return p.properties.includes(tile.id); });
        if (owner_1 && owner_1.id !== player.id && !owner_1.isBankrupt) {
            var rent = calculateRent(tile, owner_1, state.tiles);
            var newPlayers = __spreadArray([], state.players, true);
            newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance - rent });
            var ownerIndex = newPlayers.findIndex(function (p) { return p.id === owner_1.id; });
            newPlayers[ownerIndex] = __assign(__assign({}, newPlayers[ownerIndex]), { balance: newPlayers[ownerIndex].balance + rent });
            newState.players = newPlayers;
            newState.logs = __spreadArray([
                { key: 'paidRent', params: { name: player.name, amount: rent, owner: owner_1.name } }
            ], newState.logs, true);
            if (newPlayers[state.currentPlayerIndex].balance >= 0) {
                newState.turnPhase = 'END';
            }
        }
    }
    else if (tile.name === 'Go To Prison') {
        var newPlayers = __spreadArray([], state.players, true);
        newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { position: 6 });
        newState.players = newPlayers;
        newState.prison = __assign(__assign({}, newState.prison), (_a = {}, _a[player.id] = { turnsLeft: 2 }, _a));
        newState.logs = __spreadArray(["".concat(player.name, " was sent to Prison!")], newState.logs, true);
        newState.turnPhase = 'END';
    }
    return newState;
};
exports.applyLandingLogic = applyLandingLogic;
var calculateRent = function (tile, owner, allTiles) {
    if (tile.type === 'PROPERTY') {
        if (!tile.rent)
            return 0;
        var houses = tile.houses || 0;
        return tile.rent[houses] || tile.rent[0];
    }
    if (tile.type === 'AIRPORT') {
        var airportCount = allTiles.filter(function (t) { return t.type === 'AIRPORT' && owner.properties.includes(t.id); }).length;
        return 25 * Math.pow(2, airportCount - 1);
    }
    return 25;
};
var buyHouse = function (state, tileId) {
    if (state.turnPhase !== 'ROLL')
        return state;
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[tileId];
    if (!player.properties.includes(tileId) || !tile.housePrice || !tile.rent)
        return state;
    var currentHouses = tile.houses || 0;
    if (currentHouses >= tile.rent.length - 1)
        return state; // Max houses reached
    var cost = tile.housePrice * Math.pow(2, currentHouses);
    if (player.balance < cost)
        return state;
    var newPlayers = __spreadArray([], state.players, true);
    newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance - cost });
    var newTiles = __spreadArray([], state.tiles, true);
    newTiles[tileId] = __assign(__assign({}, tile), { houses: currentHouses + 1 });
    return __assign(__assign({}, state), { players: newPlayers, tiles: newTiles, logs: __spreadArray([
            { key: 'boughtHouse', params: { name: player.name, property: tile.name, price: cost } }
        ], state.logs, true) });
};
exports.buyHouse = buyHouse;
var sellHouse = function (state, tileId) {
    if (state.turnPhase !== 'ROLL')
        return state;
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[tileId];
    if (!player.properties.includes(tileId) || !tile.housePrice)
        return state;
    var currentHouses = tile.houses || 0;
    if (currentHouses === 0)
        return state;
    // Refund is half of what they paid for the current house level
    var refund = (tile.housePrice * Math.pow(2, currentHouses - 1)) / 2;
    var newPlayers = __spreadArray([], state.players, true);
    newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance + refund });
    var newTiles = __spreadArray([], state.tiles, true);
    newTiles[tileId] = __assign(__assign({}, tile), { houses: currentHouses - 1 });
    return __assign(__assign({}, state), { players: newPlayers, tiles: newTiles, logs: __spreadArray([
            { key: 'soldHouse', params: { name: player.name, property: tile.name, price: refund } }
        ], state.logs, true) });
};
exports.sellHouse = sellHouse;
var sellProperty = function (state, tileId) {
    if (state.turnPhase !== 'ROLL')
        return state;
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[tileId];
    if (!player.properties.includes(tileId) || !tile.price)
        return state;
    var currentHouses = tile.houses || 0;
    if (currentHouses > 0)
        return state; // Must sell houses first
    var refund = tile.price / 2;
    var newPlayers = __spreadArray([], state.players, true);
    newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance + refund, properties: player.properties.filter(function (id) { return id !== tileId; }) });
    return __assign(__assign({}, state), { players: newPlayers, logs: __spreadArray([
            { key: 'soldProperty', params: { name: player.name, property: tile.name, price: refund } }
        ], state.logs, true) });
};
exports.sellProperty = sellProperty;
var buyProperty = function (state, tileId) {
    var player = state.players[state.currentPlayerIndex];
    var tile = state.tiles[tileId];
    var isOwned = state.players.some(function (p) { return p.properties.includes(tileId); });
    if (isOwned || !tile.price || player.balance < tile.price)
        return state;
    var newPlayers = __spreadArray([], state.players, true);
    newPlayers[state.currentPlayerIndex] = __assign(__assign({}, player), { balance: player.balance - tile.price, properties: __spreadArray(__spreadArray([], player.properties, true), [tileId], false) });
    return __assign(__assign({}, state), { players: newPlayers, logs: __spreadArray([
            { key: 'bought', params: { name: player.name, property: tile.name, price: tile.price } }
        ], state.logs, true), turnPhase: 'END' });
};
exports.buyProperty = buyProperty;
var endTurn = function (state) {
    var nextIndex = (state.currentPlayerIndex + 1) % state.players.length;
    var attempts = 0;
    var newState = __assign(__assign({}, state), { prison: __assign({}, state.prison) });
    while (attempts < state.players.length) {
        var nextPlayer = state.players[nextIndex];
        if (nextPlayer.isBankrupt) {
            nextIndex = (nextIndex + 1) % state.players.length;
            attempts++;
            continue;
        }
        var prisonRecord = newState.prison[nextPlayer.id];
        if (prisonRecord) {
            if (prisonRecord.turnsLeft > 0) {
                newState.prison[nextPlayer.id] = { turnsLeft: prisonRecord.turnsLeft - 1 };
                newState.logs = __spreadArray([
                    "".concat(nextPlayer.name, " is in Prison for ").concat(prisonRecord.turnsLeft - 1, " more turn(s).")
                ], newState.logs, true);
                nextIndex = (nextIndex + 1) % state.players.length;
                attempts++;
                continue;
            }
            else {
                var newPrison = __assign({}, newState.prison);
                delete newPrison[nextPlayer.id];
                newState.prison = newPrison;
                newState.logs = __spreadArray(["".concat(nextPlayer.name, " has been released from Prison!")], newState.logs, true);
            }
        }
        break;
    }
    var nextPlayerId = newState.players[nextIndex].id;
    var isStillInPrison = newState.prison[nextPlayerId] && newState.prison[nextPlayerId].turnsLeft > 0;
    return __assign(__assign({}, newState), { currentPlayerIndex: nextIndex, turnPhase: isStillInPrison ? 'END' : 'ROLL' });
};
exports.endTurn = endTurn;
var handleBankrupt = function (state, playerId) {
    var newPlayers = state.players.map(function (p) {
        if (p.id === playerId) {
            return __assign(__assign({}, p), { isBankrupt: true, balance: 0, properties: [] });
        }
        return p;
    });
    return __assign(__assign({}, state), { players: newPlayers });
};
exports.handleBankrupt = handleBankrupt;
var executeTrade = function (state, p1Id, p2Id, offer) {
    var p1 = state.players.find(function (p) { return p.id === p1Id; });
    var p2 = state.players.find(function (p) { return p.id === p2Id; });
    if (!p1 || !p2) {
        return __assign(__assign({}, state), { logs: __spreadArray(["Trade failed: One or both players not found."], state.logs, true) });
    }
    // Validate cash
    if (p1.balance < offer.myCash || p2.balance < offer.partnerCash) {
        return __assign(__assign({}, state), { logs: __spreadArray(["Trade failed: Insufficient funds."], state.logs, true) });
    }
    // Validate properties
    var p1OwnsAll = offer.myProperties.every(function (id) { return p1.properties.includes(id); });
    var p2OwnsAll = offer.partnerProperties.every(function (id) { return p2.properties.includes(id); });
    if (!p1OwnsAll || !p2OwnsAll) {
        return __assign(__assign({}, state), { logs: __spreadArray(["Trade failed: Properties not owned."], state.logs, true) });
    }
    var newPlayers = state.players.map(function (p) {
        if (p.id === p1Id) {
            return __assign(__assign({}, p), { balance: p.balance - offer.myCash + offer.partnerCash, properties: p.properties
                    .filter(function (id) { return !offer.myProperties.includes(id); })
                    .concat(offer.partnerProperties) });
        }
        if (p.id === p2Id) {
            return __assign(__assign({}, p), { balance: p.balance - offer.partnerCash + offer.myCash, properties: p.properties
                    .filter(function (id) { return !offer.partnerProperties.includes(id); })
                    .concat(offer.myProperties) });
        }
        return p;
    });
    return __assign(__assign({}, state), { players: newPlayers, logs: __spreadArray(["Trade executed between ".concat(p1.name, " and ").concat(p2.name)], state.logs, true) });
};
exports.executeTrade = executeTrade;
