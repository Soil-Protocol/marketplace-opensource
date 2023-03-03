import styled from '@emotion/styled'
import { Button, Divider, Link, Typography } from '@mui/material'
import { CoreBreadcrumbs } from 'core/CoreBreadcrumbs'
import { toast } from 'react-toastify'
import { dialogStore } from 'stores/dialogStore'
import { loadingStore } from 'stores/loadingStore'
import { Limit } from '../Limit'

const Wrapper = styled(Limit)`
  code {
    background: rgba(255, 0, 0, 0.1);
    padding: 4px;
  }

  button + button {
    margin-left: 1rem;
  }

  hr {
    margin: 1rem 0;
  }
`

export const UtilityPage = () => {
  const handleOpenSpinner = () => {
    loadingStore.increase()
    setTimeout(loadingStore.decrease, 2000)
  }

  const handleOpenDialog = () => {
    dialogStore.open('นี่คือเนื้อหาของไดอาลอก')
  }

  const handleOpenDialog2 = () => {
    dialogStore.open('นี่คือเนื้อหาของไดอาลอก', {
      title: 'หัวข้ออยู่ตรงนี้',
      divider: true,
      okText: 'เคๆๆ',
      cancelText: 'ออกๆๆ',
    })
  }

  const handleOpenToast = (type?: string) => {
    if (type) {
      toast[type]('type')
    } else {
      toast('default')
    }
  }

  return (
    <Wrapper p={4}>
      <Typography variant="h6" gutterBottom>
        Global Spinner
      </Typography>
      <Button variant="contained" color="primary" onClick={handleOpenSpinner}>
        Open
      </Button>

      <Divider />

      <Typography variant="h6" gutterBottom>
        Global Dialog (Default)
      </Typography>
      <Button variant="contained" color="secondary" onClick={handleOpenDialog}>
        Open
      </Button>

      <Divider />

      <Typography variant="h6" gutterBottom>
        Global Spinner (Decorated)
      </Typography>
      <Button variant="contained" color="secondary" onClick={handleOpenDialog2}>
        Open
      </Button>

      <Divider />

      <Typography variant="h6" gutterBottom>
        Toast{' '}
        <Link href="https://github.com/fkhadra/react-toastify" target="__blank">
          (react-toastify)
        </Link>
      </Typography>
      <Button variant="contained" onClick={() => handleOpenToast()}>
        Default
      </Button>
      <Button variant="contained" onClick={() => handleOpenToast('success')}>
        Success
      </Button>
      <Button variant="contained" onClick={() => handleOpenToast('error')}>
        Error
      </Button>
      <Button variant="contained" onClick={() => handleOpenToast('warning')}>
        Warning
      </Button>
      <Button variant="contained" onClick={() => handleOpenToast('info')}>
        Info
      </Button>

      <Divider />

      <Typography variant="h6" gutterBottom>
        Breadcrumbs
      </Typography>

      <CoreBreadcrumbs
        breadcrumbs={[
          { label: 'Home', url: '/' },
          {
            label: 'Utility',
          },
        ]}
      />

      <Divider />

      <Typography variant="h6" gutterBottom>
        getFieldProps
      </Typography>
      <Typography variant="body1">
        Use <code>{`{...getFieldProps(formik, 'fieldName')}`}</code> to generate
        Material-UI <code>TextField</code> props that binds with{' '}
        <code>Formik</code>.
      </Typography>

      <Divider />

      <Typography variant="h6" gutterBottom>
        Authentication
      </Typography>
      <Typography variant="body1">
        See <code>useSetup.ts</code> for more information.
      </Typography>
    </Wrapper>
  );
}
