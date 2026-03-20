import re

with open('src/index.css', 'r') as f:
    css = f.read()

# Replace board-tile definitions
css = re.sub(r'\.board-tile \{[\s\S]*?\}', '''.board-tile {
  border-width: 1px;
  border-color: #94a3b8;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 0.15rem;
  font-size: 8px;
  font-weight: 700;
  text-align: center;
  position: relative;
  width: 100%;
  height: 100%;
  overflow: hidden;
}''', css, count=1)

css = re.sub(r'@media screen and \(min-width: 640px\) \{[\s\S]*?\.board-tile \{[\s\S]*?\}[\s\S]*?\}', '''@media screen and (min-width: 640px) {
  .board-tile {
    font-size: 9px;
    padding: 0.2rem;
  }
}''', css)

css = re.sub(r'@media screen and \(min-width: 768px\) \{[\s\S]*?\.board-tile \{[\s\S]*?\}[\s\S]*?\}', '''@media screen and (min-width: 768px) {
  .board-tile {
    font-size: 10px;
    padding: 0.25rem;
  }
}''', css)

with open('src/index.css', 'w') as f:
    f.write(css)

with open('src/components/Board.tsx', 'r') as f:
    board = f.read()

# Replace Board class
board = re.sub(
    r'className="relative p-2 sm:p-4 md:p-8 bg-egyptian-pattern rounded-lg shadow-2xl border-2 md:border-4 border-egyptian-gold inline-block"',
    'className="relative p-1 sm:p-2 md:p-4 bg-egyptian-pattern rounded-lg shadow-2xl border-2 md:border-4 border-egyptian-gold aspect-square w-[95vw] sm:w-[600px] md:w-[700px] lg:w-[800px] max-w-full"',
    board
)

with open('src/components/Board.tsx', 'w') as f:
    f.write(board)

print("Patched!")
