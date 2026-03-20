import { useTranslation } from 'react-i18next'
import { motion, AnimatePresence } from 'framer-motion'

interface InformationDialogProps {
  isOpen: boolean
  title: string
  message: string
  onClose: () => void
}

export default function InformationDialog({
  isOpen,
  title,
  message,
  onClose,
}: InformationDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.8, opacity: 0, y: 50 }}
          className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border-4 border-egyptian-gold text-center relative overflow-hidden"
        >
          {/* Decorative background element */}
          <div className="absolute top-0 left-0 w-full h-2 bg-egyptian-gold" />

          <h2 className="text-2xl font-bold text-egyptian-blue mb-4">{title}</h2>
          <p className="text-lg font-bold text-gray-800 mb-8">{message}</p>

          <div className="flex justify-center">
            <button
              onClick={onClose}
              className="px-8 py-2 bg-egyptian-blue text-white font-bold rounded-lg hover:bg-blue-800 transition-colors shadow-md active:scale-95"
            >
              {t('okBtn', { defaultValue: 'OK' })}
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  )
}
