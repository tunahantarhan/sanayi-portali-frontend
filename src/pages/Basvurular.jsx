import { useState, useRef, useMemo } from 'react';
import {
  FileText,
  UploadCloud,
  CheckCircle2,
  ChevronRight,
  ChevronLeft,
  ChevronDown,
  X,
  AlertCircle,
  Clock,
  PlusCircle,
  ListFilter,
  Loader2,
  Search,
  Building2,
  User,
  Star,
} from 'lucide-react';
import { getApplicationTypes, getApplications, submitApplication, fileUrls } from '../services/api';
import { tenantConfig } from '../config';
import useApi from '../hooks/useApi';
import SortableTh from '../components/ui/SortableTh';
import FileLink from '../components/ui/FileLink';
import { ErrorState, LoadingState } from '../components/ui/PageState';
import { formatDate, formatFileSize, toTimestamp } from '../utils/format';
import { sortList, nextSort } from '../utils/sort';

// Dosya kuralları (backend de aynı kuralları uygular)
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const MAX_FILES = 10;
const ALLOWED_EXTENSIONS = ['pdf', 'jpg', 'jpeg', 'png'];

const STATUS = {
  islemde: {
    label: 'İşlemde',
    icon: Clock,
    className: 'bg-blue-50 text-blue-700 ring-blue-600/20',
  },
  kapali: {
    label: 'Kapalı',
    icon: CheckCircle2,
    className: 'bg-gray-100 text-gray-700 ring-gray-500/20',
  },
};

const SORTERS = {
  evrakNo: (a) => a.evrakNo,
  evrakTipi: (a) => a.evrakTipi,
  tarih: (a) => toTimestamp(a.tarih),
  durum: (a) => a.durum,
  acan: (a) => a.acan,
};

const EMPTY_FORM = { turId: null, konu: '', detay: '', files: [] };
const STEPS = ['Başvuru Türü', 'Detaylar', 'Evrak & Onay'];

function StatusBadge({ status }) {
  const s = STATUS[status];
  if (!s) return <span className='text-sm text-gray-500'>{status}</span>;
  const Icon = s.icon;
  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium ring-1 ring-inset ${s.className}`}
    >
      <Icon className='h-3 w-3' /> {s.label}
    </span>
  );
}

function TypeOption({ type, selected, onSelect }) {
  return (
    <button
      type='button'
      onClick={() => onSelect(type.id)}
      className={`w-full rounded-xl border-2 p-4 text-left transition-all ${
        selected ? 'border-brand bg-brand/5' : 'border-gray-200 hover:border-brand/30 hover:bg-gray-50'
      }`}
    >
      <div className='flex items-center gap-3'>
        <div
          className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 ${
            selected ? 'border-brand' : 'border-gray-300'
          }`}
        >
          {selected && <div className='h-2.5 w-2.5 rounded-full bg-brand' />}
        </div>
        <h4 className='font-semibold text-gray-800'>{type.ad}</h4>
      </div>
      {type.aciklama && <p className='mt-2 pl-8 text-sm text-gray-500'>{type.aciklama}</p>}
    </button>
  );
}

function FileList({ files, applicationId }) {
  if (!files || files.length === 0) return <span className='text-xs text-gray-400'>—</span>;
  return (
    <div className='flex flex-col items-start gap-1'>
      {files.map((f) => (
        <FileLink
          key={f.id}
          url={fileUrls.applicationFile(applicationId, f.id)}
          label={f.ad}
          fileName={f.ad}
          className='max-w-[180px] text-xs'
        />
      ))}
    </div>
  );
}

