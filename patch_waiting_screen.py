import re

with open('src/components/WaitingScreen.tsx', 'r') as f:
    content = f.read()

# Add imports
content = content.replace("import { Users, UserMinus, Mic, MicOff, PhoneCall, Bot } from 'lucide-react'", "import { Users, UserMinus, Mic, MicOff, PhoneCall, Bot, Send, MessageSquare } from 'lucide-react'")

# Add constant and function for sanitization
import_statement = "import ConfirmDialog from './ConfirmDialog'\n"
sanitize_block = """
const MAX_CHAT_LENGTH = 200

const sanitizeMessage = (msg: string): string => {
  return msg.slice(0, MAX_CHAT_LENGTH).replace(/[<>&"'`]/g, '')
}
"""
content = content.replace(import_statement, import_statement + sanitize_block)

# Add chat state and handler inside WaitingScreen
hook_str = "  const [playerToKick, setPlayerToKick] = useState<string | null>(null)\n"
chat_state_str = """  const [chatMsg, setChatMsg] = useState('')

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault()
    const sanitized = sanitizeMessage(chatMsg)
    if (!sanitized.trim()) return
    sendAction({ type: 'CHAT', message: sanitized })
    setChatMsg('')
  }
"""
content = content.replace(hook_str, hook_str + chat_state_str)

# Add chat UI before the action buttons section
pt_4_border = "        <div className=\"pt-4 border-t border-slate-200 dark:border-slate-700 text-center\">"
chat_ui_str = """
        <div className="bg-white dark:bg-slate-800 p-4 rounded-lg border border-slate-200 dark:border-slate-700">
          <h3 className="font-bold flex items-center gap-2 mb-3 text-egyptian-blue dark:text-egyptian-gold uppercase fs-sm">
            <MessageSquare size={18} /> {t('game.chatPlaceholder', 'Chat')}
          </h3>
          <div className="h-32 flex flex-col">
            <div className="flex-1 overflow-y-auto fs-xs space-y-2 mb-2 pr-1 rtl:pr-0 rtl:pl-1">
              {gameState.chatMessages.length === 0 ? (
                <div className="text-slate-400 dark:text-slate-500 italic">{t('game.chatReady')}</div>
              ) : (
                gameState.chatMessages.map((msg, i) => (
                  <div key={i} className="mb-1">
                    <span className="font-bold text-egyptian-blue">{msg.sender}: </span>
                    <span className="dark:text-slate-200">{msg.message}</span>
                  </div>
                ))
              )}
            </div>
            <form
              onSubmit={(e) => {
                handleSendChat(e)
              }}
              className="flex gap-1"
            >
              <input
                type="text"
                className="flex-1 fs-sm min-w-0 border fs-xs p-2 rounded dark:bg-slate-700 dark:border-slate-600 dark:text-white"
                placeholder={t('game.chatPlaceholder')}
                value={chatMsg}
                onChange={(e) => setChatMsg(e.target.value)}
              />
              <button
                type="submit"
                className="p-2 bg-slate-200 dark:bg-slate-700 rounded rtl:rotate-180 hover:bg-slate-300 dark:hover:bg-slate-600 transition-colors dark:text-white"
                title={t('game.sendChat', 'Send')}
              >
                <Send size={16} />
              </button>
            </form>
          </div>
        </div>

"""
content = content.replace(pt_4_border, chat_ui_str + pt_4_border)

with open('src/components/WaitingScreen.tsx', 'w') as f:
    f.write(content)
