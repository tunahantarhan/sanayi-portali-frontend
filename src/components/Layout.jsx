import { useState, useEffect } from 'react';
import { Outlet, NavLink } from 'react-router-dom';
import { Menu, Home, FileText, User, LogOut, X } from 'lucide-react';
import firmaLogo from '../assets/firma-logo.png';
import { tenantConfig } from '../config';

export default function Layout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 1024); // lg breakpoint
      if (window.innerWidth >= 1024) {
        setIsSidebarOpen(true);
      } else {
        setIsSidebarOpen(false);
      }
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  const closeSidebarMobile = () => {
    if (isMobile) setIsSidebarOpen(false);
  };

  return (
    <div className="flex h-screen bg-background">
      
      {/* MOBİL HEADER */}
      {isMobile && (
        <header className="fixed top-0 left-0 right-0 z-20 flex h-16 items-center justify-between bg-white px-4 shadow-sm">
          <button 
            onClick={() => setIsSidebarOpen(true)} 
            className="rounded-lg p-2 text-brand hover:bg-brand/10"
          >
            <Menu className="h-6 w-6" />
          </button>
          <img src={firmaLogo} alt={tenantConfig.name} className="h-8 w-auto object-contain" />
          <div className="w-10"></div> {/* Ortalamak için boşluk tutucu */}
        </header>
      )}

      {/* OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div 
          className="fixed inset-0 z-30 bg-black/50 backdrop-blur-sm transition-opacity"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR (Sol Menü) */}
      <aside 
        className={`fixed inset-y-0 left-0 z-40 flex w-72 flex-col bg-white shadow-xl transition-transform duration-300 ease-in-out lg:static lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-16 shrink-0 items-center justify-between border-b px-6">
          <img src={firmaLogo} alt={tenantConfig.name} className="h-10 w-auto object-contain" />
          {isMobile && (
            <button 
              onClick={() => setIsSidebarOpen(false)} 
              className="rounded-lg p-2 text-gray-500 hover:bg-gray-100"
            >
              <X className="h-6 w-6" />
            </button>
          )}
        </div>

        <nav className="flex-1 space-y-2 overflow-y-auto p-4">
          <p className="px-3 text-xs font-semibold uppercase tracking-wider text-gray-400 mb-2">
            Ana Menü
          </p>
          
          <NavLink 
            to="/panel" 
            end
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
              }`
            }
          >
            <Home className="mr-3 h-5 w-5" />
            Ana Sayfa
          </NavLink>

          <NavLink 
            to="/panel/faturalar" 
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
              }`
            }
          >
            <FileText className="mr-3 h-5 w-5" />
            Faturalar
          </NavLink>
        </nav>

        <div className="border-t p-4 space-y-2">
          {/* Firmam Sayfası */}
          <NavLink 
            to="/panel/firmam" 
            onClick={closeSidebarMobile}
            className={({ isActive }) => 
              `flex items-center rounded-xl px-4 py-3 font-medium transition-colors ${
                isActive 
                  ? 'bg-brand text-white shadow-md shadow-brand/20' 
                  : 'text-gray-600 hover:bg-brand/5 hover:text-brand'
              }`
            }
          >
            <User className="mr-3 h-5 w-5" />
            Firmam
          </NavLink>

          <button className="flex w-full items-center rounded-xl px-4 py-3 font-medium text-red-600 transition-colors hover:bg-red-50">
            <LogOut className="mr-3 h-5 w-5" />
            Çıkış Yap
          </button>
        </div>
      </aside>

      {/* Ana İçerik Alanı */}
      <main className="flex-1 overflow-x-hidden overflow-y-auto pt-16 lg:pt-0">
        <div className="p-4 md:p-8">
          <Outlet /> {/* TODO: React Router'dan gelen alt sayfalar burada render edilecek */}
        </div>
      </main>
    </div>
  );
}