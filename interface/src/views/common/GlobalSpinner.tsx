import { CoreSpinner } from 'core/CoreSpinner'
import { observer } from 'mobx-react-lite'
import { loadingStore } from 'stores/loadingStore'

export const GlobalSpinner = observer(() => (
  <CoreSpinner open={loadingStore.isLoading} />
))
