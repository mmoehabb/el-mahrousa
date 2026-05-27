import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Remove the camera button
camera_btn_start = content.find("            <button\n              onClick={() => setIsFollowCameraOn(!isFollowCameraOn)}")
if camera_btn_start != -1:
    camera_btn_end = content.find("            </button>", camera_btn_start) + len("            </button>\n")
    content = content[:camera_btn_start] + content[camera_btn_end:]

with open("src/components/GameScreen.tsx", "w") as f:
    f.write(content)
