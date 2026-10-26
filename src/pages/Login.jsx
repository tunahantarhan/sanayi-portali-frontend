import { useState, useEffect } from 'react';
import { Lock, ArrowRight, ShieldCheck, RefreshCw } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { tenantConfig } from '../config'; // TODO: config dosyasını import ettik
import firmaLogo from '../assets/firma-logo.png'; 

export default function Login() {
  const [step, setStep] = useState(1);
  const [timeLeft, setTimeLeft] = useState(120); 
  const [otpCode, setOtpCode] = useState('');
  const [taxNumber, setTaxNumber] = useState('');
  const [password, setPassword] = useState('');

  const navigate = useNavigate();

  useEffect(() => {
    if (step === 2 && timeLeft > 0) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [step, timeLeft]);

  const handleFirstStepSubmit = (e) => {
    e.preventDefault();
    setStep(2);
  };

  const handleLoginSubmit = (e) => {
    e.preventDefault();
    if (otpCode.length === 6) {
      // TODO : İleride React Router ile direkt yönlendirme yapılacak. (örn: navigate('/dashboard'))
      console.log('Giriş başarılı, yönlendiriliyor...'); 
      navigate('/panel'); // Şimdilik /panel'e yönlendiriyoruz
    }
  };

  const formatTime = (seconds) => {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0');
    const s = (seconds % 60).toString().padStart(2, '0');
    return `${m}:${s}`;
  };

  // Sadece rakam girişine izin veren fonksiyon (Vergi numarası için)
  const handleTaxNumberChange = (e) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    setTaxNumber(value);
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <div className="w-full max-w-md overflow-hidden rounded-2xl bg-white shadow-xl">
        <div className="bg-brand px-6 py-8 text-center text-white">
          <img 
            src={firmaLogo} 
            alt={tenantConfig.name} 
            className="mx-auto mb-4 h-16 w-auto brightness-0 invert" 
          />
          {/* TODO: config dosyasından çekiyoruz */}
          <h1 className="text-xl font-medium tracking-wide text-white/90">{tenantConfig.fullName}</h1> 
        </div>

        <div className="px-8 py-10">
          {step === 1 ? (
            <form onSubmit={handleFirstStepSubmit} className="space-y-6">
              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">
                  Vergi Numarası
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    maxLength="11" // T.C. Kimlik No ihtimaline karşı 11 hane
                    minLength="10" // Minimum 10 hane
                    value={taxNumber}
                    onChange={handleTaxNumberChange}
                    placeholder="Örn: 4810090571" // Sabit placeholder
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium text-gray-700">Şifre</label>
                <div className="relative">
                  <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3">
                    <Lock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    required
                    minLength="8" // min. karakter sayısı
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-3 pl-10 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="mt-2 text-right">
                  <a href="#" className="text-sm font-medium text-brand hover:underline">
                    Şifremi Unuttum
                  </a>
                </div>
              </div>

              <button
                type="submit"
                // Gerekli uzunluklara ulaşılmadan buton disabled
                disabled={taxNumber.length < 10 || password.length < 8} 
                className="group flex w-full items-center justify-center rounded-lg bg-brand p-3 font-semibold text-white transition-all hover:bg-brand-dark focus:outline-none focus:ring-4 focus:ring-brand/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Giriş Yap
                <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-1" />
              </button>
            </form>
          ) : (
            <form onSubmit={handleLoginSubmit} className="space-y-6">
              <div className="text-center">
                <ShieldCheck className="mx-auto mb-2 h-12 w-12 text-brand" />
                <h2 className="text-lg font-semibold text-gray-800">Doğrulama Kodu</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Lütfen e-posta/SMS kutunuza gelen 6 haneli kodu giriniz.
                </p>
              </div>

              <div>
                <input
                  type="text"
                  maxLength="6"
                  minLength="6"
                  required
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.replace(/[^0-9]/g, ''))} 
                  placeholder="000000"
                  className="block w-full rounded-lg border border-gray-300 bg-gray-50 p-4 text-center text-3xl tracking-[1em] text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="flex items-center justify-between text-sm">
                <span className="font-medium text-gray-600">Kalan Süre:</span>
                <span className={`font-bold ${timeLeft < 30 ? 'text-red-500' : 'text-brand'}`}>
                  {formatTime(timeLeft)}
                </span>
              </div>

              <button
                type="submit"
                // Süre bittiğinde VEYA kod 6 haneli olmadığında buton disabled
                disabled={timeLeft === 0 || otpCode.length < 6}
                className="w-full rounded-lg bg-brand p-3 font-semibold text-white transition-all hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
              >
                Kodu Doğrula
              </button>

              <div className="text-center">
                <button
                  type="button"
                  onClick={() => setTimeLeft(120)}
                  disabled={timeLeft > 0}
                  className="inline-flex items-center text-sm font-medium text-gray-500 transition-colors hover:text-brand disabled:opacity-50 disabled:hover:text-gray-500"
                >
                  <RefreshCw className="mr-2 h-4 w-4" />
                  Kodu Tekrar Gönder
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}