export default function Basvurular() {
  const types = useApi(getApplicationTypes);
  const applications = useApi(getApplications);

  const [activeMainTab, setActiveMainTab] = useState('yeni');

  // Sihirbaz
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState(EMPTY_FORM);
  const [showAllTypes, setShowAllTypes] = useState(false);
  const [typeQuery, setTypeQuery] = useState('');
  const [fileErrors, setFileErrors] = useState([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState('');
  const [submittedEvrakNo, setSubmittedEvrakNo] = useState(null);
  const fileInputRef = useRef(null);

  // Takip
  const [sortConfig, setSortConfig] = useState({ key: 'tarih', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('tumu');

  const typeList = useMemo(() => types.data || [], [types.data]);
  const { popularTypes, otherTypes } = useMemo(() => {
    const flagged = typeList.filter((t) => t.sik);
    const popular = (flagged.length ? flagged : typeList).slice(
      0,
      tenantConfig.popularApplicationTypeCount
    );
    const popularIds = new Set(popular.map((t) => t.id));
    return { popularTypes: popular, otherTypes: typeList.filter((t) => !popularIds.has(t.id)) };
  }, [typeList]);

  const filteredOtherTypes = useMemo(() => {
    const q = typeQuery.trim().toLocaleLowerCase('tr');
    if (!q) return otherTypes;
    return otherTypes.filter(
      (t) =>
        t.ad.toLocaleLowerCase('tr').includes(q) ||
        (t.aciklama || '').toLocaleLowerCase('tr').includes(q)
    );
  }, [otherTypes, typeQuery]);

  const selectedType = typeList.find((t) => t.id === formData.turId);
  const selectedIsOther = otherTypes.some((t) => t.id === formData.turId);

  const appList = useMemo(() => applications.data || [], [applications.data]);
  const visibleApplications = useMemo(() => {
    const filtered =
      statusFilter === 'tumu' ? appList : appList.filter((a) => a.durum === statusFilter);
    return sortList(filtered, SORTERS, sortConfig);
  }, [appList, statusFilter, sortConfig]);

  const counts = useMemo(
    () => ({
      tumu: appList.length,
      islemde: appList.filter((a) => a.durum === 'islemde').length,
      kapali: appList.filter((a) => a.durum === 'kapali').length,
    }),
    [appList]
  );

  const resetWizard = () => {
    setSubmittedEvrakNo(null);
    setCurrentStep(1);
    setFormData(EMPTY_FORM);
    setFileErrors([]);
    setSubmitError('');
    setTypeQuery('');
    setShowAllTypes(false);
  };

  const handleTabSwitch = (targetTab) => {
    if (targetTab === 'yeni' && submittedEvrakNo) resetWizard();
    setActiveMainTab(targetTab);
  };

  const addFiles = (fileList) => {
    const incoming = Array.from(fileList || []);
    const errors = [];
    const accepted = [];
    incoming.forEach((file) => {
      const ext = file.name.split('.').pop().toLowerCase();
      if (!ALLOWED_EXTENSIONS.includes(ext)) {
        errors.push(`${file.name}: Yalnızca PDF, JPEG ve PNG dosyaları yüklenebilir.`);
      } else if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: Dosya boyutu 5 MB'ı aşamaz.`);
      } else if (formData.files.some((f) => f.name === file.name && f.size === file.size)) {
        errors.push(`${file.name}: Bu dosya zaten eklendi.`);
      } else {
        accepted.push(file);
      }
    });
    const room = MAX_FILES - formData.files.length;
    if (accepted.length > room) {
      errors.push(`En fazla ${MAX_FILES} dosya yüklenebilir.`);
      accepted.splice(room);
    }
    setFileErrors(errors);
    if (accepted.length) setFormData((prev) => ({ ...prev, files: [...prev.files, ...accepted] }));
  };

  const removeFile = (indexToRemove) => {
    setFormData((prev) => ({ ...prev, files: prev.files.filter((_, i) => i !== indexToRemove) }));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setSubmitError('');
    try {
      const res = await submitApplication({
        turId: formData.turId,
        konu: formData.konu.trim(),
        detay: formData.detay.trim(),
        files: formData.files,
      });
      setSubmittedEvrakNo(res.evrakNo ?? res.id);
      applications.reload();
    } catch (error) {
      setSubmitError(error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed =
    (currentStep === 1 && formData.turId) ||
    (currentStep === 2 && formData.konu.trim().length >= 3 && formData.detay.trim().length >= 10);

  const renderStep = () => {
    if (currentStep === 1) {
      if (types.loading) return <LoadingState text='Başvuru türleri yükleniyor...' className='h-64' />;
      if (types.error) return <ErrorState error={types.error} onRetry={types.reload} />;
      return (
        <div className='space-y-4'>
          <h3 className='mb-2 text-lg font-medium text-gray-800'>Başvuru Türünü Seçin</h3>
          <p className='flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide text-gray-400'>
            <Star className='h-3.5 w-3.5' /> En çok kullanılanlar
          </p>
          <div className='grid grid-cols-1 gap-4 md:grid-cols-2'>
            {popularTypes.map((type) => (
              <TypeOption
                key={type.id}
                type={type}
                selected={formData.turId === type.id}
                onSelect={(id) => setFormData({ ...formData, turId: id })}
              />
            ))}
          </div>

          {otherTypes.length > 0 && (
            <div className='rounded-xl border border-gray-200'>
              <button
                type='button'
                onClick={() => setShowAllTypes((v) => !v)}
                aria-expanded={showAllTypes || selectedIsOther}
                className='flex w-full items-center justify-between px-4 py-3 text-sm font-semibold text-gray-700 hover:bg-gray-50'
              >
                <span>
                  Diğer başvuru türleri ({otherTypes.length})
                  {selectedIsOther && !showAllTypes && (
                    <span className='ml-2 font-normal text-brand'>· {selectedType?.ad}</span>
                  )}
                </span>
                <ChevronDown
                  className={`h-4 w-4 transition-transform ${showAllTypes ? 'rotate-180' : ''}`}
                />
              </button>
              {showAllTypes && (
                <div className='space-y-3 border-t border-gray-100 p-4'>
                  <div className='flex items-center rounded-lg border border-gray-300 bg-gray-50 px-3 py-2 focus-within:border-brand focus-within:bg-white'>
                    <Search className='h-4 w-4 shrink-0 text-gray-400' />
                    <input
                      type='text'
                      value={typeQuery}
                      onChange={(e) => setTypeQuery(e.target.value)}
                      placeholder='Başvuru türü ara...'
                      className='ml-2 w-full bg-transparent text-sm outline-none'
                    />
                  </div>
                  <div className='grid max-h-80 grid-cols-1 gap-3 overflow-y-auto pr-1 md:grid-cols-2'>
                    {filteredOtherTypes.length === 0 ? (
                      <p className='py-4 text-sm text-gray-500'>Sonuç bulunamadı.</p>
                    ) : (
                      filteredOtherTypes.map((type) => (
                        <TypeOption
                          key={type.id}
                          type={type}
                          selected={formData.turId === type.id}
                          onSelect={(id) => setFormData({ ...formData, turId: id })}
                        />
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      );
    }

    if (currentStep === 2) {
      return (
        <div className='space-y-4'>
          <h3 className='mb-4 text-lg font-medium text-gray-800'>Talep Detayları</h3>
          <div className='rounded-lg bg-gray-50 px-4 py-2 text-sm text-gray-600'>
            Başvuru türü: <strong className='text-gray-800'>{selectedType?.ad}</strong>
          </div>
          <div>
            <label htmlFor='konu' className='mb-2 block text-sm font-medium text-gray-700'>
              Konu
            </label>
            <input
              id='konu'
              type='text'
              maxLength={200}
              value={formData.konu}
              onChange={(e) => setFormData({ ...formData, konu: e.target.value })}
              placeholder='Başvurunuzu kısaca özetleyin'
              className='block w-full rounded-xl border border-gray-300 bg-gray-50 p-3 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
            />
          </div>
          <div>
            <label htmlFor='detay' className='mb-2 block text-sm font-medium text-gray-700'>
              Açıklama
            </label>
            <textarea
              id='detay'
              rows={6}
              maxLength={4000}
              value={formData.detay}
              onChange={(e) => setFormData({ ...formData, detay: e.target.value })}
              placeholder='Talebinizi buraya ayrıntılı olarak yazabilirsiniz...'
              className='block w-full resize-none rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20'
            />
            <p className='mt-1 text-right text-xs text-gray-400'>{formData.detay.length} / 4000</p>
          </div>
          <div className='flex items-center gap-2 rounded-lg border border-amber-200/50 bg-amber-50 p-3 text-sm text-amber-700'>
            <AlertCircle className='h-4 w-4 shrink-0 text-amber-600' />
            <p>İmzalı dilekçenizi sonraki adımda dosya olarak yükleyebilirsiniz.</p>
          </div>
        </div>
      );
    }

    return (
      <div className='space-y-4'>
        <h3 className='mb-4 text-lg font-medium text-gray-800'>Evrak Yükleme (PDF, JPEG, PNG)</h3>

        <div
          role='button'
          tabIndex={0}
          onClick={() => fileInputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && fileInputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setIsDragging(true);
          }}
          onDragLeave={() => setIsDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setIsDragging(false);
            addFiles(e.dataTransfer.files);
          }}
          className={`flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed py-12 transition-colors ${
            isDragging
              ? 'border-brand bg-brand/5'
              : 'border-gray-300 bg-gray-50 hover:border-brand hover:bg-brand/5'
          }`}
        >
          <UploadCloud className='mb-3 h-10 w-10 text-gray-400' />
          <p className='text-sm font-medium text-gray-700'>
            Evrak yüklemek için tıklayın veya sürükleyin
          </p>
          <p className='mt-1 text-xs text-gray-500'>
            PDF, JPEG, PNG · Dosya başına en fazla 5 MB · En fazla {MAX_FILES} dosya
          </p>
          <input
            type='file'
            ref={fileInputRef}
            onChange={(e) => {
              addFiles(e.target.files);
              e.target.value = '';
            }}
            className='hidden'
            multiple
            accept='.pdf,.jpg,.jpeg,.png'
          />
        </div>

        {fileErrors.length > 0 && (
          <ul className='space-y-1 rounded-lg border border-red-200 bg-red-50 p-3 text-xs text-red-700'>
            {fileErrors.map((err) => (
              <li key={err}>{err}</li>
            ))}
          </ul>
        )}

        {formData.files.length > 0 && (
          <div className='mt-4 space-y-2'>
            <p className='text-sm font-medium text-gray-700'>Eklenen Evraklar:</p>
            {formData.files.map((file, index) => (
              <div
                key={`${file.name}-${file.size}`}
                className='flex items-center justify-between rounded-lg border border-gray-200 bg-white p-3'
              >
                <div className='flex min-w-0 items-center gap-3'>
                  <FileText className='h-5 w-5 shrink-0 text-gray-400' />
                  <span className='truncate text-sm font-medium text-gray-700'>{file.name}</span>
                  <span className='shrink-0 text-xs text-gray-500'>({formatFileSize(file.size)})</span>
                </div>
                <button
                  onClick={() => removeFile(index)}
                  aria-label={`${file.name} dosyasını kaldır`}
                  className='rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500'
                >
                  <X className='h-4 w-4' />
                </button>
              </div>
            ))}
          </div>
        )}

        <div className='rounded-xl border border-gray-100 bg-gray-50 p-4 text-sm'>
          <p className='mb-2 font-semibold text-gray-800'>Özet</p>
          <dl className='grid grid-cols-[110px_1fr] gap-y-1 text-xs'>
            <dt className='text-gray-500'>Başvuru türü</dt>
            <dd className='text-gray-800'>{selectedType?.ad}</dd>
            <dt className='text-gray-500'>Konu</dt>
            <dd className='text-gray-800'>{formData.konu}</dd>
            <dt className='text-gray-500'>Ek sayısı</dt>
            <dd className='text-gray-800'>{formData.files.length}</dd>
          </dl>
        </div>

        {submitError && (
          <div className='flex items-start gap-2 rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-700'>
            <AlertCircle className='mt-0.5 h-4 w-4 shrink-0' />
            <span>{submitError}</span>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className='mx-auto max-w-7xl'>
      <div className='mb-6'>
        <h1 className='text-2xl font-bold text-gray-800'>OSB Başvuru</h1>
        <p className='mt-1 text-sm text-gray-500'>
          Bölge müdürlüğüne yeni başvuru iletin veya başvurularınızı takip edin.
        </p>
      </div>

      <div className='mb-8 flex w-full max-w-md space-x-2 rounded-xl bg-gray-100/80 p-1'>
        <button
          onClick={() => handleTabSwitch('yeni')}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeMainTab === 'yeni' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PlusCircle className='h-4 w-4' />
          Yeni Başvuru
        </button>
        <button
          onClick={() => handleTabSwitch('takip')}
          className={`flex w-full items-center justify-center gap-2 rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeMainTab === 'takip' ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListFilter className='h-4 w-4' />
          Başvuru Takip {applications.data && `(${appList.length})`}
        </button>
      </div>

      {/* YENİ BAŞVURU */}
      {activeMainTab === 'yeni' &&
        (submittedEvrakNo ? (
          <div className='mx-auto max-w-2xl rounded-2xl border border-gray-200 bg-white p-8 py-12 text-center shadow-sm'>
            <div className='mx-auto mb-6 flex h-20 w-20 items-center justify-center rounded-full bg-green-100'>
              <CheckCircle2 className='h-10 w-10 text-green-600' />
            </div>
            <h2 className='mb-2 text-2xl font-bold text-gray-800'>Başvurunuz Alındı</h2>
            <p className='mb-6 text-gray-500'>
              Başvurunuz bölge müdürlüğümüze iletildi.
              <br />
              <span className='mt-3 inline-block rounded-lg bg-gray-100 px-4 py-2 font-semibold text-gray-800'>
                Evrak No: {submittedEvrakNo}
              </span>
            </p>
            <div className='flex flex-col items-center justify-center gap-3 sm:flex-row'>
              <button
                onClick={resetWizard}
                className='w-full rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 sm:w-auto'
              >
                Yeni Başvuru Yap
              </button>
              <button
                onClick={() => {
                  resetWizard();
                  setActiveMainTab('takip');
                }}
                className='w-full rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark sm:w-auto'
              >
                Başvurularımı Gör
              </button>
            </div>
          </div>
        ) : (
          <div className='mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8'>
            <div className='mb-8'>
              <div className='relative flex items-center justify-between'>
                <div className='absolute left-0 top-1/2 h-0.5 w-full -translate-y-1/2 bg-gray-200' />
                <div
                  className='absolute left-0 top-1/2 h-0.5 -translate-y-1/2 bg-brand transition-all duration-500'
                  style={{ width: `${((currentStep - 1) / (STEPS.length - 1)) * 100}%` }}
                />
                {STEPS.map((_, i) => {
                  const step = i + 1;
                  return (
                    <div
                      key={step}
                      className={`relative flex h-8 w-8 items-center justify-center rounded-full border-2 text-sm font-semibold transition-colors ${
                        currentStep === step
                          ? 'border-brand bg-white text-brand'
                          : currentStep > step
                            ? 'border-brand bg-brand text-white'
                            : 'border-gray-300 bg-white text-gray-400'
                      }`}
                    >
                      {currentStep > step ? <CheckCircle2 className='h-4 w-4' /> : step}
                    </div>
                  );
                })}
              </div>
              <div className='mt-2 flex justify-between px-1 text-xs font-medium text-gray-500'>
                {STEPS.map((label) => (
                  <span key={label}>{label}</span>
                ))}
              </div>
            </div>

            <div className='min-h-[280px]'>{renderStep()}</div>

            <div className='mt-8 flex items-center justify-between border-t border-gray-100 pt-6'>
              <button
                onClick={() => setCurrentStep(currentStep - 1)}
                disabled={currentStep === 1 || isSubmitting}
                className='flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-0'
              >
                <ChevronLeft className='h-4 w-4' /> Geri
              </button>

              {currentStep < STEPS.length ? (
                <button
                  onClick={() => setCurrentStep(currentStep + 1)}
                  disabled={!canProceed}
                  className='flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50'
                >
                  İleri <ChevronRight className='h-4 w-4' />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={isSubmitting || formData.files.length === 0}
                  title={formData.files.length === 0 ? 'En az bir evrak yükleyiniz' : undefined}
                  className='flex items-center gap-2 rounded-xl bg-brand px-8 py-2.5 text-sm font-medium text-white shadow-md shadow-brand/20 transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50'
                >
                  {isSubmitting && <Loader2 className='h-4 w-4 animate-spin' />}
                  {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                </button>
              )}
            </div>
          </div>
        ))}

      {/* BAŞVURU TAKİP */}
      {activeMainTab === 'takip' && (
        <>
          <div className='mb-4 flex flex-wrap gap-2'>
            {[
              { key: 'tumu', label: 'Tümü' },
              { key: 'islemde', label: 'İşlemde' },
              { key: 'kapali', label: 'Kapalı' },
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => setStatusFilter(f.key)}
                className={`rounded-full border px-3.5 py-1.5 text-xs font-semibold transition-colors ${
                  statusFilter === f.key
                    ? 'border-brand bg-brand text-white'
                    : 'border-gray-200 bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {f.label} ({counts[f.key]})
              </button>
            ))}
          </div>

          <div className='overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm'>
            {applications.error ? (
              <ErrorState error={applications.error} onRetry={applications.reload} />
            ) : (
              <div className='overflow-x-auto'>
                <table className='min-w-full divide-y divide-gray-200'>
                  <thead className='select-none bg-gray-50/50'>
                    <tr>
                      <SortableTh k='evrakNo' sortConfig={sortConfig} onSort={(k) => setSortConfig(nextSort(sortConfig, k))}>
                        Evrak No
                      </SortableTh>
                      <SortableTh k='evrakTipi' sortConfig={sortConfig} onSort={(k) => setSortConfig(nextSort(sortConfig, k))}>
                        Evrak Tipi
                      </SortableTh>
                      <SortableTh k='tarih' sortConfig={sortConfig} onSort={(k) => setSortConfig(nextSort(sortConfig, k))}>
                        Tarih
                      </SortableTh>
                      <SortableTh k='acan' sortConfig={sortConfig} onSort={(k) => setSortConfig(nextSort(sortConfig, k))}>
                        Açan
                      </SortableTh>
                      <SortableTh k='durum' sortConfig={sortConfig} onSort={(k) => setSortConfig(nextSort(sortConfig, k))}>
                        Durum
                      </SortableTh>
                      <th scope='col' className='px-6 py-4 text-left text-sm font-semibold text-gray-900'>
                        Talep PDF
                      </th>
                      <th scope='col' className='px-6 py-4 text-left text-sm font-semibold text-gray-900'>
                        Cevap PDF
                      </th>
                    </tr>
                  </thead>
                  <tbody className='divide-y divide-gray-100 bg-white'>
                    {applications.loading ? (
                      <tr>
                        <td colSpan='7' className='py-12 text-center text-sm text-gray-500'>
                          <div className='flex items-center justify-center gap-2'>
                            <Loader2 className='h-5 w-5 animate-spin text-brand' />
                            <span>Başvurular yükleniyor...</span>
                          </div>
                        </td>
                      </tr>
                    ) : visibleApplications.length === 0 ? (
                      <tr>
                        <td colSpan='7' className='py-12 text-center text-sm text-gray-500'>
                          Kayıtlı başvuru bulunmamaktadır.
                        </td>
                      </tr>
                    ) : (
                      visibleApplications.map((app) => (
                        <tr key={app.id} className='align-top transition-colors hover:bg-gray-50/50'>
                          <td className='whitespace-nowrap px-6 py-4 text-sm font-semibold text-gray-900'>
                            {app.evrakNo}
                          </td>
                          <td className='px-6 py-4 text-sm text-gray-700'>
                            <p className='font-medium'>{app.evrakTipi}</p>
                            {app.konu && <p className='mt-0.5 text-xs text-gray-500'>{app.konu}</p>}
                          </td>
                          <td className='whitespace-nowrap px-6 py-4 text-sm text-gray-500'>
                            {formatDate(app.tarih)}
                          </td>
                          <td className='whitespace-nowrap px-6 py-4 text-xs text-gray-600'>
                            {app.acan === 'osb' ? (
                              <span className='inline-flex items-center gap-1'>
                                <Building2 className='h-3.5 w-3.5 text-brand' /> {tenantConfig.name}
                              </span>
                            ) : (
                              <span className='inline-flex items-center gap-1'>
                                <User className='h-3.5 w-3.5 text-gray-400' /> Firmanız
                              </span>
                            )}
                          </td>
                          <td className='whitespace-nowrap px-6 py-4'>
                            <StatusBadge status={app.durum} />
                          </td>
                          <td className='px-6 py-4 text-sm'>
                            <FileList files={app.talepDosyalari} applicationId={app.id} />
                          </td>
                          <td className='px-6 py-4 text-sm'>
                            <FileList files={app.cevapDosyalari} applicationId={app.id} />
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
}
