import { useState, useRef, useMemo, useEffect } from 'react';
import { 
  FileText, 
  UploadCloud, 
  CheckCircle2, 
  ChevronRight, 
  ChevronLeft, 
  X, 
  AlertCircle, 
  Clock, 
  XCircle, 
  PlusCircle, 
  ListFilter,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  Loader2
} from 'lucide-react';
import { getPreviousApplications, submitNewApplication } from '../services/api'; // API servisleri

// TODO: İleride istenirse ERP'den kategori endpoint'i eklenebilir (/api/categories)
const categories = [
  { id: 1, title: 'Sayaç ve Okuma Hata Bildirimi', desc: 'Yanlış veya eksik okunduğunu düşündüğünüz sayaçlar için.' },
  { id: 2, title: 'Bölgeye Araç/Tır Giriş İzni', desc: 'Fabrikanız için gelecek olan lojistik araçların kayıtları.' },
  { id: 3, title: 'Altyapı ve Arıza Talebi', desc: 'Elektrik, su, doğalgaz altyapısındaki fiziksel arızalar.' },
  { id: 4, title: 'Diğer Dilekçe ve Talepler', desc: 'Genel istek ve şikayetleriniz için standart dilekçe.' },
];

export default function Basvurular() {
  const [activeMainTab, setActiveMainTab] = useState('yeni');
  const [previousApplications, setPreviousApplications] = useState([]);
  const [loading, setLoading] = useState(true);

  // Wizard State'leri
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState({
    categoryId: null,
    details: '',
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [submittedTakipNo, setSubmittedTakipNo] = useState('');
  const fileInputRef = useRef(null);

  // Sıralama State'i
  const [sortConfig, setSortConfig] = useState({ key: 'tarih', direction: 'desc' });

  // TODO: Fastify API'den geçmiş başvuruları çeker
  useEffect(() => {
    getPreviousApplications()
      .then((data) => {
        setPreviousApplications(data);
        setLoading(false);
      })
      .catch((err) => {
        console.error('Başvurular yüklenemedi:', err);
        setLoading(false);
      });
  }, []);

  const resetWizard = () => {
    setIsSuccess(false);
    setCurrentStep(1);
    setFormData({ categoryId: null, details: '', files: [] });
  };

  const handleTabSwitch = (targetTab) => {
    if (targetTab === 'yeni') {
      resetWizard();
    }
    setActiveMainTab(targetTab);
  };

  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  const parseDate = (dateStr) => {
    const [day, month, year] = dateStr.split('.');
    return new Date(`${year}-${month}-${day}`).getTime();
  };

  const sortedApplications = useMemo(() => {
    const list = [...previousApplications];
    if (sortConfig.key) {
      list.sort((a, b) => {
        let aVal = a[sortConfig.key];
        let bVal = b[sortConfig.key];

        if (sortConfig.key === 'tarih') {
          aVal = parseDate(aVal);
          bVal = parseDate(bVal);
        }

        if (typeof aVal === 'string') {
          return sortConfig.direction === 'asc' 
            ? aVal.localeCompare(bVal, 'tr') 
            : bVal.localeCompare(aVal, 'tr');
        }

        return sortConfig.direction === 'asc' ? (aVal > bVal ? 1 : -1) : (aVal < bVal ? 1 : -1);
      });
    }
    return list;
  }, [previousApplications, sortConfig]);

  const handleFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      const newFiles = Array.from(e.target.files);
      setFormData({ ...formData, files: [...formData.files, ...newFiles] });
    }
  };

  const removeFile = (indexToRemove) => {
    setFormData({
      ...formData,
      files: formData.files.filter((_, index) => index !== indexToRemove)
    });
  };

  // TODO: Fastify API'ye form verilerini post eder
  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      const res = await submitNewApplication(formData);
      setSubmittedTakipNo(res.takipNo);
      setIsSubmitting(false);
      setIsSuccess(true);
    } catch (error) {
      console.error('Başvuru gönderilemedi:', error);
      setIsSubmitting(false);
    }
  };

  const getStatusBadge = (status) => {
    switch (status) {
      case 'Onaylandı':
      case 'Tamamlandı':
        return <span className="inline-flex items-center gap-1 rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 ring-1 ring-inset ring-emerald-600/20"><CheckCircle2 className="h-3 w-3" /> {status}</span>;
      case 'İnceleniyor':
        return <span className="inline-flex items-center gap-1 rounded-full bg-blue-50 px-2.5 py-1 text-xs font-medium text-blue-700 ring-1 ring-inset ring-blue-600/20"><Clock className="h-3 w-3" /> İnceleniyor</span>;
      case 'Reddedildi':
        return <span className="inline-flex items-center gap-1 rounded-full bg-rose-50 px-2.5 py-1 text-xs font-medium text-rose-700 ring-1 ring-inset ring-rose-600/20"><XCircle className="h-3 w-3" /> Reddedildi</span>;
      default:
        return <span>{status}</span>;
    }
  };

  const renderSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) {
      return <ArrowUpDown className="h-3.5 w-3.5 text-gray-400 opacity-0 group-hover:opacity-100 transition-opacity" />;
    }
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="h-3.5 w-3.5 text-brand" /> 
      : <ArrowDown className="h-3.5 w-3.5 text-brand" />;
  };

  const renderStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Başvuru Kategorisi Seçin</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  onClick={() => setFormData({ ...formData, categoryId: cat.id })}
                  className={`cursor-pointer rounded-xl border-2 p-4 transition-all ${
                    formData.categoryId === cat.id
                      ? 'border-brand bg-brand/5'
                      : 'border-gray-200 hover:border-brand/30 hover:bg-gray-50'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <div className={`flex h-5 w-5 items-center justify-center rounded-full border-2 ${
                      formData.categoryId === cat.id ? 'border-brand' : 'border-gray-300'
                    }`}>
                       {formData.categoryId === cat.id && <div className="h-2.5 w-2.5 rounded-full bg-brand" />}
                    </div>
                    <h4 className="font-semibold text-gray-800">{cat.title}</h4>
                  </div>
                  <p className="mt-2 text-sm text-gray-500 pl-8">{cat.desc}</p>
                </div>
              ))}
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-800 mb-4">Talep Detayları</h3>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Dilekçe / Başvuru Açıklaması
              </label>
              <textarea
                rows={6}
                value={formData.details}
                onChange={(e) => setFormData({ ...formData, details: e.target.value })}
                placeholder="Talebinizi buraya detaylı olarak yazabilirsiniz..."
                className="block w-full rounded-xl border border-gray-300 bg-gray-50 p-4 text-gray-900 focus:border-brand focus:bg-white focus:outline-none focus:ring-2 focus:ring-brand/20 resize-none"
              />
            </div>
            <div className="flex items-center gap-2 text-sm text-amber-700 bg-amber-50 p-3 rounded-lg border border-amber-200/50">
               <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
               <p>Gerekli durumlarda ıslak imzalı dilekçenizi sonraki adımda dosya eki olarak yükleyebilirsiniz.</p>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-4">
             <h3 className="text-lg font-medium text-gray-800 mb-4">Evrak Yükleme (PDF, JPEG, PNG)</h3>
             
             <div 
               onClick={() => fileInputRef.current?.click()}
               className="flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed border-gray-300 bg-gray-50 py-12 transition-colors hover:border-brand hover:bg-brand/5"
             >
                <UploadCloud className="h-10 w-10 text-gray-400 mb-3" />
                <p className="text-sm font-medium text-gray-700">Evrak yüklemek için tıklayın veya sürükleyin</p>
                <p className="text-xs text-gray-500 mt-1">Desteklenen: PDF, JPEG, PNG (Maks 5MB)</p>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  className="hidden" 
                  multiple 
                  accept=".pdf,.jpg,.jpeg,.png"
                />
             </div>

             {formData.files.length > 0 && (
               <div className="mt-4 space-y-2">
                 <p className="text-sm font-medium text-gray-700">Eklenen Evraklar:</p>
                 {formData.files.map((file, index) => (
                   <div key={index} className="flex items-center justify-between rounded-lg border border-gray-200 p-3 bg-white">
                      <div className="flex items-center gap-3">
                        <FileText className="h-5 w-5 text-gray-400" />
                        <span className="text-sm font-medium text-gray-700 truncate max-w-xs">{file.name}</span>
                        <span className="text-xs text-gray-500">({(file.size / 1024 / 1024).toFixed(2)} MB)</span>
                      </div>
                      <button 
                        onClick={() => removeFile(index)}
                        className="rounded-md p-1 text-gray-400 hover:bg-red-50 hover:text-red-500"
                      >
                        <X className="h-4 w-4" />
                      </button>
                   </div>
                 ))}
               </div>
             )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="mx-auto max-w-7xl">
      <div className="mb-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Başvurular ve Dilekçeler</h1>
          <p className="text-sm text-gray-500 mt-1">Bölge müdürlüğüne yeni talep iletin veya mevcut başvurularınızı takip edin.</p>
        </div>
      </div>

      {/* Ana Sekmeler */}
      <div className="mb-8 flex space-x-2 rounded-xl bg-gray-100/80 p-1 w-full max-w-md">
        <button
          onClick={() => handleTabSwitch('yeni')}
          className={`flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeMainTab === 'yeni'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <PlusCircle className="h-4 w-4" />
          Yeni Başvuru
        </button>

        <button
          onClick={() => handleTabSwitch('gecmis')}
          className={`flex items-center justify-center gap-2 w-full rounded-lg py-2.5 text-sm font-medium transition-all ${
            activeMainTab === 'gecmis'
              ? 'bg-white text-gray-900 shadow-sm'
              : 'text-gray-500 hover:text-gray-700'
          }`}
        >
          <ListFilter className="h-4 w-4" />
          Başvuru Takip ({previousApplications.length})
        </button>
      </div>

      {/* 1. SEKME: YENİ BAŞVURU (WIZARD) */}
      {activeMainTab === 'yeni' && (
        isSuccess ? (
          <div className="mx-auto max-w-2xl text-center py-12 rounded-2xl border border-gray-200 bg-white p-8 shadow-sm">
             <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-full bg-green-100 mb-6">
                <CheckCircle2 className="h-10 w-10 text-green-600" />
             </div>
             <h2 className="text-2xl font-bold text-gray-800 mb-2">Başvurunuz Alındı!</h2>
             <p className="text-gray-500 mb-6">
               Dilekçeniz bölge müdürlüğümüze başarıyla iletildi.
               <br/>
               <span className="font-semibold text-gray-800 mt-2 inline-block">
                 Takip No: {submittedTakipNo || 'IDOSB-2026-9912'}
               </span>
             </p>
             <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
               <button 
                 onClick={resetWizard}
                 className="w-full sm:w-auto rounded-xl border border-gray-300 px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50"
               >
                 Yeni Başvuru Yap
               </button>
               <button 
                 onClick={() => {
                   resetWizard();
                   setActiveMainTab('gecmis');
                 }}
                 className="w-full sm:w-auto rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white hover:bg-brand-dark"
               >
                 Başvurularımı Gör
               </button>
             </div>
          </div>
        ) : (
          <div className="mx-auto max-w-3xl rounded-2xl border border-gray-200 bg-white p-6 shadow-sm sm:p-8">
            <div className="mb-8">
              <div className="flex items-center justify-between relative">
                <div className="absolute left-0 top-1/2 -z-10 h-0.5 w-full -translate-y-1/2 bg-gray-200"></div>
                <div 
                   className="absolute left-0 top-1/2 -z-10 h-0.5 -translate-y-1/2 bg-brand transition-all duration-500"
                   style={{ width: `${((currentStep - 1) / 2) * 100}%` }}
                ></div>
                
                {[1, 2, 3].map((step) => (
                  <div 
                    key={step}
                    className={`flex h-8 w-8 items-center justify-center rounded-full text-sm font-semibold border-2 transition-colors ${
                      currentStep === step 
                        ? 'border-brand bg-white text-brand'
                        : currentStep > step 
                          ? 'border-brand bg-brand text-white' 
                          : 'border-gray-300 bg-white text-gray-400'
                    }`}
                  >
                    {currentStep > step ? <CheckCircle2 className="h-4 w-4" /> : step}
                  </div>
                ))}
              </div>
              <div className="flex justify-between mt-2 text-xs font-medium text-gray-500 px-1">
                 <span>Kategori</span>
                 <span>Detaylar</span>
                 <span>Evrak & Onay</span>
              </div>
            </div>

            <div className="min-h-[280px]">
              {renderStep()}
            </div>

            <div className="mt-8 flex items-center justify-between border-t border-gray-100 pt-6">
               <button
                 onClick={() => setCurrentStep(currentStep - 1)}
                 disabled={currentStep === 1 || isSubmitting}
                 className="flex items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-medium text-gray-600 transition-colors hover:bg-gray-100 disabled:opacity-0"
               >
                  <ChevronLeft className="h-4 w-4" /> Geri
               </button>

               {currentStep < 3 ? (
                 <button
                   onClick={() => setCurrentStep(currentStep + 1)}
                   disabled={
                     (currentStep === 1 && !formData.categoryId) || 
                     (currentStep === 2 && formData.details.length < 10)
                   }
                   className="flex items-center gap-2 rounded-xl bg-brand px-6 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50"
                 >
                    İleri <ChevronRight className="h-4 w-4" />
                 </button>
               ) : (
                 <button
                   onClick={handleSubmit}
                   disabled={isSubmitting}
                   className="flex items-center gap-2 rounded-xl bg-brand px-8 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-70 shadow-md shadow-brand/20"
                 >
                    {isSubmitting ? 'Gönderiliyor...' : 'Başvuruyu Tamamla'}
                 </button>
               )}
            </div>
          </div>
        )
      )}

      {/* 2. SEKME: BAŞVURU TAKİP */}
      {activeMainTab === 'gecmis' && (
        <div className="overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50/50">
                <tr>
                  <th 
                    scope="col" 
                    onClick={() => handleSort('takipNo')} 
                    className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                  >
                    <div className="flex items-center gap-2">
                      Takip No
                      {renderSortIcon('takipNo')}
                    </div>
                  </th>

                  <th 
                    scope="col" 
                    onClick={() => handleSort('kategori')} 
                    className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                  >
                    <div className="flex items-center gap-2">
                      Başvuru Konusu / Kategori
                      {renderSortIcon('kategori')}
                    </div>
                  </th>

                  <th 
                    scope="col" 
                    onClick={() => handleSort('tarih')} 
                    className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                  >
                    <div className="flex items-center gap-2">
                      Başvuru Tarihi
                      {renderSortIcon('tarih')}
                    </div>
                  </th>

                  <th 
                    scope="col" 
                    onClick={() => handleSort('durum')} 
                    className="group px-6 py-4 text-left text-sm font-semibold text-gray-900 cursor-pointer select-none hover:bg-gray-100/60"
                  >
                    <div className="flex items-center gap-2">
                      Durum
                      {renderSortIcon('durum')}
                    </div>
                  </th>

                  <th scope="col" className="px-6 py-4 text-center text-sm font-semibold text-gray-900">
                    Ekler
                  </th>

                  <th scope="col" className="px-6 py-4 text-right text-sm font-semibold text-gray-900">
                    Dilekçe PDF
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100 bg-white">
                {loading ? (
                  <tr>
                    <td colSpan="6" className="py-12 text-center text-sm text-gray-500">
                      Başvurular yükleniyor...
                    </td>
                  </tr>
                ) : (
                  sortedApplications.map((app) => (
                    <tr key={app.id} className="hover:bg-gray-50/50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-gray-900">
                        {app.takipNo}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                        {app.kategori}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {app.tarih}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {getStatusBadge(app.durum)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-center text-gray-500">
                        {app.dosyaSayisi} Belge
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button className="inline-flex items-center gap-1 text-brand hover:text-brand-dark transition-colors">
                          <Download className="h-4 w-4" /> İndir
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}