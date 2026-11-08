import { useState, useEffect } from 'react';
import {
  Lock,
  ArrowRight,
  ShieldCheck,
  RefreshCw,
  AlertCircle,
  Loader2,
  ArrowLeft,
  Phone,
  Mail,
} from 'lucide-react';
import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { tenantConfig } from '../config';
import { useAuth } from '../auth/AuthContext';
import { login, verifyCode, resendCode } from '../services/api';
import { USE_MOCK } from '../services/http';
import Modal from '../components/ui/Modal';

const formatTime = (seconds) => {
  const m = Math.floor(seconds / 60)
    .toString()
    .padStart(2, '0');
  const s = (seconds % 60).toString().padStart(2, '0');
  return `${m}:${s}`;
};

const CHANNEL_LABELS = { sms: 'telefonunuza SMS', eposta: 'e-posta adresinize' };

export default function Login() {
  const { status, signIn } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [step, setStep] = useState(1);
  const [taxNumber, setTaxNumber] = useState('');
  const [password, setPassword] = useState('');
  const [otpCode, setOtpCode] = useState('');
  const [delivery, setDelivery] = useState(null); // { kanal, hedef, gecerlilikSn }
  const [expiresAt, setExpiresAt] = useState(0);
  const [timeLeft, setTimeLeft] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [showForgot, setShowForgot] = useState(false);

  // Kalan süre, kodun gönderildiği andan hesaplanır (sekme arka plandayken de doğru kalır)
  useEffect(() => {
    if (step !== 2) return;
    const tick = () => setTimeLeft(Math.max(0, Math.ceil((expiresAt - Date.now()) / 1000)));
    const timer = setInterval(tick, 1000);
    tick();
    return () => clearInterval(timer);
  }, [step, expiresAt]);

  if (status === 'authenticated') {
    return <Navigate to={location.state?.from || '/panel'} replace />;
  }

  const startCountdown = (info) => {
    setDelivery(info);
    setExpiresAt(Date.now() + (info?.gecerlilikSn || tenantConfig.otpDurationSec) * 1000);
  };

  const handleFirstStepSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      const info = await login(taxNumber, password);
      startCountdown(info);
      setOtpCode('');
      setStep(2);
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleVerifySubmit = async (e) => {
    e.preventDefault();
    if (otpCode.length !== 6) return;
    setError('');
    setSubmitting(true);
    try {
      const { firma } = await verifyCode(otpCode);
      signIn(firma);
      navigate(location.state?.from || '/panel', { replace: true });
    } catch (err) {
      setError(err.message);
      setOtpCode('');
      // Bekleyen giriş düştüyse ilk adıma dön
      if (err.code === 'NO_PENDING_LOGIN') setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const handleResend = async () => {
    setError('');
    setSubmitting(true);
    try {
      startCountdown(await resendCode());
      setOtpCode('');
    } catch (err) {
      setError(err.message);
      if (err.code === 'NO_PENDING_LOGIN') setStep(1);
    } finally {
      setSubmitting(false);
    }
  };

  const backToFirstStep = () => {
    setStep(1);
    setOtpCode('');
    setError('');
  };

  return (
    <div className='flex min-h-screen items-center justify-center bg-background p-4'>
      <div className='w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl'>
        <div className='bg-brand px-6 py-8 text-center text-white'>
          <img
            src={tenantConfig.logo}
            alt={tenantConfig.name}
            className='mx-auto mb-4 h-16 w-auto brightness-0 invert'
          />
          <h1 className='text-xl font-medium tracking-wide text-white/90'>
            {tenantConfig.fullName}
          </h1>
          <p className='mt-1 text-sm text-white/70'>Sanayici Portalı</p>
        </div>

        <div className='px-8 py-10'>
          {error && (
            <div
              role='alert'
              className='mb-6 flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'
            >
              <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
              <span>{error}</span>
            </div>
          )}

          {step === 1 ? (
            <form onSubmit={handleFirstStepSubmit} className='space-y-6'>
              <div>
                <label htmlFor='vergiNo' className='mb-1 block text-sm font-medium text-gray-700'>
                  Vergi Numarası
                </label>
                <input
                  id='vergiNo'
                  type='text'
                  inputMode='numeric'
                  autoComplete='username'
                  required
                  maxLength='11' // T.C. Kimlik No ihtimaline karşı 11 hane
                  minLength='10'
                  value={taxNumber}
                  onChange={(e) => setTaxNumber(e.target.value.replace(/[^0-9]/g, ''))}
                  placeholder='10 haneli vergi numaranız'
                  className='block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
                />
              </div>

              <div>
                <label htmlFor='sifre' className='mb-1 block text-sm font-medium text-gray-700'>
                  Şifre
                </label>
                <div className='relative'>
                  <div className='pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3'>
                    <Lock className='h-5 w-5 text-gray-400' />
                  </div>
                  <input
                    id='sifre'
                    type='password'
                    autoComplete='current-password'
                    required
                    minLength='8'
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder='••••••••'
                    className='block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
                  />
                </div>
                <div className='mt-2 text-right'>
                  <button
                    type='button'
                    onClick={() => setShowForgot(true)}
                    className='text-sm font-medium text-brand hover:underline'
                  >
                    Şifremi Unuttum
                  </button>
                </div>
              </div>

              <button
                type='submit'
                disabled={submitting || taxNumber.length < 10 || password.length < 8}
                className='group flex w-full items-center justify-center rounded-lg bg-brand p-3 font-semibold text-white transition-all hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:cursor-not-allowed disabled:opacity-50'
              >
                {submitting ? (
                  <Loader2 className='h-5 w-5 animate-spin' />
                ) : (
                  <>
                    Giriş Yap
                    <ArrowRight className='ml-2 h-5 w-5 transition-transform group-hover:translate-x-1' />
                  </>
                )}
              </button>

              {USE_MOCK && (
                <p className='rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-800'>
                  Demo modu: 10 haneli herhangi bir vergi numarası ve en az 8 karakterli şifreyle
                  giriş yapılabilir.
                </p>
              )}
            </form>
          ) : (
            <form onSubmit={handleVerifySubmit} className='space-y-6'>
              <div className='text-center'>
                <ShieldCheck className='mx-auto mb-2 h-12 w-12 text-brand' />
                <h2 className='text-lg font-semibold text-gray-800'>Doğrulama Kodu</h2>
                <p className='mt-1 text-sm text-gray-600'>
                  {delivery?.hedef ? (
                    <>
                      <strong>{delivery.hedef}</strong>{' '}
                      {CHANNEL_LABELS[delivery.kanal] || 'adresinize'} gönderilen 6 haneli kodu
                      giriniz.
                    </>
                  ) : (
                    'SMS veya e-posta ile gelen 6 haneli kodu giriniz.'
                  )}
                </p>
              </div>

              <input
                type='text'
                inputMode='numeric'
                autoComplete='one-time-code'
                aria-label='Doğrulama kodu'
                maxLength='6'
                minLength='6'
                required
                autoFocus
                value={otpCode}
                onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))}
                placeholder='000000'
                className='block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-center text-3xl tracking-[1em] text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
              />

              <div className='flex items-center justify-between text-sm'>
                <span className='font-medium text-gray-600'>Kalan Süre:</span>
                <span className={`font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-brand'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type='submit'
                disabled={submitting || timeLeft === 0 || otpCode.length < 6}
                className='flex w-full items-center justify-center rounded-lg bg-brand p-3 font-semibold text-white transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50'
              >
                {submitting ? <Loader2 className='h-5 w-5 animate-spin' /> : 'Kodu Doğrula'}
              </button>

              <div className='flex items-center justify-between'>
                <button
                  type='button'
                  onClick={backToFirstStep}
                  className='inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand'
                >
                  <ArrowLeft className='mr-1.5 h-4 w-4' /> Geri
                </button>
                <button
                  type='button'
                  onClick={handleResend}
                  disabled={submitting || timeLeft > 0}
                  className='inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand disabled:opacity-50 disabled:hover:text-gray-500'
                >
                  <RefreshCw className='mr-2 h-4 w-4' />
                  Kodu Tekrar Gönder
                </button>
              </div>

              {USE_MOCK && (
                <p className='rounded-lg bg-amber-50 p-3 text-center text-xs text-amber-800'>
                  Demo modu: 6 haneli herhangi bir kod geçerlidir. 000000 hatalı kod örneğidir.
                </p>
              )}
            </form>
          )}
        </div>
      </div>

      {showForgot && (
        <Modal
          title='Şifremi Unuttum'
          subtitle='Şifre talebi ve yenileme'
          onClose={() => setShowForgot(false)}
          footer={
            <button
              onClick={() => setShowForgot(false)}
              className='rounded-xl bg-brand px-5 py-2 text-xs font-semibold text-white hover:bg-brand-dark'
            >
              Tamam
            </button>
          }
        >
          <div className='space-y-4 p-6 text-sm text-gray-700'>
            <p>
              Portal şifrenizi almak veya yenilemek için {tenantConfig.fullName} Bölge Müdürlüğü ile
              iletişime geçiniz.
            </p>
            <div className='space-y-2 rounded-xl border border-gray-100 bg-gray-50 p-4 text-xs'>
              <p className='flex items-center gap-2'>
                <Phone className='h-4 w-4 text-brand' /> {tenantConfig.contact.telefon}
              </p>
              <p className='flex items-center gap-2'>
                <Mail className='h-4 w-4 text-brand' /> {tenantConfig.contact.eposta}
              </p>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
}
