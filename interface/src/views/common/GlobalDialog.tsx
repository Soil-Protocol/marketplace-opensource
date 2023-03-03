import { CoreDialog } from 'core/CoreDialog'
import { observer } from 'mobx-react-lite'
import { dialogStore } from 'stores/dialogStore'

export const GlobalDialog = observer(() => {
  const { isOpen, props } = dialogStore
  const {
    title,
    onOk,
    onClose,
    okText,
    cancelText,
    divider,
    center,
    children,
  } = props

  if (!props.children) return null

  return (
    <CoreDialog
      title={title}
      open={isOpen}
      onClose={onClose}
      onOk={onOk}
      divider={divider}
      center={center}
      okText={okText}
      cancelText={cancelText}
    >
      {children}
    </CoreDialog>
  )
})
