import styled from '@emotion/styled'
import {
  TextField, TextFieldProps,
} from '@mui/material'

// export type NumberInputProps = Omit<TextFieldProps, 'type'> &
//   RestrictedNumberInputParams

export const StyledTextField = styled(TextField)`
  .MuiOutlinedInput-input{
    padding: 8.5px 12px;
    color:#9A8DC0;
  }
  width: 100%;
`

export function TextInput({
  ...props
}: TextFieldProps) {
  return <StyledTextField variant="outlined" {...props} type="text" />
}
