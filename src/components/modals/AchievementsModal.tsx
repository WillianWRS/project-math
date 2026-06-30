import { Modal } from '../ui/Modal'

interface AchievementsModalProps {
  open: boolean
  onClose: () => void
}

function IconTarget() {
  return (
    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="5" stroke="currentColor" strokeWidth="2" />
      <circle cx="12" cy="12" r="1.5" fill="currentColor" />
    </svg>
  )
}

export function AchievementsModal({ open, onClose }: AchievementsModalProps) {
  return (
    <Modal open={open} title="Conquistas" titleIcon={<IconTarget />} onClose={onClose} stackLevel={1}>
      <p className="text-sm leading-relaxed text-stone-200">
        Acompanhe metas, marcos e desafios concluídos ao longo da sua jornada. Em breve, todas as suas
        conquistas desbloqueadas e pendentes aparecerão aqui.
      </p>
    </Modal>
  )
}
