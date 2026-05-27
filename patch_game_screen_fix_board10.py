import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Replace the board section with a dynamic inline scaled container.
# This guarantees exact centering and scaling without relying on tricky CSS.

board_search = """          <div className="w-full h-full flex-1 max-w-full relative z-10 lg:origin-top lg:flex lg:justify-center lg:items-center mobile-board-wrapper">
            <Board
              handleRoll={handleRoll}
              isMyTurn={isMyTurn}
              sendAction={sendAction}
              onTileClick={setSelectedTile}
              setToastMessage={setToastMessage}
            />
          </div>"""

board_replace = """          <div className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center items-center relative z-10">
            <div
              className="origin-center lg:scale-100 lg:origin-top flex justify-center items-center"
              style={{
                transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? `scale(${Math.min(window.innerWidth, window.innerHeight) / 1280})` : undefined,
              }}
            >
              <Board
                handleRoll={handleRoll}
                isMyTurn={isMyTurn}
                sendAction={sendAction}
                onTileClick={setSelectedTile}
                setToastMessage={setToastMessage}
              />
            </div>
          </div>"""

content = content.replace(board_search, board_replace)

# To ensure the scale updates on resize, we can add a simple resize listener in GameScreen.
hook_search = "  const currentPlayer = gameState.players[gameState.currentPlayerIndex]"
hook_replace = """  const [scale, setScale] = useState(1)
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1024) {
        setScale(Math.min(window.innerWidth, window.innerHeight) / 1280)
      } else {
        setScale(1)
      }
    }
    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  const currentPlayer = gameState.players[gameState.currentPlayerIndex]"""

content = content.replace(hook_search, hook_replace)

# Now update the style to use the state
content = content.replace(
"""              style={{
                transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? `scale(${Math.min(window.innerWidth, window.innerHeight) / 1280})` : undefined,
              }}""",
"""              style={{
                transform: typeof window !== 'undefined' && window.innerWidth < 1024 ? `scale(${scale})` : undefined,
              }}"""
)

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)


# Clean up index.css
with open("src/index.css", "r") as f:
    css_content = f.read()

# Remove the .mobile-board classes completely to avoid conflicts.
# They are between `@media (max-width: 1023px) {` and `  /* Reset transform if we use zoom */`
css_content = re.sub(r"\.mobile-board-wrapper \{.*?\n  \}\n  \.mobile-board-scale \{.*?\}\n", "", css_content, flags=re.DOTALL)
css_content = re.sub(r"  /\* Reset transform if we use zoom \*/\n  \.mobile-board-scale \{\n    transform: none;\n  \}", "", css_content, flags=re.DOTALL)

with open("src/index.css", "w") as f:
    f.write(css_content)
