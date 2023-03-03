import { Select, MenuItem } from '@mui/material'

type Option = {
  value: any
  label: string
}
export const BaseSelect = ({
  options,
  onChange,
  value,
}: {
  options: Option[]
  onChange: any
  value: any
}) => (
  <Select id="demo-simple-select" value={value} onChange={(val) => onChange(val)}>
    {options.map((option) => (
      <MenuItem value={option.value} key={option.label}>{option.label}</MenuItem>
    ))}
  </Select>
)
