import { useTranslation } from 'react-i18next'

interface ConfirmDialogProps {
  isOpen: boolean
  message: string
  onConfirm: () => void
  onCancel: () => void
}

export default function ConfirmDialog({
  isOpen,
  message,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  const { t } = useTranslation()

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white p-6 rounded-xl shadow-2xl max-w-sm w-full border-4 border-egyptian-red text-center">
        <p className="fs-lg font-bold text-gray-800 mb-6">{message}</p>
        <div className="flex justify-center gap-4">
          <button
            onClick={onCancel}
            className="px-6 py-2 bg-slate-200 text-slate-800 font-bold rounded-lg hover:bg-slate-300 transition-colors"
          >
            {t('cancelBtn', { defaultValue: 'Cancel' })}
          </button>
          <button
            onClick={() => {
              onConfirm()
              onCancel()
            }}
            className="px-6 py-2 bg-red-600 text-white font-bold rounded-lg hover:bg-red-700 transition-colors"
          >
            {t('confirmBtn', { defaultValue: 'Confirm' })}
          </button>
        </div>
      </div>
    </div>
  )
}
