import { useFormik } from 'formik'
import { get, isNil } from 'lodash'

export const getFieldProps = (
  formik: ReturnType<typeof useFormik>,
  name: string,
  initialValue = '',
) => {
  const isTouched = get(formik.touched, name)
  const errorMessage = get(formik.errors, name)
  const value = get(formik.values, name, initialValue) ?? ''

  return {
    name,
    value,
    onChange: formik.handleChange,
    onBlur: () => {
      formik.setFieldTouched(name, true)
    },
    error: isTouched && !isNil(errorMessage),
    helperText: isTouched ? errorMessage : null,
  }
}
