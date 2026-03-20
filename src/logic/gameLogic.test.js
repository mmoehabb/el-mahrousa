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
Object.defineProperty(exports, "__esModule", { value: true });
var node_test_1 = require("node:test");
var node_assert_1 = require("node:assert");
var gameLogic_ts_1 = require("./gameLogic.ts");
var gameConfig_ts_1 = require("../config/gameConfig.ts");
var createMockPlayer = function (id, isBankrupt) {
    if (isBankrupt === void 0) { isBankrupt = false; }
    return ({
        id: id,
        name: "Player ".concat(id),
        position: 0,
        balance: 1500,
        properties: [],
        isBankrupt: isBankrupt,
        color: '#000000',
    });
};
var createMockState = function (players, currentPlayerIndex) { return ({
    players: players,
    currentPlayerIndex: currentPlayerIndex,
    tiles: [],
    status: 'PLAYING',
    turnPhase: 'END',
    lastDice: [1, 1],
    logs: [],
    chatMessages: [],
    prison: {},
    activeEvent: null,
}); };
(0, node_test_1.describe)('rollDice', function () {
    (0, node_test_1.test)('should return an array of two numbers', function () {
        var dice = (0, gameLogic_ts_1.rollDice)();
        node_assert_1.default.strictEqual(Array.isArray(dice), true);
        node_assert_1.default.strictEqual(dice.length, 2);
        node_assert_1.default.strictEqual(typeof dice[0], 'number');
        node_assert_1.default.strictEqual(typeof dice[1], 'number');
    });
    (0, node_test_1.test)('should return numbers between 1 and 6 inclusive', function () {
        for (var i = 0; i < 100; i++) {
            var _a = (0, gameLogic_ts_1.rollDice)(), d1 = _a[0], d2 = _a[1];
            node_assert_1.default.ok(d1 >= 1 && d1 <= 6, "Dice 1 value ".concat(d1, " is out of range"));
            node_assert_1.default.ok(d2 >= 1 && d2 <= 6, "Dice 2 value ".concat(d2, " is out of range"));
            node_assert_1.default.ok(Number.isInteger(d1), "Dice 1 value ".concat(d1, " is not an integer"));
            node_assert_1.default.ok(Number.isInteger(d2), "Dice 2 value ".concat(d2, " is not an integer"));
        }
    });
    (0, node_test_1.test)('should be deterministic with mocked crypto.getRandomValues', function () {
        var originalGetRandomValues = crypto.getRandomValues;
        var cryptoMock = node_test_1.mock.method(crypto, 'getRandomValues');
        try {
            // Mock crypto.getRandomValues to return 0 (should result in 1)
            cryptoMock.mock.mockImplementation(function (array) {
                if (array && '0' in array) {
                    ;
                    array[0] = 0;
                }
                return array;
            });
            node_assert_1.default.deepStrictEqual((0, gameLogic_ts_1.rollDice)(), [1, 1]);
            // Mock crypto.getRandomValues to return near max Uint32 (should result in 6)
            cryptoMock.mock.mockImplementation(function (array) {
                if (array && '0' in array) {
                    ;
                    array[0] = 0xffffffff;
                }
                return array;
            });
            node_assert_1.default.deepStrictEqual((0, gameLogic_ts_1.rollDice)(), [6, 6]);
            // Mock crypto.getRandomValues to return specific sequence
            var count_1 = 0;
            cryptoMock.mock.mockImplementation(function (array) {
                count_1++;
                if (array && '0' in array) {
                    // 0.1 * (0xffffffff + 1) -> 1
                    // 0.8 * (0xffffffff + 1) -> 5
                    ;
                    array[0] =
                        count_1 === 1 ? Math.floor(0.1 * (0xffffffff + 1)) : Math.floor(0.8 * (0xffffffff + 1));
                }
                return array;
            });
            node_assert_1.default.deepStrictEqual((0, gameLogic_ts_1.rollDice)(), [1, 5]);
        }
        finally {
            cryptoMock.mock.restore();
            crypto.getRandomValues = originalGetRandomValues;
        }
    });
});
(0, node_test_1.describe)('executeTrade', function () {
    var createMockPlayer = function (id, balance, properties) { return ({
        id: id,
        name: "Player ".concat(id),
        position: 0,
        balance: balance,
        properties: properties,
        isBankrupt: false,
        color: '#000000',
    }); };
    var createMockGameState = function (players) { return ({
        players: players,
        currentPlayerIndex: 0,
        tiles: [],
        status: 'PLAYING',
        turnPhase: 'ACTION',
        lastDice: [1, 1],
        logs: ['Initial state'],
        chatMessages: [],
        prison: {},
        activeEvent: null,
    }); };
    (0, node_test_1.test)('should correctly exchange cash and properties between two players', function () {
        var p1 = createMockPlayer('p1', 1000, [1, 2]);
        var p2 = createMockPlayer('p2', 500, [3, 4]);
        var state = createMockGameState([p1, p2]);
        var offer = {
            myCash: 200, // p1 gives 200
            partnerCash: 0, // p2 gives 0
            myProperties: [1], // p1 gives property 1
            partnerProperties: [3, 4], // p2 gives properties 3 and 4
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var newP1 = newState.players.find(function (p) { return p.id === 'p1'; });
        var newP2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.ok(newP1);
        node_assert_1.default.ok(newP2);
        // P1 balance: 1000 - 200 + 0 = 800
        node_assert_1.default.strictEqual(newP1.balance, 800);
        // P1 properties: lost 1, gained 3 and 4 -> [2, 3, 4]
        node_assert_1.default.deepStrictEqual(newP1.properties, [2, 3, 4]);
        // P2 balance: 500 - 0 + 200 = 700
        node_assert_1.default.strictEqual(newP2.balance, 700);
        // P2 properties: lost 3 and 4, gained 1 -> [1]
        node_assert_1.default.deepStrictEqual(newP2.properties, [1]);
        // Logs should be updated
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade executed between Player p1 and Player p2');
        node_assert_1.default.strictEqual(newState.logs[1], 'Initial state');
    });
    (0, node_test_1.test)('should handle cash-only trades', function () {
        var p1 = createMockPlayer('p1', 1000, [1, 2]);
        var p2 = createMockPlayer('p2', 500, [3, 4]);
        var state = createMockGameState([p1, p2]);
        var offer = {
            myCash: 100,
            partnerCash: 300,
            myProperties: [],
            partnerProperties: [],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var newP1 = newState.players.find(function (p) { return p.id === 'p1'; });
        var newP2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.ok(newP1);
        node_assert_1.default.ok(newP2);
        // P1 balance: 1000 - 100 + 300 = 1200
        node_assert_1.default.strictEqual(newP1.balance, 1200);
        node_assert_1.default.deepStrictEqual(newP1.properties, [1, 2]);
        // P2 balance: 500 - 300 + 100 = 300
        node_assert_1.default.strictEqual(newP2.balance, 300);
        node_assert_1.default.deepStrictEqual(newP2.properties, [3, 4]);
    });
    (0, node_test_1.test)('should handle properties-only trades', function () {
        var p1 = createMockPlayer('p1', 1000, [1, 2]);
        var p2 = createMockPlayer('p2', 500, [3, 4]);
        var state = createMockGameState([p1, p2]);
        var offer = {
            myCash: 0,
            partnerCash: 0,
            myProperties: [1, 2],
            partnerProperties: [3],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var newP1 = newState.players.find(function (p) { return p.id === 'p1'; });
        var newP2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.ok(newP1);
        node_assert_1.default.ok(newP2);
        node_assert_1.default.strictEqual(newP1.balance, 1000);
        node_assert_1.default.deepStrictEqual(newP1.properties, [3]);
        node_assert_1.default.strictEqual(newP2.balance, 500);
        node_assert_1.default.deepStrictEqual(newP2.properties, [4, 1, 2]);
    });
    (0, node_test_1.test)('should leave other players unaffected', function () {
        var p1 = createMockPlayer('p1', 1000, [1]);
        var p2 = createMockPlayer('p2', 500, [2]);
        var p3 = createMockPlayer('p3', 1500, [3]);
        var state = createMockGameState([p1, p2, p3]);
        var offer = {
            myCash: 100,
            partnerCash: 0,
            myProperties: [1],
            partnerProperties: [],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var newP3 = newState.players.find(function (p) { return p.id === 'p3'; });
        node_assert_1.default.ok(newP3);
        node_assert_1.default.strictEqual(newP3.balance, 1500);
        node_assert_1.default.deepStrictEqual(newP3.properties, [3]);
    });
});
(0, node_test_1.describe)('endTurn', function () {
    (0, node_test_1.test)('should transition to the next player', function () {
        var state = createMockState([createMockPlayer('1'), createMockPlayer('2'), createMockPlayer('3')], 0);
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 1);
        node_assert_1.default.strictEqual(newState.turnPhase, 'ROLL');
    });
    (0, node_test_1.test)('should wrap around to the first player', function () {
        var state = createMockState([createMockPlayer('1'), createMockPlayer('2'), createMockPlayer('3')], 2);
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 0);
        node_assert_1.default.strictEqual(newState.turnPhase, 'ROLL');
    });
    (0, node_test_1.test)('should skip a bankrupt player', function () {
        var state = createMockState([createMockPlayer('1'), createMockPlayer('2', true), createMockPlayer('3')], 0);
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 2);
    });
    (0, node_test_1.test)('should wrap around and skip a bankrupt player', function () {
        var state = createMockState([createMockPlayer('1', true), createMockPlayer('2'), createMockPlayer('3')], 2);
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 1);
    });
    (0, node_test_1.test)('should return to same player if all others are bankrupt', function () {
        var state = createMockState([createMockPlayer('1'), createMockPlayer('2', true), createMockPlayer('3', true)], 0);
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 0);
    });
});
(0, node_test_1.describe)('endTurn prison logic', function () {
    var getBaseState = function () {
        var state = (0, gameLogic_ts_1.createInitialState)();
        state.players = [
            {
                id: 'p1',
                name: 'Player 1',
                position: 0,
                balance: 1500,
                properties: [],
                isBankrupt: false,
                color: '#f00',
            },
            {
                id: 'p2',
                name: 'Player 2',
                position: 0,
                balance: 1500,
                properties: [],
                isBankrupt: false,
                color: '#0f0',
            },
            {
                id: 'p3',
                name: 'Player 3',
                position: 0,
                balance: 1500,
                properties: [],
                isBankrupt: false,
                color: '#00f',
            },
        ];
        state.currentPlayerIndex = 0;
        return state;
    };
    (0, node_test_1.test)('skips player in prison and decrements turnsLeft', function () {
        var state = getBaseState();
        // Player 2 is in prison with 2 turns left
        state.prison = { p2: { turnsLeft: 2 } };
        state.currentPlayerIndex = 0; // Player 1's turn
        // Player 1 ends turn -> should be Player 2's turn but they are skipped -> so it becomes Player 3's turn
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 2); // Now Player 3's turn
        node_assert_1.default.strictEqual(newState.prison['p2'].turnsLeft, 1);
        // Player 3 ends turn -> Player 1's turn
        newState = (0, gameLogic_ts_1.endTurn)(newState);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 0); // Now Player 1's turn
        // Player 1 ends turn -> should be Player 2's turn but skipped -> Player 3's turn again
        newState = (0, gameLogic_ts_1.endTurn)(newState);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 2); // Now Player 3's turn
        node_assert_1.default.strictEqual(newState.prison['p2'].turnsLeft, 0);
        // Next round: Player 3 -> Player 1
        newState = (0, gameLogic_ts_1.endTurn)(newState);
        // Player 1 -> Player 2 gets released and takes turn
        newState = (0, gameLogic_ts_1.endTurn)(newState);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 1); // Now Player 2's turn
        node_assert_1.default.strictEqual(newState.prison['p2'], undefined); // Released!
    });
    (0, node_test_1.test)('releases player from prison when turnsLeft reaches 0', function () {
        var state = getBaseState();
        state.prison = { p2: { turnsLeft: 0 } };
        state.currentPlayerIndex = 0; // Player 1
        // Player 1 ends turn -> Player 2 is in prison with 0 turns left, gets released and it becomes their turn
        var newState = (0, gameLogic_ts_1.endTurn)(state);
        node_assert_1.default.strictEqual(newState.currentPlayerIndex, 1);
        node_assert_1.default.strictEqual(newState.prison['p2'], undefined, 'Player 2 should be released');
    });
});
(0, node_test_1.describe)('applyLandingLogic', function () {
    var getBaseState = function () {
        var state = (0, gameLogic_ts_1.createInitialState)();
        state.players = [
            {
                id: 'p1',
                name: 'Player 1',
                position: 0,
                balance: 1500,
                properties: [],
                isBankrupt: false,
                color: '#f00',
            },
            {
                id: 'p2',
                name: 'Player 2',
                position: 0,
                balance: 1500,
                properties: [],
                isBankrupt: false,
                color: '#0f0',
            },
        ];
        state.currentPlayerIndex = 0;
        return state;
    };
    (0, node_test_1.test)('deducts tax amount from player balance when landing on TAX', function () {
        var state = getBaseState();
        // Find a TAX tile in BOARD_DATA
        var taxTileIndex = state.tiles.findIndex(function (t) { return t.type === 'TAX'; });
        node_assert_1.default.notStrictEqual(taxTileIndex, -1, 'Board must have at least one TAX tile');
        // Deep clone the tiles array to avoid polluting global state
        state.tiles = state.tiles.map(function (t) { return (__assign({}, t)); });
        var taxTile = state.tiles[taxTileIndex];
        // Explicitly set price to 0 to test fallback logic
        taxTile.price = undefined;
        state.players[0].position = taxTileIndex;
        var newState = (0, gameLogic_ts_1.applyLandingLogic)(state);
        node_assert_1.default.strictEqual(newState.players[0].balance, 1500); // Deducted 0
        node_assert_1.default.strictEqual(newState.turnPhase, 'END');
        node_assert_1.default.ok(newState.logs.length > state.logs.length);
    });
    (0, node_test_1.test)('pays rent to owner when landing on owned PROPERTY', function () {
        var state = getBaseState();
        var propIndex = state.tiles.findIndex(function (t) { return t.type === 'PROPERTY'; });
        node_assert_1.default.notStrictEqual(propIndex, -1, 'Board must have at least one PROPERTY tile');
        var propTile = state.tiles[propIndex];
        var rentAmount = propTile.rent ? propTile.rent[0] : 0;
        // Player 2 owns the property
        state.players[1].properties = [propTile.id];
        // Player 1 lands on it
        state.players[0].position = propIndex;
        var newState = (0, gameLogic_ts_1.applyLandingLogic)(state);
        node_assert_1.default.strictEqual(newState.players[0].balance, 1500 - rentAmount);
        node_assert_1.default.strictEqual(newState.players[1].balance, 1500 + rentAmount);
        node_assert_1.default.strictEqual(newState.turnPhase, 'END');
    });
    (0, node_test_1.test)('does not pay rent if owner is bankrupt', function () {
        var state = getBaseState();
        var propIndex = state.tiles.findIndex(function (t) { return t.type === 'PROPERTY'; });
        var propTile = state.tiles[propIndex];
        // Player 2 owns it but is bankrupt
        state.players[1].properties = [propTile.id];
        state.players[1].isBankrupt = true;
        state.players[0].position = propIndex;
        var newState = (0, gameLogic_ts_1.applyLandingLogic)(state);
        // Balances should not change
        node_assert_1.default.strictEqual(newState.players[0].balance, 1500);
        node_assert_1.default.strictEqual(newState.players[1].balance, 1500);
        node_assert_1.default.notStrictEqual(newState.turnPhase, 'END'); // Rent check didn't apply
    });
    (0, node_test_1.test)('sends player to Prison when landing on "Go To Prison" tile', function () {
        var state = getBaseState();
        var prisonTileIndex = state.tiles.findIndex(function (t) { return t.name === 'Go To Prison'; });
        node_assert_1.default.notStrictEqual(prisonTileIndex, -1, 'Board must have "Go To Prison" tile');
        state.players[0].position = prisonTileIndex;
        var newState = (0, gameLogic_ts_1.applyLandingLogic)(state);
        node_assert_1.default.strictEqual(newState.players[0].position, 6); // Assumes position 6 is Prison
        node_assert_1.default.deepStrictEqual(newState.prison[state.players[0].id], { turnsLeft: 2 });
        node_assert_1.default.strictEqual(newState.turnPhase, 'END');
    });
    (0, node_test_1.test)('prevents player from ending turn if they are in debt (must sell or bankrupt)', function () {
        var state = getBaseState();
        state.turnPhase = 'ACTION'; // Mocking what it might be before
        // Player 1 has 10 balance
        state.players[0].balance = 10;
        // Tax tile
        var taxTileIndex = state.tiles.findIndex(function (t) { return t.type === 'TAX'; });
        // Deep clone the tiles array to avoid polluting global state
        state.tiles = state.tiles.map(function (t) { return (__assign({}, t)); });
        state.tiles[taxTileIndex].price = 200; // More than balance
        // In case logic looks at tax:
        state.players[0].position = taxTileIndex;
        var newState = (0, gameLogic_ts_1.applyLandingLogic)(state);
        // Player lost money, but their turn phase didn't transition to END
        node_assert_1.default.strictEqual(newState.players[0].balance, -190);
        node_assert_1.default.strictEqual(newState.turnPhase, 'ACTION');
    });
    (0, node_test_1.test)('strips all properties from a player when they declare bankruptcy', function () {
        var state = getBaseState();
        state.players[0].properties = [1, 2];
        var newState = (0, gameLogic_ts_1.handleBankrupt)(state, 'p1');
        node_assert_1.default.strictEqual(newState.players[0].isBankrupt, true);
        node_assert_1.default.strictEqual(newState.players[0].balance, 0);
        node_assert_1.default.deepStrictEqual(newState.players[0].properties, []);
    });
    (0, node_test_1.test)('makes properties available for purchase after bankrupt player is stripped of them', function () {
        var state = getBaseState();
        var propTileIndex = state.tiles.findIndex(function (t) { return t.type === 'PROPERTY'; });
        // Deep clone tiles to safely mutate state for the test
        state.tiles = state.tiles.map(function (t) { return (__assign({}, t)); });
        var propTile = state.tiles[propTileIndex];
        // Player 1 buys it originally
        state.players[0].properties = [propTile.id];
        // Player 1 goes bankrupt
        state = (0, gameLogic_ts_1.handleBankrupt)(state, 'p1');
        // Now it's Player 2's turn
        state.currentPlayerIndex = 1;
        state.players[1].position = propTileIndex;
        // Player 2 attempts to buy the same property
        state = (0, gameLogic_ts_1.buyProperty)(state, propTile.id);
        // Verify Player 2 now owns the property
        node_assert_1.default.ok(state.players[1].properties.includes(propTile.id));
    });
});
(0, node_test_1.describe)('buyProperty', function () {
    var createMockPlayer = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ id: 'p1', name: 'Player 1', position: 0, balance: 1500, properties: [], isBankrupt: false, color: 'red' }, overrides));
    };
    var createMockTile = function (overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ id: 1, name: 'Property 1', type: 'PROPERTY', price: 100 }, overrides));
    };
    var createMockState = function (players, tiles, overrides) {
        if (overrides === void 0) { overrides = {}; }
        return (__assign({ players: players, currentPlayerIndex: 0, tiles: tiles, status: 'PLAYING', turnPhase: 'ACTION', lastDice: [1, 1], logs: [], chatMessages: [], prison: {}, activeEvent: null }, overrides));
    };
    (0, node_test_1.test)('should successfully buy an unowned property', function () {
        var player = createMockPlayer({ balance: 200 });
        var tile = createMockTile({ id: 1, price: 100 });
        var state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile]);
        var newState = (0, gameLogic_ts_1.buyProperty)(state, 1);
        node_assert_1.default.notStrictEqual(newState, state); // Should return a new state object
        node_assert_1.default.strictEqual(newState.players[0].balance, 100); // 200 - 100
        node_assert_1.default.deepStrictEqual(newState.players[0].properties, [1]);
        node_assert_1.default.strictEqual(newState.turnPhase, 'END');
        node_assert_1.default.strictEqual(newState.logs.length, 1);
        var log = newState.logs[0];
        node_assert_1.default.strictEqual(log.key, 'bought');
        node_assert_1.default.strictEqual(log.params.name, 'Player 1');
        node_assert_1.default.strictEqual(log.params.property, 'Property 1');
        node_assert_1.default.strictEqual(log.params.price, 100);
    });
    (0, node_test_1.test)('should not buy if player has insufficient funds', function () {
        var player = createMockPlayer({ balance: 50 });
        var tile = createMockTile({ id: 1, price: 100 });
        var state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile]);
        var newState = (0, gameLogic_ts_1.buyProperty)(state, 1);
        node_assert_1.default.strictEqual(newState, state); // Should return the exact same state
    });
    (0, node_test_1.test)('should not buy if property is already owned by another player', function () {
        var player1 = createMockPlayer({ id: 'p1', balance: 500 });
        var player2 = createMockPlayer({ id: 'p2', balance: 500, properties: [1] });
        var tile = createMockTile({ id: 1, price: 100 });
        var state = createMockState([player1, player2], [createMockTile({ id: 0, price: 0 }), tile]);
        var newState = (0, gameLogic_ts_1.buyProperty)(state, 1);
        node_assert_1.default.strictEqual(newState, state); // Should return the exact same state
    });
    (0, node_test_1.test)('should not buy if property is already owned by the current player', function () {
        var player = createMockPlayer({ balance: 500, properties: [1] });
        var tile = createMockTile({ id: 1, price: 100 });
        var state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile]);
        var newState = (0, gameLogic_ts_1.buyProperty)(state, 1);
        node_assert_1.default.strictEqual(newState, state); // Should return the exact same state
    });
    (0, node_test_1.test)('should not buy if tile has no price (e.g., GO or Tax)', function () {
        var player = createMockPlayer({ balance: 500 });
        var tile = createMockTile({ id: 1, type: 'SPECIAL', price: undefined });
        var state = createMockState([player], [createMockTile({ id: 0, price: 0 }), tile]);
        var newState = (0, gameLogic_ts_1.buyProperty)(state, 1);
        node_assert_1.default.strictEqual(newState, state); // Should return the exact same state
    });
});
(0, node_test_1.describe)('executeTrade', function () {
    var createMockState = function () { return ({
        players: [
            {
                id: 'p1',
                name: 'Player 1',
                position: 0,
                balance: 1000,
                properties: [1, 2],
                isBankrupt: false,
                color: '#ff0000',
            },
            {
                id: 'p2',
                name: 'Player 2',
                position: 0,
                balance: 1500,
                properties: [3, 4],
                isBankrupt: false,
                color: '#0000ff',
            },
        ],
        currentPlayerIndex: 0,
        tiles: [],
        status: 'PLAYING',
        turnPhase: 'ACTION',
        lastDice: [1, 1],
        logs: [],
        chatMessages: [],
        prison: {},
        activeEvent: null,
    }); };
    (0, node_test_1.test)('should execute a valid trade', function () {
        var state = createMockState();
        var offer = {
            myCash: 200,
            partnerCash: 100,
            myProperties: [1],
            partnerProperties: [3],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var p1 = newState.players.find(function (p) { return p.id === 'p1'; });
        var p2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.strictEqual(p1.balance, 1000 - 200 + 100);
        node_assert_1.default.deepStrictEqual(p1.properties, [2, 3]);
        node_assert_1.default.strictEqual(p2.balance, 1500 - 100 + 200);
        node_assert_1.default.deepStrictEqual(p2.properties, [4, 1]);
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade executed between Player 1 and Player 2');
    });
    (0, node_test_1.test)('should fail if p1 has insufficient funds', function () {
        var state = createMockState();
        var offer = {
            myCash: 2000, // p1 only has 1000
            partnerCash: 0,
            myProperties: [],
            partnerProperties: [],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var p1 = newState.players.find(function (p) { return p.id === 'p1'; });
        node_assert_1.default.strictEqual(p1.balance, 1000); // unchanged
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.');
    });
    (0, node_test_1.test)('should fail if p2 has insufficient funds', function () {
        var state = createMockState();
        var offer = {
            myCash: 0,
            partnerCash: 2000, // p2 only has 1500
            myProperties: [],
            partnerProperties: [],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var p2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.strictEqual(p2.balance, 1500); // unchanged
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade failed: Insufficient funds.');
    });
    (0, node_test_1.test)('should fail if p1 offers unowned property', function () {
        var state = createMockState();
        var offer = {
            myCash: 0,
            partnerCash: 0,
            myProperties: [5], // p1 does not own 5
            partnerProperties: [],
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var p1 = newState.players.find(function (p) { return p.id === 'p1'; });
        node_assert_1.default.deepStrictEqual(p1.properties, [1, 2]); // unchanged
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade failed: Properties not owned.');
    });
    (0, node_test_1.test)('should fail if p2 offers unowned property', function () {
        var state = createMockState();
        var offer = {
            myCash: 0,
            partnerCash: 0,
            myProperties: [],
            partnerProperties: [1], // p2 does not own 1
        };
        var newState = (0, gameLogic_ts_1.executeTrade)(state, 'p1', 'p2', offer);
        var p2 = newState.players.find(function (p) { return p.id === 'p2'; });
        node_assert_1.default.deepStrictEqual(p2.properties, [3, 4]); // unchanged
        node_assert_1.default.strictEqual(newState.logs[0], 'Trade failed: Properties not owned.');
    });
});
(0, node_test_1.describe)('moveOneStep', function () {
    (0, node_test_1.test)('should move player position by 1 without changing balance for normal tile', function () {
        var initialState = (0, gameLogic_ts_1.createInitialState)();
        var stateWithPlayer = __assign(__assign({}, initialState), { players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    position: 0,
                    balance: 1500,
                    properties: [],
                    isBankrupt: false,
                    color: '#ff0000',
                },
            ], currentPlayerIndex: 0 });
        var newState = (0, gameLogic_ts_1.moveOneStep)(stateWithPlayer);
        node_assert_1.default.strictEqual(newState.players[0].position, 1, 'Position should increment by 1');
        node_assert_1.default.strictEqual(newState.players[0].balance, 1500, 'Balance should remain unchanged');
        node_assert_1.default.strictEqual(newState.logs.length, initialState.logs.length, 'No new logs should be added');
    });
    (0, node_test_1.test)('should wrap around and add GO_REWARD when passing GO', function () {
        var initialState = (0, gameLogic_ts_1.createInitialState)();
        var lastTileIndex = initialState.tiles.length - 1;
        var stateWithPlayer = __assign(__assign({}, initialState), { players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    position: lastTileIndex,
                    balance: 1500,
                    properties: [],
                    isBankrupt: false,
                    color: '#ff0000',
                },
            ], currentPlayerIndex: 0 });
        var newState = (0, gameLogic_ts_1.moveOneStep)(stateWithPlayer);
        node_assert_1.default.strictEqual(newState.players[0].position, 0, 'Position should wrap around to 0');
        node_assert_1.default.strictEqual(newState.players[0].balance, 1500 + gameConfig_ts_1.GAME_CONFIG.GO_REWARD, 'Balance should increase by GO_REWARD');
        node_assert_1.default.strictEqual(newState.logs.length, initialState.logs.length + 1, 'A new log should be added');
        node_assert_1.default.deepStrictEqual(newState.logs[0], { key: 'passedStart', params: { name: 'Player 1', amount: gameConfig_ts_1.GAME_CONFIG.GO_REWARD } }, 'Log should reflect passing GO');
    });
    (0, node_test_1.test)('should not mutate original state', function () {
        var initialState = (0, gameLogic_ts_1.createInitialState)();
        var stateWithPlayer = __assign(__assign({}, initialState), { players: [
                {
                    id: 'player1',
                    name: 'Player 1',
                    position: 0,
                    balance: 1500,
                    properties: [],
                    isBankrupt: false,
                    color: '#ff0000',
                },
            ], currentPlayerIndex: 0 });
        // Freeze original state to ensure no mutation
        Object.freeze(stateWithPlayer);
        Object.freeze(stateWithPlayer.players);
        Object.freeze(stateWithPlayer.players[0]);
        // We expect no TypeError to be thrown from mutation
        var newState = (0, gameLogic_ts_1.moveOneStep)(stateWithPlayer);
        node_assert_1.default.strictEqual(newState.players[0].position, 1);
        node_assert_1.default.strictEqual(stateWithPlayer.players[0].position, 0);
        node_assert_1.default.notStrictEqual(newState, stateWithPlayer);
        node_assert_1.default.notStrictEqual(newState.players, stateWithPlayer.players);
    });
});
(0, node_test_1.describe)('handleBankrupt', function () {
    (0, node_test_1.test)('strips all properties from a player and sets balance to 0 when they declare bankruptcy', function () {
        var initialState = (0, gameLogic_ts_1.createInitialState)();
        var player1 = {
            id: 'p1',
            name: 'Player 1',
            color: 'red',
            position: 0,
            balance: 100,
            properties: [1, 3],
            isBankrupt: false,
        };
        var player2 = {
            id: 'p2',
            name: 'Player 2',
            color: 'blue',
            position: 0,
            balance: 1500,
            properties: [],
            isBankrupt: false,
        };
        initialState.players = [player1, player2];
        initialState.currentPlayerIndex = 0;
        var nextState = (0, gameLogic_ts_1.handleBankrupt)(initialState, 'p1');
        node_assert_1.default.strictEqual(nextState.players[0].isBankrupt, true);
        node_assert_1.default.strictEqual(nextState.players[0].balance, 0);
        node_assert_1.default.deepStrictEqual(nextState.players[0].properties, []);
        // Test that the properties are unowned
        node_assert_1.default.strictEqual(nextState.players.some(function (p) { return p.properties.includes(1); }), false);
        node_assert_1.default.strictEqual(nextState.players.some(function (p) { return p.properties.includes(3); }), false);
    });
});
