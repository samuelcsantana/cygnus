import React, { useState, useMemo } from 'react';

// --- Interfaces (Mental Model) ---
// Screen: 'login' | 'dashboard' | 'vaccines' | 'consultations' | 'milestones' | 'new-consultation' | 'register-vaccine' | 'new-milestone' | 'add-baby'
// VaccineStatus: 'given' | 'pending' | 'overdue'

const AVAILABLE_ICONS = ['😊', '👣', '🧘', '🦷', '🍼', '🧸', '🎉', '🌟', '🗣️', '🏃'];

export default function App() {
  const [currentScreen, setCurrentScreen] = useState('login');
  
  // App Data
  const [babies, setBabies] = useState([]);
  const [vaccinesData, setVaccinesData] = useState([]);
  const [consultationsData, setConsultationsData] = useState([]);
  const [milestonesData, setMilestonesData] = useState([]);

  const getBaby = (id) => babies.find(b => b.id === id);

  const doLogin = (event) => {
    event.preventDefault();
    setCurrentScreen('dashboard');
  };

  const navigateTo = (screen) => {
    // Se não tem bebê cadastrado, força a ficar no dashboard (onboarding) ou ir pro add-baby,
    if (babies.length === 0 && screen !== 'login' && screen !== 'add-baby') {
      setCurrentScreen('dashboard');
      return;
    }

    // Voltar para listas base ao cancelar formulários
    if (screen === 'vaccines' && currentScreen === 'register-vaccine') setCurrentScreen('vaccines');
    else if (screen === 'consultations' && currentScreen === 'new-consultation') setCurrentScreen('consultations');
    else if (screen === 'milestones' && currentScreen === 'new-milestone') setCurrentScreen('milestones');
    else setCurrentScreen(screen);
  };

  const saveConsultation = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const newConsultation = {
      id: 'c_' + Date.now(),
      babyId: formData.get('babyId'),
      doctorName: formData.get('doctorName'),
      specialty: formData.get('specialty'),
      date: formData.get('date'),
      time: formData.get('time'),
      notes: formData.get('notes'),
    };

    setConsultationsData(prev => {
      const updated = [...prev, newConsultation];
      return updated.sort((a, b) => a.date.localeCompare(b.date));
    });
    navigateTo('consultations');
  };

  const saveVaccine = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    const babyId = formData.get('babyId');
    const baby = getBaby(babyId);
    
    const newVaccine = {
      id: 'v_' + Date.now(),
      babyId: babyId,
      name: formData.get('name'),
      disease: formData.get('disease'),
      dose: formData.get('dose'),
      targetMonths: baby?.monthsOld || 0,
      status: 'given',
      dateGiven: formData.get('dateGiven'),
    };

    setVaccinesData(prev => {
      const updated = [...prev, newVaccine];
      return updated.sort((a, b) => a.targetMonths - b.targetMonths);
    });
    navigateTo('vaccines');
  };

  const saveMilestone = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const newMilestone = {
      id: 'm_' + Date.now(),
      babyId: formData.get('babyId'),
      title: formData.get('title'),
      date: formData.get('date'),
      description: formData.get('description'),
      icon: formData.get('icon') || '🌟',
    };

    setMilestonesData(prev => {
      const updated = [...prev, newMilestone];
      return updated.sort((a, b) => b.date.localeCompare(a.date));
    });
    navigateTo('milestones');
  };

  const saveBaby = (event) => {
    event.preventDefault();
    const formData = new FormData(event.target);
    
    const birthDate = new Date(formData.get('birthDate'));
    const today = new Date();
    let months = (today.getFullYear() - birthDate.getFullYear()) * 12;
    months -= birthDate.getMonth();
    months += today.getMonth();
    months = months <= 0 ? 0 : months;

    const newBaby = {
      id: 'b_' + Date.now(),
      name: formData.get('name'),
      birthDate: formData.get('birthDate'),
      monthsOld: months,
      avatarUrl: `https://api.dicebear.com/7.x/avataaars/svg?seed=${formData.get('name')}&backgroundColor=${babies.length % 2 === 0 ? 'e0f2fe' : 'fce7f3'}`
    };

    setBabies(prev => [...prev, newBaby]);
    setCurrentScreen('dashboard');
  };

  const getNavClass = (screen) => {
    const isActive = currentScreen === screen || 
                    (screen === 'vaccines' && currentScreen === 'register-vaccine') ||
                    (screen === 'consultations' && currentScreen === 'new-consultation') ||
                    (screen === 'milestones' && currentScreen === 'new-milestone');
                    
    const baseClass = "flex items-center w-full px-4 py-3.5 text-sm font-bold rounded-2xl transition-all duration-300 group ";
    if (isActive) return baseClass + "bg-teal-50 text-teal-800";
    return baseClass + "text-slate-500 hover:bg-slate-50 hover:text-slate-900";
  };

  const getNavIconClass = (screen) => {
    const isActive = currentScreen === screen || 
                    (screen === 'vaccines' && currentScreen === 'register-vaccine') ||
                    (screen === 'consultations' && currentScreen === 'new-consultation') ||
                    (screen === 'milestones' && currentScreen === 'new-milestone');
                    
    const baseClass = "w-10 h-10 rounded-xl flex items-center justify-center mr-3 transition-colors ";
    if (isActive) return baseClass + "bg-white text-teal-600 shadow-sm border border-teal-100";
    return baseClass + "bg-slate-100 text-slate-400 group-hover:bg-white group-hover:text-slate-600 group-hover:shadow-sm";
  };

  const getMobileNavClass = (screen) => {
    const isActive = currentScreen === screen || 
                    (screen === 'vaccines' && currentScreen === 'register-vaccine') ||
                    (screen === 'consultations' && currentScreen === 'new-consultation') ||
                    (screen === 'milestones' && currentScreen === 'new-milestone');

    const baseClass = "flex flex-col items-center justify-center p-2 rounded-2xl transition-all duration-300 w-16 ";
    if (isActive) return baseClass + "text-teal-700 bg-teal-50";
    return baseClass + "text-slate-400 hover:text-slate-600";
  };

  return (
    <div className="min-h-screen bg-[#F8FAFC] font-sans text-slate-800 flex flex-col md:flex-row selection:bg-teal-200">
      <style>{`
        .pb-safe { padding-bottom: env(safe-area-inset-bottom); }
        .animate-fade-in-up { animation: fadeInUp 0.5s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        /* Custom radio styling for Icon selector */
        input[type="radio"]:checked + div.icon-selector {
          border-color: #f59e0b;
          background-color: #fffbeb;
        }
        /* Custom radio styling for Baby selector in forms */
        input[type="radio"]:checked + div.baby-selector {
          border-color: #0d9488;
          background-color: #f0fdfa;
        }
        input[type="radio"]:checked + div.baby-selector .check-icon {
          opacity: 1;
          transform: scale(1);
        }
      `}</style>

      {/* LOGIN SCREEN */}
      {currentScreen === 'login' && (
        <div className="flex-1 flex min-h-screen">
          <div className="hidden lg:flex w-1/2 bg-teal-600 flex-col justify-between p-12 relative overflow-hidden">
            <div className="absolute inset-0 bg-gradient-to-br from-teal-500 to-indigo-600 opacity-90 z-0"></div>
            <div className="absolute top-[-10%] left-[-10%] w-96 h-96 bg-white opacity-10 rounded-full blur-3xl z-0"></div>
            <div className="absolute bottom-[-10%] right-[-10%] w-[30rem] h-[30rem] bg-indigo-300 opacity-20 rounded-full blur-3xl z-0"></div>
            
            <div className="relative z-10">
              <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md text-white mb-6">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <h1 className="text-5xl font-extrabold text-white tracking-tight leading-tight">Meu Neném</h1>
              <p className="text-teal-50 mt-4 text-xl font-light max-w-md">O painel completo para a saúde e memórias da sua família.</p>
            </div>
            
            <div className="relative z-10">
              <div className="flex items-center gap-4 text-white/80 text-sm">
                <span>© 2026 Meu Neném App</span>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Termos</a>
                <span>•</span>
                <a href="#" className="hover:text-white transition-colors">Privacidade</a>
              </div>
            </div>
          </div>

          <div className="w-full lg:w-1/2 flex items-center justify-center p-8 sm:p-12 bg-white relative">
            <div className="w-full max-w-md animate-fade-in-up">
              <div className="lg:hidden text-center mb-10">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-teal-50 text-teal-600 mb-4">
                  <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                </div>
                <h2 className="text-3xl font-bold text-slate-900">Meu Neném</h2>
              </div>

              <div className="mb-10 text-center lg:text-left">
                <h2 className="text-3xl font-bold text-slate-900">Bem-vindo(a) de volta</h2>
                <p className="text-slate-500 mt-2">Acesse sua conta para começar.</p>
              </div>

              <form onSubmit={doLogin} className="space-y-6">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-2">E-mail</label>
                  <input type="email" defaultValue="familia@exemplo.com" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none" placeholder="Seu e-mail" />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-semibold text-slate-700">Senha</label>
                    <a href="#" className="text-sm font-medium text-teal-600 hover:text-teal-500">Esqueceu a senha?</a>
                  </div>
                  <input type="password" defaultValue="********" className="w-full px-5 py-3.5 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none" placeholder="Sua senha" />
                </div>
                
                <button type="submit" className="w-full py-4 px-4 bg-slate-900 hover:bg-slate-800 text-white rounded-2xl font-semibold shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98] mt-4">
                  Entrar na Conta
                </button>

                <div className="relative flex items-center py-4">
                  <div className="flex-grow border-t border-slate-200"></div>
                  <span className="flex-shrink-0 mx-4 text-slate-400 text-sm font-medium">Ou entre com</span>
                  <div className="flex-grow border-t border-slate-200"></div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <button type="button" className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors font-medium text-slate-700">
                    <svg className="w-5 h-5 mr-2 text-[#DB4437]" fill="currentColor" viewBox="0 0 24 24"><path d="M12.24 10.285V14.4h6.806c-.275 1.765-2.056 5.174-6.806 5.174-4.095 0-7.439-3.389-7.439-7.574s3.345-7.574 7.439-7.574c2.33 0 3.891.989 4.785 1.849l3.254-3.138C18.189 1.186 15.479 0 12.24 0c-6.635 0-12 5.365-12 12s5.365 12 12 12c6.926 0 11.52-4.869 11.52-11.726 0-.788-.085-1.39-.189-1.989H12.24z"/></svg>
                    Google
                  </button>
                  <button type="button" className="flex items-center justify-center px-4 py-3 border border-slate-200 rounded-2xl hover:bg-slate-50 transition-colors font-medium text-slate-700">
                    <svg className="w-5 h-5 mr-2 text-[#000000]" fill="currentColor" viewBox="0 0 24 24"><path d="M12 0C5.373 0 0 5.372 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.688 0 1.029-.653 2.568-.992 3.992-.283 1.193.597 2.159 1.769 2.159 2.123 0 3.756-2.239 3.756-5.471 0-2.861-2.056-4.86-4.991-4.86-3.398 0-5.393 2.549-5.393 5.184 0 1.031.397 2.138.893 2.738a.36.36 0 01.083.345l-.333 1.36c-.053.22-.174.267-.402.161-1.499-.698-2.436-2.889-2.436-4.649 0-3.785 2.75-7.262 7.929-7.262 4.163 0 7.398 2.967 7.398 6.923 0 4.136-2.607 7.464-6.227 7.464-1.216 0-2.359-.631-2.75-1.378l-.748 2.853c-.271 1.043-1.002 2.35-1.492 3.146C9.57 23.812 10.763 24 12 24c6.627 0 12-5.373 12-12 0-6.628-5.373-12-12-12z"/></svg>
                    Apple
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* AUTHENTICATED APP SHELL */}
      {}
      {currentScreen !== 'login' && (
        <>
          <aside className="hidden md:flex flex-col w-[280px] bg-white border-r border-slate-100 h-screen sticky top-0 z-20 shadow-[4px_0_24px_rgba(0,0,0,0.02)]">
            <div className="p-8 flex items-center space-x-3">
              <div className="w-10 h-10 rounded-xl bg-slate-900 flex items-center justify-center text-white shadow-md">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
              </div>
              <span className="text-xl font-bold text-slate-900 tracking-tight">Meu Neném</span>
            </div>

            <nav className="flex-1 px-4 space-y-1.5 overflow-y-auto mt-4">
              <button onClick={() => navigateTo('dashboard')} className={getNavClass('dashboard')} disabled={babies.length === 0}>
                <div className={getNavIconClass('dashboard')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                </div>
                Visão Geral
              </button>
              <button onClick={() => navigateTo('vaccines')} className={getNavClass('vaccines')} disabled={babies.length === 0}>
                <div className={getNavIconClass('vaccines')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                </div>
                Vacinas
              </button>
              <button onClick={() => navigateTo('consultations')} className={getNavClass('consultations')} disabled={babies.length === 0}>
                <div className={getNavIconClass('consultations')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                </div>
                Consultas
              </button>
              <button onClick={() => navigateTo('milestones')} className={getNavClass('milestones')} disabled={babies.length === 0}>
                <div className={getNavIconClass('milestones')}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                </div>
                Marcos
              </button>
            </nav>

            <div className="p-6">
              <button onClick={() => navigateTo('login')} className="flex items-center justify-center w-full px-4 py-3.5 text-sm font-semibold text-slate-700 bg-slate-100/80 rounded-2xl hover:bg-slate-200 transition-colors">
                <svg className="w-4 h-4 mr-2 text-slate-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"></path></svg>
                Sair da conta
              </button>
            </div>
          </aside>

          <main className="flex-1 flex flex-col h-screen overflow-hidden bg-slate-50/50">
            {/* Mobile Header */}
            <header className="md:hidden bg-white/80 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between sticky top-0 z-20">
              <div className="flex items-center space-x-2">
                 <div className="w-8 h-8 rounded-lg bg-slate-900 flex items-center justify-center text-white">
                   <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"></path></svg>
                 </div>
                 <span className="text-lg font-bold text-slate-900">Meu Neném</span>
              </div>
              
              {/* Mobile User Actions */}
              <div className="flex items-center gap-4">
                <button className="relative text-slate-400 hover:text-teal-600 transition-colors">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  <span className="absolute top-0 right-0.5 w-2 h-2 bg-rose-500 rounded-full border-2 border-white"></span>
                </button>
                <button className="flex items-center justify-center active:scale-95 transition-transform">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mae&backgroundColor=f8fafc" className="w-8 h-8 rounded-full border border-slate-200 bg-white" alt="Perfil"/>
                </button>
              </div>
            </header>

            {/* Desktop Header */}
            <header className="hidden md:flex bg-white/80 backdrop-blur-md border-b border-slate-200 px-8 py-4 items-center justify-end sticky top-0 z-20">
              <div className="flex items-center gap-5">
                <button className="relative p-2 text-slate-400 hover:text-teal-600 transition-colors rounded-full hover:bg-slate-50">
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"></path></svg>
                  <span className="absolute top-2 right-2 w-2 h-2 bg-rose-500 rounded-full border border-white"></span>
                </button>
                
                <div className="h-8 w-px bg-slate-200"></div>
                
                <button className="flex items-center gap-3 hover:opacity-80 transition-opacity text-left group">
                  <img src="https://api.dicebear.com/7.x/avataaars/svg?seed=Mae&backgroundColor=f8fafc" className="w-10 h-10 rounded-full border border-slate-200 bg-white shadow-sm group-hover:border-teal-200 transition-colors" alt="Perfil"/>
                  <div className="hidden lg:block">
                    <p className="text-sm font-bold text-slate-700 leading-none mb-1">Amanda Silva</p>
                    <p className="text-[11px] font-semibold text-teal-600 uppercase tracking-wide">Conta Premium</p>
                  </div>
                  <svg className="w-4 h-4 text-slate-400 group-hover:text-teal-600 transition-colors ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7"></path></svg>
                </button>
              </div>
            </header>

            <div className="flex-1 overflow-y-auto p-5 md:p-10 lg:p-12">
              <div className="max-w-6xl mx-auto">
                
                {}
                {currentScreen === 'dashboard' && (
                  <div className="animate-fade-in-up">
                    {babies.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 md:py-12 text-center max-w-4xl mx-auto">
                        <div className="inline-flex items-center px-4 py-2 rounded-full bg-teal-50 border border-teal-100 text-teal-700 text-sm font-bold mb-8 shadow-sm">
                          <span className="flex w-2 h-2 rounded-full bg-teal-500 mr-2 animate-pulse"></span>
                          O painel da sua família
                        </div>

                        <h2 className="text-4xl md:text-5xl font-black text-slate-900 mb-6 tracking-tight leading-[1.15]">
                          O desenvolvimento das suas crianças, <br className="hidden md:block"/>
                          <span className="text-transparent bg-clip-text bg-gradient-to-r from-teal-600 to-indigo-600">organizado em um só lugar.</span>
                        </h2>

                        <p className="text-slate-500 text-lg md:text-xl leading-relaxed mb-12 max-w-2xl">
                          Tenha controle absoluto sobre a imunização, histórico médico e eternize cada momento importante. Tudo centralizado para facilitar sua rotina.
                        </p>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12 w-full text-left">
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-rose-50 text-rose-500 rounded-xl flex items-center justify-center mb-5">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Imunização no Prazo</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Carteira digital inteligente para acompanhar as vacinas de todos os filhos.</p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-indigo-50 text-indigo-500 rounded-xl flex items-center justify-center mb-5">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Consultas e Rotina</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Agende e guarde o histórico das visitas ao pediatra e especialistas.</p>
                          </div>
                          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-[0_8px_30px_rgb(0,0,0,0.04)] hover:shadow-[0_8px_30px_rgb(0,0,0,0.08)] hover:-translate-y-1 transition-all duration-300">
                            <div className="w-12 h-12 bg-amber-50 text-amber-500 rounded-xl flex items-center justify-center mb-5">
                              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                            </div>
                            <h3 className="text-lg font-bold text-slate-900 mb-2">Linha do Tempo</h3>
                            <p className="text-sm text-slate-500 leading-relaxed">Crie um diário visual registrando cada marco importante do crescimento.</p>
                          </div>
                        </div>

                        <button onClick={() => navigateTo('add-baby')} className="px-10 py-4 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-xl shadow-slate-900/20 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center text-lg mx-auto group">
                          Começar Agora: Adicionar Criança
                          <svg className="w-5 h-5 ml-3 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"></path></svg>
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="mb-10 flex flex-col md:flex-row md:items-end justify-between gap-4">
                          <div>
                            <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-1">VISÃO GERAL</p>
                            <h2 className="text-3xl font-extrabold text-slate-900">Painel da Família</h2>
                            <p className="text-slate-500 mt-1 text-lg">Acompanhamento consolidado.</p>
                          </div>
                          <button onClick={() => navigateTo('add-baby')} className="bg-white px-4 py-2.5 rounded-xl border border-slate-200 shadow-sm text-sm font-bold text-slate-700 hover:bg-slate-50 flex items-center transition-colors">
                            <svg className="w-4 h-4 mr-2 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                            Adicionar Criança
                          </button>
                        </div>

                        {/* LISTA DE CRIANÇAS (FAMÍLIA) */}
                        <div className="mb-10">
                          <h3 className="text-lg font-bold text-slate-900 mb-4">Suas Crianças</h3>
                          <div className="flex flex-wrap gap-4">
                            {babies.map((baby) => (
                              <div key={baby.id} className="flex items-center p-3 pr-5 bg-white border border-slate-200 rounded-2xl shadow-sm">
                                <img src={baby.avatarUrl} className="w-12 h-12 rounded-full bg-slate-50 mr-3" alt={baby.name} />
                                <div>
                                  <p className="font-bold text-slate-900 leading-tight">{baby.name}</p>
                                  <p className="text-xs text-slate-500 font-medium">{baby.monthsOld} meses</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* QUICK STATS GRID - BUSCANDO DADOS DE TODOS */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => navigateTo('vaccines')}>
                            <div className="flex items-start justify-between mb-6">
                              <div className="w-14 h-14 rounded-2xl bg-rose-50 text-rose-500 flex items-center justify-center group-hover:bg-rose-500 group-hover:text-white transition-colors">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                              </div>
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Vacinas</p>
                              {vaccinesData.length > 0 ? (
                                <>
                                  <h3 className="text-xl font-bold text-slate-900">{vaccinesData[vaccinesData.length - 1].name}</h3>
                                  <p className="text-sm text-slate-500 mt-1">Última registrada ({getBaby(vaccinesData[vaccinesData.length - 1].babyId)?.name})</p>
                                </>
                              ) : (
                                <>
                                  <h3 className="text-xl font-bold text-slate-900">Nenhuma vacina</h3>
                                  <p className="text-sm text-slate-500 mt-1">A carteira está vazia</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100 flex flex-col justify-between hover:shadow-lg transition-all duration-300 cursor-pointer group" onClick={() => navigateTo('consultations')}>
                            <div className="flex items-start justify-between mb-6">
                              <div className="w-14 h-14 rounded-2xl bg-indigo-50 text-indigo-500 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-colors">
                                <svg className="w-7 h-7" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                              </div>
                              {consultationsData.length > 0 && (
                                <span className="bg-indigo-100 text-indigo-700 text-xs font-bold px-3 py-1.5 rounded-full">Agendada</span>
                              )}
                            </div>
                            <div>
                              <p className="text-sm font-semibold text-slate-500 mb-1 uppercase tracking-wider">Próx. Consulta</p>
                              {consultationsData.length > 0 ? (
                                <>
                                  <h3 className="text-xl font-bold text-slate-900">{consultationsData[0].date.slice(8,10)}/{consultationsData[0].date.slice(5,7)} às {consultationsData[0].time}</h3>
                                  <p className="text-sm text-slate-500 mt-1">{getBaby(consultationsData[0].babyId)?.name} • {consultationsData[0].specialty}</p>
                                </>
                              ) : (
                                <>
                                  <h3 className="text-xl font-bold text-slate-900">Sem consultas</h3>
                                  <p className="text-sm text-slate-500 mt-1">Nenhum agendamento</p>
                                </>
                              )}
                            </div>
                          </div>

                          <div className="bg-slate-900 p-6 rounded-[2rem] shadow-lg shadow-slate-900/10 text-white flex flex-col justify-between cursor-pointer hover:-translate-y-1 transition-transform duration-300 relative overflow-hidden" onClick={() => navigateTo('milestones')}>
                            <div className="absolute top-0 right-0 w-32 h-32 bg-white opacity-5 rounded-full blur-2xl -mr-10 -mt-10"></div>
                            <div className="flex items-start justify-between mb-6 relative z-10">
                              <div className="w-14 h-14 rounded-2xl bg-white/10 backdrop-blur-md flex items-center justify-center text-3xl">
                                {milestonesData.length > 0 ? milestonesData[0].icon : '🌱'}
                              </div>
                            </div>
                            <div className="relative z-10">
                              <p className="text-sm font-medium text-slate-400 mb-1 uppercase tracking-wider">Último Marco</p>
                              {milestonesData.length > 0 ? (
                                <>
                                  <h3 className="text-xl font-bold text-white truncate">{milestonesData[0].title}</h3>
                                  <p className="text-sm text-slate-400 mt-1">De {getBaby(milestonesData[0].babyId)?.name}</p>
                                </>
                              ) : (
                                <>
                                  <h3 className="text-xl font-bold text-white">Comece a registrar</h3>
                                  <p className="text-sm text-slate-400 mt-1">Guarde cada momento</p>
                                </>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Banner se tudo estiver vazio */}
                        {vaccinesData.length === 0 && consultationsData.length === 0 && milestonesData.length === 0 && (
                          <div className="bg-gradient-to-r from-teal-500 to-indigo-500 rounded-[2rem] p-8 text-white shadow-lg mb-8 relative overflow-hidden">
                            <div className="relative z-10 md:flex items-center justify-between">
                              <div className="mb-6 md:mb-0 max-w-lg">
                                <h3 className="text-2xl font-bold mb-2">Tudo pronto para começar! ✨</h3>
                                <p className="text-teal-50 text-lg">Os perfis estão criados. Adicione a primeira vacina, consulta ou um marco de desenvolvimento para alimentar o painel.</p>
                              </div>
                              <div className="flex flex-col sm:flex-row gap-3">
                                <button onClick={() => navigateTo('register-vaccine')} className="px-6 py-3 bg-white text-teal-600 font-bold rounded-xl hover:bg-slate-50 transition-colors shadow-sm">Add Vacina</button>
                                <button onClick={() => navigateTo('new-milestone')} className="px-6 py-3 bg-indigo-600/30 backdrop-blur-md text-white border border-white/20 font-bold rounded-xl hover:bg-indigo-600/50 transition-colors">Add Marco</button>
                              </div>
                            </div>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}

                {}
                {currentScreen === 'add-baby' && (
                  <div className="animate-fade-in-up max-w-2xl mx-auto mt-4 md:mt-12">
                    <div className="mb-8">
                      {babies.length > 0 && (
                        <button onClick={() => navigateTo('dashboard')} className="flex items-center text-sm font-bold text-slate-500 hover:text-teal-600 mb-6 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                          Voltar
                        </button>
                      )}
                      <h2 className="text-3xl font-extrabold text-slate-900">Novo Perfil</h2>
                      <p className="text-slate-500 mt-2 text-lg">Insira as informações da criança para começarmos o acompanhamento.</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-10 relative overflow-hidden">
                      <div className="absolute top-0 right-0 w-32 h-32 bg-teal-50 rounded-bl-full -mr-10 -mt-10 z-0"></div>
                      <form onSubmit={saveBaby} className="space-y-6 relative z-10">
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Criança</label>
                          <input type="text" name="name" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium" placeholder="Ex: Miguel" />
                        </div>
                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Data de Nascimento</label>
                          <input type="date" name="birthDate" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium text-slate-700" />
                        </div>
                        <div className="pt-6 mt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                          {babies.length > 0 && (
                            <button type="button" onClick={() => navigateTo('dashboard')} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                              Cancelar
                            </button>
                          )}
                          <button type="submit" className="px-8 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]">
                            Criar Perfil
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {}
                {currentScreen === 'vaccines' && (
                  <div className="animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-teal-600 tracking-wider uppercase mb-1">IMUNIZAÇÃO</p>
                        <h2 className="text-3xl font-extrabold text-slate-900">Carteira de Vacinação</h2>
                        <p className="text-slate-500 mt-1 text-lg">Histórico de todas as crianças.</p>
                      </div>
                      <button onClick={() => navigateTo('register-vaccine')} className="inline-flex items-center justify-center px-6 py-3 bg-teal-600 text-white font-bold rounded-2xl hover:bg-teal-700 shadow-lg shadow-teal-600/30 transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Registrar Vacina
                      </button>
                    </div>

                    {vaccinesData.length === 0 ? (
                      <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-slate-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Nenhuma vacina registrada</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">Mantenha a carteirinha das crianças atualizada para garantir a proteção.</p>
                        <button onClick={() => navigateTo('register-vaccine')} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">Começar a registrar</button>
                      </div>
                    ) : (
                      <div className="bg-white rounded-[2rem] shadow-sm border border-slate-100 overflow-hidden">
                        <div className="overflow-x-auto">
                          <table className="w-full text-left border-collapse">
                            <thead>
                              <tr className="bg-slate-50/50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-100">
                                <th className="p-6">Criança</th>
                                <th className="p-6">Vacina & Dose</th>
                                <th className="p-6">Doença Evitada</th>
                                <th className="p-6">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {vaccinesData.map((vaccine) => {
                                const baby = getBaby(vaccine.babyId);
                                return (
                                  <tr key={vaccine.id} className="hover:bg-slate-50/50 transition-colors group">
                                    <td className="p-6">
                                      <div className="flex items-center space-x-3">
                                        <img src={baby?.avatarUrl} className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200" alt="" />
                                        <span className="font-bold text-slate-900">{baby?.name}</span>
                                      </div>
                                    </td>
                                    <td className="p-6">
                                      <div className="font-bold text-slate-900 text-base mb-0.5">{vaccine.name}</div>
                                      <div className="text-sm font-medium text-slate-500">{vaccine.dose}</div>
                                    </td>
                                    <td className="p-6 text-sm font-medium text-slate-600">{vaccine.disease}</td>
                                    <td className="p-6">
                                      {vaccine.status === 'given' ? (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-green-50 text-green-700 border border-green-100">
                                          Aplicada em {vaccine.dateGiven}
                                        </span>
                                      ) : vaccine.status === 'overdue' ? (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-rose-50 text-rose-700 border border-rose-100">
                                          Atrasada
                                        </span>
                                      ) : (
                                        <span className="inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-bold bg-amber-50 text-amber-700 border border-amber-100">
                                          Pendente
                                        </span>
                                      )}
                                    </td>
                                  </tr>
                                )
                              })}
                            </tbody>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {}
                {currentScreen === 'register-vaccine' && (
                  <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="mb-8">
                      <button onClick={() => navigateTo('vaccines')} className="flex items-center text-sm font-bold text-slate-500 hover:text-teal-600 mb-6 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Voltar
                      </button>
                      <h2 className="text-3xl font-extrabold text-slate-900">Registrar Vacina</h2>
                      <p className="text-slate-500 mt-2 text-lg">Adicione uma nova imunização ao histórico.</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-10">
                      <form onSubmit={saveVaccine} className="space-y-6">
                        
                        {/* Baby Selector for Form */}
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-3">Quem tomou a vacina?</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             {babies.map((baby, index) => (
                               <label key={baby.id} className="cursor-pointer relative">
                                  <input type="radio" name="babyId" value={baby.id} defaultChecked={index === 0} className="peer sr-only" required />
                                  <div className="baby-selector p-3 rounded-2xl border-2 border-slate-100 hover:border-teal-200 flex items-center transition-all">
                                    <img src={baby.avatarUrl} className="w-10 h-10 rounded-full bg-white mr-3 shrink-0" alt=""/>
                                    <span className="font-bold text-slate-700 text-sm truncate">{baby.name}</span>
                                    <div className="check-icon absolute top-2 right-2 w-4 h-4 bg-teal-500 rounded-full flex items-center justify-center opacity-0 transition-transform scale-50">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                  </div>
                               </label>
                             ))}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nome da Vacina</label>
                            <input type="text" name="name" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium" placeholder="Ex: Febre Amarela" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Doença Evitada</label>
                            <input type="text" name="disease" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium" placeholder="Ex: Febre Amarela" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Dose</label>
                            <select name="dose" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium text-slate-700 appearance-none">
                              <option value="Dose Única">Dose Única</option>
                              <option value="1ª Dose">1ª Dose</option>
                              <option value="2ª Dose">2ª Dose</option>
                              <option value="3ª Dose">3ª Dose</option>
                              <option value="Reforço">Reforço</option>
                            </select>
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Data da Aplicação</label>
                            <input type="date" name="dateGiven" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-teal-500/10 focus:border-teal-500 transition-all outline-none font-medium text-slate-700" />
                          </div>
                        </div>

                        <div className="pt-6 mt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                          <button type="button" onClick={() => navigateTo('vaccines')} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                            Cancelar
                          </button>
                          <button type="submit" className="px-8 py-3.5 text-sm font-bold text-white bg-teal-600 hover:bg-teal-700 rounded-2xl shadow-lg shadow-teal-600/30 transition-all active:scale-[0.98]">
                            Salvar Registro
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {}
                {currentScreen === 'consultations' && (
                  <div className="animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-8 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-indigo-600 tracking-wider uppercase mb-1">MÉDICOS</p>
                        <h2 className="text-3xl font-extrabold text-slate-900">Consultas</h2>
                        <p className="text-slate-500 mt-1 text-lg">Agendamentos de todas as crianças.</p>
                      </div>
                      <button onClick={() => navigateTo('new-consultation')} className="inline-flex items-center justify-center px-6 py-3 bg-indigo-600 text-white font-bold rounded-2xl hover:bg-indigo-700 shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Agendar Consulta
                      </button>
                    </div>

                    {consultationsData.length === 0 ? (
                       <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-indigo-50 rounded-full flex items-center justify-center mx-auto mb-6">
                          <svg className="w-10 h-10 text-indigo-300" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">Sem consultas agendadas</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">Organize as visitas ao pediatra e especialistas de toda a família.</p>
                        <button onClick={() => navigateTo('new-consultation')} className="px-6 py-3 bg-indigo-600 text-white font-bold rounded-xl hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-600/20">Agendar a primeira</button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {consultationsData.map(consult => {
                          const baby = getBaby(consult.babyId);
                          return (
                          <div key={consult.id} className="bg-white rounded-[2rem] p-8 border border-slate-100 shadow-sm relative overflow-hidden group hover:shadow-md hover:border-indigo-100 transition-all">
                            <div className="absolute top-0 left-0 w-2 h-full bg-indigo-500"></div>
                            
                            {/* Baby Tag */}
                            <div className="flex items-center mb-4 bg-slate-50 w-fit pr-3 rounded-full border border-slate-100">
                              <img src={baby?.avatarUrl} className="w-6 h-6 rounded-full bg-white mr-2" alt=""/>
                              <span className="text-xs font-bold text-slate-600">{baby?.name}</span>
                            </div>

                            <div className="flex justify-between items-start mb-6">
                              <div>
                                <h3 className="text-xl font-bold text-slate-900 mb-1">{consult.doctorName}</h3>
                                <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-bold bg-indigo-50 text-indigo-700">
                                  {consult.specialty}
                                </span>
                              </div>
                              <div className="bg-slate-50 rounded-2xl p-3 text-center min-w-[80px] border border-slate-100">
                                <span className="block text-[10px] text-slate-400 uppercase font-bold tracking-wider mb-1">Data</span>
                                <span className="block text-lg font-black text-slate-800">{consult.date.slice(8,10)}/{consult.date.slice(5,7)}</span>
                              </div>
                            </div>
                            
                            <div className="flex items-center text-sm font-bold text-slate-600 mb-6 bg-slate-50 w-fit px-4 py-2 rounded-lg">
                              <svg className="w-4 h-4 mr-2 text-indigo-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                              {consult.time}h
                            </div>

                            {consult.notes && (
                              <div className="bg-[#F8FAFC] rounded-xl p-4 text-sm font-medium text-slate-600 border border-slate-100 mb-6">
                                "{consult.notes}"
                              </div>
                            )}

                            <div className="flex gap-3">
                              <button className="flex-1 py-3 bg-white border-2 border-slate-100 text-slate-700 rounded-xl text-sm font-bold hover:border-slate-200 hover:bg-slate-50 transition-colors">Reagendar</button>
                              <button className="flex-1 py-3 bg-indigo-50 text-indigo-700 rounded-xl text-sm font-bold hover:bg-indigo-100 transition-colors">Ver Detalhes</button>
                            </div>
                          </div>
                        )})}
                      </div>
                    )}
                  </div>
                )}

                {}
                {currentScreen === 'new-consultation' && (
                  <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="mb-8">
                      <button onClick={() => navigateTo('consultations')} className="flex items-center text-sm font-bold text-slate-500 hover:text-indigo-600 mb-6 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Voltar
                      </button>
                      <h2 className="text-3xl font-extrabold text-slate-900">Agendar Consulta</h2>
                      <p className="text-slate-500 mt-2 text-lg">Registre um novo acompanhamento.</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-10">
                      <form onSubmit={saveConsultation} className="space-y-6">
                        
                        {/* Baby Selector for Form */}
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-3">Consulta de quem?</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             {babies.map((baby, index) => (
                               <label key={baby.id} className="cursor-pointer relative">
                                  <input type="radio" name="babyId" value={baby.id} defaultChecked={index === 0} className="peer sr-only" required />
                                  <div className="baby-selector p-3 rounded-2xl border-2 border-slate-100 hover:border-indigo-200 flex items-center transition-all peer-checked:border-indigo-500 peer-checked:bg-indigo-50">
                                    <img src={baby.avatarUrl} className="w-10 h-10 rounded-full bg-white mr-3 shrink-0" alt=""/>
                                    <span className="font-bold text-slate-700 text-sm truncate">{baby.name}</span>
                                    <div className="check-icon absolute top-2 right-2 w-4 h-4 bg-indigo-500 rounded-full flex items-center justify-center opacity-0 transition-transform scale-50">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                  </div>
                               </label>
                             ))}
                           </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Nome do Profissional</label>
                            <input type="text" name="doctorName" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium" placeholder="Ex: Dra. Ana Silva" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Especialidade</label>
                            <input type="text" name="specialty" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium" placeholder="Ex: Pediatra" />
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                            <input type="date" name="date" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Horário</label>
                            <input type="time" name="time" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium text-slate-700" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Anotações (Opcional)</label>
                          <textarea name="notes" rows="3" className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all outline-none font-medium resize-none" placeholder="Sintomas, dúvidas para o médico..."></textarea>
                        </div>

                        <div className="pt-6 mt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                          <button type="button" onClick={() => navigateTo('consultations')} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                            Cancelar
                          </button>
                          <button type="submit" className="px-8 py-3.5 text-sm font-bold text-white bg-indigo-600 hover:bg-indigo-700 rounded-2xl shadow-lg shadow-indigo-600/30 transition-all active:scale-[0.98]">
                            Salvar Consulta
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

                {}
                {currentScreen === 'milestones' && (
                  <div className="animate-fade-in-up">
                    <div className="flex flex-col sm:flex-row sm:items-end justify-between mb-10 gap-4">
                      <div>
                        <p className="text-sm font-semibold text-amber-500 tracking-wider uppercase mb-1">MEMÓRIAS</p>
                        <h2 className="text-3xl font-extrabold text-slate-900">Marcos de Desenvolvimento</h2>
                        <p className="text-slate-500 mt-1 text-lg">As conquistas da família toda.</p>
                      </div>
                      <button onClick={() => navigateTo('new-milestone')} className="inline-flex items-center justify-center px-6 py-3 bg-slate-900 text-white font-bold rounded-2xl hover:bg-slate-800 shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]">
                        <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6"></path></svg>
                        Registrar Marco
                      </button>
                    </div>

                    {milestonesData.length === 0 ? (
                       <div className="bg-white rounded-[2rem] border border-slate-100 p-12 text-center shadow-sm">
                        <div className="w-24 h-24 bg-amber-50 rounded-full flex items-center justify-center mx-auto mb-6 text-4xl">
                          🌟
                        </div>
                        <h3 className="text-xl font-bold text-slate-900 mb-2">O primeiro marco está chegando!</h3>
                        <p className="text-slate-500 max-w-md mx-auto mb-8">Desde o primeiro sorriso aos primeiros passos. Registre aqui esses momentos inesquecíveis.</p>
                        <button onClick={() => navigateTo('new-milestone')} className="px-6 py-3 bg-amber-500 text-white font-bold rounded-xl hover:bg-amber-600 transition-colors shadow-md shadow-amber-500/20">Registrar agora</button>
                      </div>
                    ) : (
                      <div className="relative max-w-3xl ml-4 sm:ml-8">
                        <div className="absolute left-6 top-6 bottom-6 w-1 bg-gradient-to-b from-amber-200 via-amber-400 to-amber-200 rounded-full opacity-50"></div>

                        <div className="space-y-10">
                          {milestonesData.map(milestone => {
                            const baby = getBaby(milestone.babyId);
                            return (
                            <div key={milestone.id} className="relative flex items-start group">
                              <div className="absolute left-6 w-14 h-14 -ml-[1.65rem] rounded-2xl bg-white border-2 border-amber-100 flex items-center justify-center text-2xl shadow-sm z-10 group-hover:scale-110 group-hover:border-amber-400 group-hover:shadow-amber-400/20 transition-all duration-300">
                                {milestone.icon}
                              </div>
                              
                              <div className="ml-20 w-full bg-white p-8 rounded-[2rem] shadow-sm border border-slate-100 group-hover:shadow-md group-hover:border-slate-200 transition-all duration-300">
                                <div className="flex items-center justify-between mb-3">
                                  <span className="inline-block px-3 py-1 bg-amber-50 text-amber-700 text-xs font-bold rounded-lg">{milestone.date}</span>
                                  {/* Baby Tag */}
                                  <div className="flex items-center bg-slate-50 pr-3 rounded-full border border-slate-100">
                                    <img src={baby?.avatarUrl} className="w-6 h-6 rounded-full bg-white mr-2" alt=""/>
                                    <span className="text-xs font-bold text-slate-600">{baby?.name}</span>
                                  </div>
                                </div>
                                <h3 className="text-2xl font-bold text-slate-900 mb-2">{milestone.title}</h3>
                                <p className="text-slate-600 text-base font-medium leading-relaxed">{milestone.description}</p>
                              </div>
                            </div>
                          )})}
                        </div>
                      </div>
                    )}
                  </div>
                )}

                {}
                {currentScreen === 'new-milestone' && (
                  <div className="animate-fade-in-up max-w-2xl mx-auto">
                    <div className="mb-8">
                      <button onClick={() => navigateTo('milestones')} className="flex items-center text-sm font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors bg-white px-4 py-2 rounded-xl border border-slate-200 shadow-sm w-fit">
                        <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"></path></svg>
                        Voltar
                      </button>
                      <h2 className="text-3xl font-extrabold text-slate-900">Novo Marco</h2>
                      <p className="text-slate-500 mt-2 text-lg">Guarde para sempre as conquistas.</p>
                    </div>

                    <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 p-8 sm:p-10">
                      <form onSubmit={saveMilestone} className="space-y-6">

                        {/* Baby Selector for Form */}
                        <div>
                           <label className="block text-sm font-bold text-slate-700 mb-3">De quem é esse marco?</label>
                           <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                             {babies.map((baby, index) => (
                               <label key={baby.id} className="cursor-pointer relative">
                                  <input type="radio" name="babyId" value={baby.id} defaultChecked={index === 0} className="peer sr-only" required />
                                  <div className="baby-selector p-3 rounded-2xl border-2 border-slate-100 hover:border-amber-200 flex items-center transition-all peer-checked:border-amber-500 peer-checked:bg-amber-50">
                                    <img src={baby.avatarUrl} className="w-10 h-10 rounded-full bg-white mr-3 shrink-0" alt=""/>
                                    <span className="font-bold text-slate-700 text-sm truncate">{baby.name}</span>
                                    <div className="check-icon absolute top-2 right-2 w-4 h-4 bg-amber-500 rounded-full flex items-center justify-center opacity-0 transition-transform scale-50">
                                      <svg className="w-3 h-3 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M5 13l4 4L19 7"></path></svg>
                                    </div>
                                  </div>
                               </label>
                             ))}
                           </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-3">Escolha um Ícone</label>
                          <div className="flex flex-wrap gap-3">
                            {AVAILABLE_ICONS.map((icon, index) => (
                              <label key={index} className="cursor-pointer relative">
                                <input type="radio" name="icon" value={icon} defaultChecked={index === 0} className="peer sr-only" />
                                <div className="icon-selector w-14 h-14 rounded-2xl bg-slate-50 border-2 border-transparent flex items-center justify-center text-2xl hover:bg-slate-100 transition-all">
                                  {icon}
                                </div>
                              </label>
                            ))}
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                          <div className="md:col-span-2">
                            <label className="block text-sm font-bold text-slate-700 mb-2">O que aconteceu?</label>
                            <input type="text" name="title" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium" placeholder="Ex: Primeiros passos sozinho" />
                          </div>
                          <div>
                            <label className="block text-sm font-bold text-slate-700 mb-2">Data</label>
                            <input type="date" name="date" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium text-slate-700" />
                          </div>
                        </div>

                        <div>
                          <label className="block text-sm font-bold text-slate-700 mb-2">Detalhes</label>
                          <textarea name="description" rows="3" required className="w-full px-5 py-4 rounded-2xl bg-slate-50 border border-slate-200 focus:bg-white focus:ring-4 focus:ring-amber-500/10 focus:border-amber-500 transition-all outline-none font-medium resize-none" placeholder="Conte como foi esse momento especial..."></textarea>
                        </div>

                        <div className="pt-6 mt-6 flex items-center justify-end gap-4 border-t border-slate-100">
                          <button type="button" onClick={() => navigateTo('milestones')} className="px-6 py-3.5 text-sm font-bold text-slate-600 hover:text-slate-900 transition-colors">
                            Cancelar
                          </button>
                          <button type="submit" className="px-8 py-3.5 text-sm font-bold text-white bg-slate-900 hover:bg-slate-800 rounded-2xl shadow-lg shadow-slate-900/20 transition-all active:scale-[0.98]">
                            Salvar Marco
                          </button>
                        </div>
                      </form>
                    </div>
                  </div>
                )}

              </div>
            </div>
          </main>
          
          {}
          <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white/90 backdrop-blur-md border-t border-slate-200 flex justify-around p-2 pb-safe z-30 shadow-[0_-4px_24px_rgba(0,0,0,0.02)]">
             <button onClick={() => navigateTo('dashboard')} className={getMobileNavClass('dashboard')} disabled={babies.length === 0}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"></path></svg>
                <span className="text-[10px] font-bold">Painel</span>
              </button>
              <button onClick={() => navigateTo('vaccines')} className={getMobileNavClass('vaccines')} disabled={babies.length === 0}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z"></path></svg>
                <span className="text-[10px] font-bold">Vacinas</span>
              </button>
              <button onClick={() => navigateTo('consultations')} className={getMobileNavClass('consultations')} disabled={babies.length === 0}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"></path></svg>
                <span className="text-[10px] font-bold">Consultas</span>
              </button>
              <button onClick={() => navigateTo('milestones')} className={getMobileNavClass('milestones')} disabled={babies.length === 0}>
                <svg className="w-6 h-6 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z"></path></svg>
                <span className="text-[10px] font-bold">Marcos</span>
              </button>
          </nav>
        </>
      )}

    </div>
  );
}