const USERNAME_PATTERN = /^[A-Za-z0-9_\u4e00-\u9fff]+$/
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export const AUTH_LIMITS = {
  usernameMin: 3,
  usernameMax: 32,
  passwordMin: 6,
  passwordMax: 64,
  displayNameMax: 64,
  emailMax: 128,
}

export function createLoginRules() {
  return {
    username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
    password: [{ required: true, message: '请输入密码', trigger: 'blur' }],
  }
}

export function createRegisterRules(getPassword) {
  return {
    username: [
      { required: true, message: '请输入用户名', trigger: 'blur' },
      {
        min: AUTH_LIMITS.usernameMin,
        max: AUTH_LIMITS.usernameMax,
        message: `用户名长度需在 ${AUTH_LIMITS.usernameMin}-${AUTH_LIMITS.usernameMax} 个字符之间`,
        trigger: 'blur',
      },
      {
        pattern: USERNAME_PATTERN,
        message: '用户名仅支持中文、字母、数字和下划线',
        trigger: 'blur',
      },
    ],
    displayName: [
      {
        max: AUTH_LIMITS.displayNameMax,
        message: `昵称不能超过 ${AUTH_LIMITS.displayNameMax} 个字符`,
        trigger: 'blur',
      },
    ],
    email: [
      {
        max: AUTH_LIMITS.emailMax,
        message: `邮箱不能超过 ${AUTH_LIMITS.emailMax} 个字符`,
        trigger: 'blur',
      },
      {
        validator: (_rule, value, callback) => {
          const mail = String(value || '').trim()
          if (!mail) {
            callback()
            return
          }
          if (!EMAIL_PATTERN.test(mail)) {
            callback(new Error('邮箱格式不正确'))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
    password: [
      { required: true, message: '请输入密码', trigger: 'blur' },
      {
        min: AUTH_LIMITS.passwordMin,
        max: AUTH_LIMITS.passwordMax,
        message: `密码长度需在 ${AUTH_LIMITS.passwordMin}-${AUTH_LIMITS.passwordMax} 个字符之间`,
        trigger: 'blur',
      },
    ],
    confirmPassword: [
      { required: true, message: '请再次输入密码', trigger: 'blur' },
      {
        validator: (_rule, value, callback) => {
          const pwd = typeof getPassword === 'function' ? getPassword() : ''
          if (!value) {
            callback(new Error('请再次输入密码'))
            return
          }
          if (value !== pwd) {
            callback(new Error('两次输入的密码不一致'))
            return
          }
          callback()
        },
        trigger: 'blur',
      },
    ],
  }
}

export function buildRegisterPayload(formState) {
  return {
    username: String(formState.username || '').trim(),
    password: String(formState.password || ''),
    displayName: String(formState.displayName || '').trim(),
    email: String(formState.email || '').trim(),
  }
}
