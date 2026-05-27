import re

with open("src/components/GameScreen.tsx", "r") as f:
    content = f.read()

# Let's ensure the board scales UP if needed on larger screens, but the request was specifically for phones.
# And let's make sure `availableHeight` calculation is robust.
# The mobile bottom nav is around 60px. Top ping is around 50px.
# I set availableHeight = window.innerHeight - 130. That's fine.

# Let's double check if there are any other issues.
# "Now the game is not playable on small screens. The board cannot be seen."
# This was caused by `style={{ transform: scale !== 1 ? ... }}` with missing `transformOrigin`.
# Wait! In GameScreen.tsx:
# <div className="origin-center lg:scale-100 lg:origin-top flex justify-center items-center" style={{ transform: scale !== 1 ? `scale(${scale})` : undefined }}>
#
# Let's ensure `transformOrigin` is center so it shrinks into the middle of the available flex space.
# It has `origin-center`.

pass
