'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'
import { Mail, Lock, Eye, EyeOff, User, Loader2, CheckCircle2 } from 'lucide-react'
import { loginAction, signupAction } from '@/lib/actions'

type Tab = 'login' | 'signup'
type FieldError = Partial<Record<'name' | 'email' | 'password' | 'general', string>>

const PP = "'Poppins', sans-serif"

export default function LoginPage() {
  const router = useRouter()
  const [isPending, startTransition] = useTransition()
  const [tab, setTab] = useState<Tab>('login')
  const [showPassword, setShowPassword] = useState(false)
  const [fieldErrors, setFieldErrors] = useState<FieldError>({})
  const [successMsg, setSuccessMsg] = useState('')
  const [focusedField, setFocusedField] = useState<string | null>(null)
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  const resetState = () => {
    setFieldErrors({})
    setSuccessMsg('')
    setName('')
    setEmail('')
    setPassword('')
    setShowPassword(false)
    setFocusedField(null)
  }

  const handleTabSwitch = (t: Tab) => { setTab(t); resetState() }

  const handleSubmit = () => {
    setFieldErrors({})
    setSuccessMsg('')
    const fd = new FormData()
    fd.append('email', email)
    fd.append('password', password)
    if (tab === 'signup') fd.append('name', name)

    startTransition(async () => {
      const result = tab === 'login' ? await loginAction(fd) : await signupAction(fd)
      if (result.success) {
        setSuccessMsg(tab === 'login' ? 'Welcome back!' : 'Account created! Redirecting…')
        setTimeout(() => router.push('/dashboard'), 800)
      } else {
        if (result.field && result.field !== 'general') {
          setFieldErrors({ [result.field]: result.message })
        } else {
          setFieldErrors({ general: result.message })
        }
      }
    })
  }

  const handleKeyDown = (e: React.KeyboardEvent) => { if (e.key === 'Enter') handleSubmit() }

  const getInputStyle = (fieldName: string, hasError: boolean): React.CSSProperties => ({
    width: '100%',
    fontFamily: PP,
    fontSize: '13px',
    background: '#faf8f3',
    borderWidth: '1.5px',
    borderStyle: 'solid',
    borderColor: hasError ? '#dc2626' : focusedField === fieldName ? '#4f6d35' : '#ddd8c8',
    borderRadius: '12px',
    outline: 'none',
    color: '#1a1a14',
    boxShadow: hasError
      ? '0 0 0 3px rgba(220,38,38,0.1)'
      : focusedField === fieldName
      ? '0 0 0 3px rgba(79,109,53,0.12)'
      : 'none',
    transition: 'border-color 0.15s, box-shadow 0.15s',
    padding: '13px 16px 13px 40px',
  })

  return (
    <div className="min-h-screen flex flex-col"
      style={{ background: 'linear-gradient(160deg, #f0ede0 0%, #e8e4d2 50%, #f0ede0 100%)', fontFamily: PP }}>

      <div className="w-full h-1.5"
        style={{ background: 'linear-gradient(90deg, #3d5429, #6b8f4a, #adc491, #6b8f4a, #3d5429)' }} />

      <div className="flex-1 flex flex-col items-center justify-center px-5 py-16">

        {/* Logo */}
        <div className="mb-10 text-center animate-fade-in">
          <h1 className="mb-2"
            style={{ fontFamily: "'Rammetto One', cursive", fontSize: '3.5rem', color: '#1a1a14', lineHeight: 1.1 }}>
            Chillo
          </h1>
        </div>

        {/* Card */}
        <div className="w-full max-w-md animate-slide-up"
          style={{ background: 'white', borderRadius: '20px', borderWidth: '1px', borderStyle: 'solid', borderColor: '#e4dfc8', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', overflow: 'hidden' }}>

          {/* Tabs */}
          <div className="flex" style={{ borderBottomWidth: '1px', borderBottomStyle: 'solid', borderBottomColor: '#ede9d8' }}>
            {(['login', 'signup'] as Tab[]).map((t) => (
              <button key={t} onClick={() => handleTabSwitch(t)}
                className="flex-1 py-4 relative transition-all"
                style={{ fontFamily: PP, fontSize: '14px', fontWeight: tab === t ? 600 : 400, color: tab === t ? '#1a1a14' : '#9a9080', background: tab === t ? 'white' : '#faf8f3' }}>
                {t === 'login' ? 'Log In' : 'Sign Up'}
                {tab === t && <span className="absolute bottom-0 left-6 right-6 h-0.5 rounded-full" style={{ background: '#3d5429' }} />}
              </button>
            ))}
          </div>

          {/* Form body */}
          <div className="px-8 pt-7 pb-8">

            {successMsg && (
              <div className="flex items-center gap-2.5 px-4 py-3 rounded-xl mb-5 animate-fade-in"
                style={{ background: '#e6eddc', color: '#2d4a1a', fontSize: '13px', fontWeight: 500, fontFamily: PP }}>
                <CheckCircle2 size={16} />{successMsg}
              </div>
            )}

            {fieldErrors.general && (
              <div className="px-4 py-3 rounded-xl mb-5 animate-fade-in"
                style={{ background: '#fff1f0', color: '#dc2626', fontSize: '13px', fontFamily: PP, borderWidth: '1px', borderStyle: 'solid', borderColor: '#fecaca' }}>
                {fieldErrors.general}
              </div>
            )}

            <div className="space-y-5">

              {/* Name */}
              {tab === 'signup' && (
                <div>
                  <label className="block mb-2"
                    style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>
                    FULL NAME
                  </label>
                  <div className="relative">
                    <User size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9a9080' }} />
                    <input type="text" placeholder="Your full name" value={name}
                      onChange={(e) => setName(e.target.value)}
                      onKeyDown={handleKeyDown}
                      onFocus={() => setFocusedField('name')}
                      onBlur={() => setFocusedField(null)}
                      disabled={isPending}
                      style={getInputStyle('name', !!fieldErrors.name)} />
                  </div>
                  {fieldErrors.name && <p className="mt-1.5" style={{ fontSize: '12px', color: '#dc2626', fontFamily: PP }}>{fieldErrors.name}</p>}
                </div>
              )}

              {/* Email */}
              <div>
                <label className="block mb-2"
                  style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>
                  EMAIL ADDRESS
                </label>
                <div className="relative">
                  <Mail size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9a9080' }} />
                  <input type="email" placeholder="you@example.com" value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedField('email')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    autoComplete="email"
                    style={getInputStyle('email', !!fieldErrors.email)} />
                </div>
                {fieldErrors.email && <p className="mt-1.5" style={{ fontSize: '12px', color: '#dc2626', fontFamily: PP }}>{fieldErrors.email}</p>}
              </div>

              {/* Password */}
              <div>
                <div className="flex justify-between items-center mb-2">
                  <label style={{ fontFamily: PP, fontSize: '11px', fontWeight: 600, color: '#5a5040', letterSpacing: '0.06em' }}>
                    PASSWORD
                  </label>
                  {tab === 'login' && (
                    <button type="button" className="hover:underline"
                      style={{ fontFamily: PP, fontSize: '12px', fontWeight: 500, color: '#4f6d35' }}>
                      Forgot password?
                    </button>
                  )}
                </div>
                <div className="relative">
                  <Lock size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none" style={{ color: '#9a9080' }} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Min. 6 characters"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onKeyDown={handleKeyDown}
                    onFocus={() => setFocusedField('password')}
                    onBlur={() => setFocusedField(null)}
                    disabled={isPending}
                    autoComplete={tab === 'login' ? 'current-password' : 'new-password'}
                    style={{ ...getInputStyle('password', !!fieldErrors.password), paddingRight: '44px' }} />
                  <button type="button" onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 hover:opacity-70 transition-opacity"
                    style={{ color: '#9a9080' }}>
                    {showPassword ? <EyeOff size={15} /> : <Eye size={15} />}
                  </button>
                </div>
                {fieldErrors.password
                  ? <p className="mt-1.5" style={{ fontSize: '12px', color: '#dc2626', fontFamily: PP }}>{fieldErrors.password}</p>
                  : tab === 'signup'
                  ? <p className="mt-1.5" style={{ fontSize: '12px', color: '#9a9080', fontFamily: PP }}>Must be at least 6 characters.</p>
                  : null}
              </div>
            </div>

            {/* Submit */}
            <button onClick={handleSubmit} disabled={isPending}
              className="w-full py-3.5 rounded-xl text-white mt-7 flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-[0.99] disabled:opacity-60 disabled:cursor-not-allowed"
              style={{ background: '#3d5429', fontFamily: PP, fontSize: '14px', fontWeight: 600 }}>
              {isPending
                ? <><Loader2 size={15} className="animate-spin" />{tab === 'login' ? 'Logging in…' : 'Creating account…'}</>
                : tab === 'login' ? 'Log In' : 'Create Account'}
            </button>

            {/* Switch tab */}
            <p className="text-center mt-5" style={{ fontFamily: PP, fontSize: '13px', color: '#9a9080' }}>
              {tab === 'login' ? "Don't have an account? " : 'Already have an account? '}
              <button onClick={() => handleTabSwitch(tab === 'login' ? 'signup' : 'login')}
                className="hover:underline" style={{ fontFamily: PP, fontWeight: 600, color: '#3d5429' }}>
                {tab === 'login' ? 'Sign up free' : 'Log in'}
              </button>
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
