export const getError = (rawCode: string | number) => {
  const code = rawCode as string

  switch (true) {
    // Firebase Auth Errors
    case [
      'auth/user-not-found',
      'auth/wrong-password',
      'auth/invalid-email',
    ].includes(code): {
      return {
        title: 'เกิดข้อผิดพลาด',
        message: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง',
      }
    }

    default:
      return {
        title: 'เกิดข้อผิดพลาด',
        message: 'กรุณาลองใหม่อีกครั้ง',
      }
  }
}
