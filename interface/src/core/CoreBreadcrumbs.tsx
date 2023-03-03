import { Breadcrumbs, Typography } from '@mui/material'
import Link from 'next/link'

export type Breadcrumb = {
  label: string
  url?: string
}

type Props = {
  breadcrumbs: Breadcrumb[]
}

export const CoreBreadcrumbs = (props: Props) => {
  const { breadcrumbs } = props

  return (
    <Breadcrumbs separator="›" style={{ marginBottom: '1.5rem' }}>
      {breadcrumbs.map((link, index) => {
        const { label, url } = link
        const isLast = index === breadcrumbs.length - 1

        const labelEl = (
          <Typography
            color={isLast ? 'textPrimary' : 'textSecondary'}
            style={{ fontWeight: isLast ? 500 : 300 }}
            variant="body2"
            key={index}
          >
            {label}
          </Typography>
        )

        if (url) {
          return (
            <Link href={url} key={index}>
              <a>{labelEl}</a>
            </Link>
          )
        }

        return labelEl
      })}
    </Breadcrumbs>
  )
}
