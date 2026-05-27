import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Remove imports
content = re.sub(r"import\s*{\s*TransformWrapper\s*,\s*TransformComponent\s*}\s*from\s*'react-zoom-pan-pinch'\n", "", content)
content = re.sub(r"import\s*type\s*{\s*ReactZoomPanPinchRef\s*}\s*from\s*'react-zoom-pan-pinch'\n", "", content)

# Remove refs and states related to camera
content = re.sub(r"  const transformComponentRef = useRef<ReactZoomPanPinchRef \| null>\(null\)\n", "", content)
content = re.sub(r"  const \[isFollowCameraOn, setIsFollowCameraOn\] = useState\(true\)\n", "", content)

# Remove useEffect for camera follow logic
camera_effect_start = content.find("  // Handle camera follow logic")
camera_effect_end = content.find("  // Handle auto-advance for dice roll and movement animations", camera_effect_start)
content = content[:camera_effect_start] + content[camera_effect_end:]

# Replace the camera button and TransformWrapper/TransformComponent
board_section_start = content.find("        {/* Center: Board */}")
board_section_end = content.find("        <WinnerModal")

new_board_section = """        {/* Center: Board */}
        <div
          dir="ltr"
          className="w-full h-full flex-1 max-w-full overflow-hidden flex justify-center relative z-10 sm:scale-100 origin-top"
        >
          <div className="absolute flex gap-2 top-4 left-1/2 -translate-x-1/2 z-50">
            {renderPingIndicator()}
          </div>

          <div className="w-full h-full flex items-center justify-center overflow-auto scale-[0.3] sm:scale-100 origin-center sm:origin-top">
            <Board
              handleRoll={handleRoll}
              isMyTurn={isMyTurn}
              sendAction={sendAction}
              onTileClick={setSelectedTile}
              setToastMessage={setToastMessage}
            />
          </div>
        </div>

"""

content = content[:board_section_start] + new_board_section + content[board_section_end:]

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
