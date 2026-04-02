import { useEffect } from 'react'
import { motion } from 'framer-motion'
import { X } from 'lucide-react'
import { getAvatarPath } from '../utils/avatars'

export type TradeNotificationType = 'OFFER' | 'ACCEPT' | 'REJECT'

export interface TradeNotificationData {
  id: string
  type: TradeNotificationType
  playerName: string
  avatarName: string
  color: string
}

interface TradeNotificationProps {
  notification: TradeNotificationData
  message: string
  onClose: (id: string) => void
  onClick: () => void
  duration?: number
}

export default function TradeNotification({
  notification,
  message,
  onClose,
  onClick,
  duration = 5000,
}: TradeNotificationProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(notification.id)
    }, duration)
    return () => clearTimeout(timer)
  }, [notification.id, duration, onClose])

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -50, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, scale: 0.9, transition: { duration: 0.2 } }}
      className="flex items-center gap-3 bg-white dark:bg-slate-800 p-3 rounded-xl shadow-xl border-2 cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-700 transition-colors pointer-events-auto"
      style={{ borderColor: notification.color }}
      onClick={() => {
        onClick()
        onClose(notification.id)
      }}
    >
      <div
        className="w-10 h-10 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden border-2 shrink-0 flex items-center justify-center"
        style={{ borderColor: notification.color }}
      >
        {/* Render initial if image fails or before loading, beneath the img */}
        <span className="absolute fs-sm font-bold uppercase text-slate-500 -z-10">
          {notification.playerName.charAt(0)}
        </span>
        <img
          src={getAvatarPath(notification.avatarName)}
          alt={notification.playerName}
          className="w-full h-full object-cover z-10"
          onError={(e) => {
            // Fallback if avatar is not found
            e.currentTarget.style.display = 'none'
          }}
        />
      </div>

      <div className="flex-1 min-w-0 pr-2">
        <p className="fs-sm font-bold text-slate-800 dark:text-white truncate">{message}</p>
      </div>

      <button
        onClick={(e) => {
          e.stopPropagation()
          onClose(notification.id)
        }}
        className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-white rounded-full transition-colors shrink-0"
      >
        <X size={16} />
      </button>
    </motion.div>
  )
}
