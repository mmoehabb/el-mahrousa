const fs = require('fs')
const path = require('path')

const fixNetworking = () => {
  const filePath = path.join(__dirname, 'src/hooks/useNetworking.ts')
  let content = fs.readFileSync(filePath, 'utf8')

  // Remove unused `err` variables
  content = content.replace(/call\.on\('error', \(err\) => \{/g, "call.on('error', () => {")
  content = content.replace(
    /newPeer\.on\('error', \(err\) => \{/g,
    "newPeer.on('error', (err) => {",
  ) // Need this err for type checking inside the if-else
  content = content.replace(/conn\.on\('error', \(err\) => \{/g, "conn.on('error', () => {")
  content = content.replace(/catch \(err\) \{/g, 'catch {')

  // Specific fix for newPeer
  // Wait, newPeer uses `err.type`, so `err` is actually used. Ah, only some `err` are unused! Let's revert and do precision matching.
  fs.writeFileSync(filePath, content)
}

const fixScreen = (fileName) => {
  const filePath = path.join(__dirname, `src/components/${fileName}`)
  let content = fs.readFileSync(filePath, 'utf8')

  // Remove voiceError from props destructuring
  content = content.replace(/voiceError,\n/g, '')
  content = content.replace(/setVoiceError,\n/g, '')
  content = content.replace(/voiceError: string \| null\n/g, '')
  content = content.replace(/setVoiceError: \(error: string \| null\) => void\n/g, '')

  fs.writeFileSync(filePath, content)
}

const fixApp = () => {
  const filePath = path.join(__dirname, 'src/App.tsx')
  let content = fs.readFileSync(filePath, 'utf8')

  content = content.replace(/voiceError=\{voiceError\}\n/g, '')
  content = content.replace(/setVoiceError=\{setVoiceError\}\n/g, '')

  fs.writeFileSync(filePath, content)
}

fixNetworking()
fixScreen('GameScreen.tsx')
fixScreen('WaitingScreen.tsx')
fixApp()
