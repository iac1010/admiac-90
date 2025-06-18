
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Quote, AppView, Client, Product, CompanyInfo, AppSettings, QuoteStatus, InstallationProgressStatus, ManualTransaction, ImportantLink, QuoteListChartFilter, PomodoroPhase, DailyTask, User, UserRole } from './types';
import QuoteList from './components/QuoteList';
import QuoteForm from './components/QuoteForm';
import MainDashboardView from './components/MainDashboardView'; // New Main Dashboard
import OldDashboard from './components/Dashboard'; // Keep old dashboard component for now
import SettingsView from './components/SettingsView';
import TeamManagementView from './components/TeamManagementView';
import FinancialView from './components/FinancialView';
import ImportantFilesView from './components/ImportantFilesView';
import ReportsView from './components/ReportsView';
import FocusView from './components/FocusView';
import PomodoroTimer from './components/PomodoroTimer';
import QuotePrintPreview from './components/QuotePrintPreview';
import ServiceOrderPrintPreview from './components/ServiceOrderPrintPreview';
import InstallationDetailsModal from './components/InstallationDetailsModal';
import ManualTransactionModal from './components/ManualTransactionModal';
import Modal from './components/common/Modal';
import Button from './components/common/Button';
import useLocalStorage from './hooks/useLocalStorage';
import ServiceOrderDashboardView from './components/ServiceOrderDashboardView'; // New Service Order Dashboard
import {
  APP_NAME,
  INITIAL_COMPANY_INFO,
  INITIAL_CLIENTS,
  INITIAL_PRODUCTS,
  INITIAL_APP_SETTINGS,
  INITIAL_IMPORTANT_LINKS,
  POINTS_PER_TASK_COMPLETION,
  POINTS_PER_POMODORO_WORK_CYCLE,
  POMODORO_WORK_DURATION,
  POMODORO_SHORT_BREAK_DURATION,
  POMODORO_LONG_BREAK_DURATION,
  POMODORO_CYCLES_BEFORE_LONG_BREAK,
  POINTS_PER_DAILY_TASK_COMPLETION,
  INITIAL_USERS,
} from './constants';
import LoginView from './components/LoginView';

const { jsPDF } = (window as any).jspdf;
const html2canvas = (window as any).html2canvas;

declare global {
  interface Window {
    // Removed gapi and google type extensions
  }
}

// Define specific types for navigation items
interface NavItemBase {
  id: string;
  name: string; // Common: used as display text or divider header
}

interface NavViewEntry extends NavItemBase {
  title: string; // Used for page title
  view: AppView;
  icon: React.ReactNode;
  type?: undefined; // Discriminating property
}

interface NavDividerEntry extends NavItemBase {
  type: 'divider';
  title?: undefined;
  view?: undefined;
  icon?: undefined;
}

type NavItemEntry = NavViewEntry | NavDividerEntry;


const App: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useLocalStorage<boolean>('orcamentosProIsAuthenticated', false);
  const [loginError, setLoginError] = useState<string | null>(null);

  const [users, setUsers] = useLocalStorage<User[]>('orcamentosProUsers', INITIAL_USERS);
  const [currentUser, setCurrentUser] = useLocalStorage<User | null>('orcamentosProCurrentUser', null);


  const [currentView, setCurrentView] = useState<AppView>('mainDashboard'); // Default to new mainDashboard
  const [quotes, setQuotes] = useLocalStorage<Quote[]>('orcamentosProQuotes', []);

  const [companyInfo, setCompanyInfo] = useLocalStorage<CompanyInfo>('orcamentosProCompanyInfo', INITIAL_COMPANY_INFO);
  const [clients, setClients] = useLocalStorage<Client[]>('orcamentosProClients', INITIAL_CLIENTS);
  const [products, setProducts] = useLocalStorage<Product[]>('orcamentosProProducts', INITIAL_PRODUCTS);
  const [appSettings, setAppSettings] = useLocalStorage<AppSettings>('orcamentosProAppSettings', INITIAL_APP_SETTINGS);

  const [manualTransactions, setManualTransactions] = useLocalStorage<ManualTransaction[]>('orcamentosProManualTransactions', []);
  const [importantLinks, setImportantLinks] = useLocalStorage<ImportantLink[]>('orcamentosProImportantLinks', INITIAL_IMPORTANT_LINKS);

  const [userPoints, setUserPoints] = useLocalStorage<number>('orcamentosProUserPoints', 0);
  const [dailyTasks, setDailyTasks] = useLocalStorage<DailyTask[]>('orcamentosProDailyTasks', []);


  const [editingQuote, setEditingQuote] = useState<Quote | null>(null);
  const [quoteToPreview, setQuoteToPreview] = useState<Quote | null>(null);
  const printRef = useRef<HTMLDivElement>(null);

  const [quoteForOSPreview, setQuoteForOSPreview] = useState<Quote | null>(null);
  const osPrintRef = useRef<HTMLDivElement>(null);

  const [isInstallationModalOpen, setIsInstallationModalOpen] = useState(false);
  const [selectedQuoteForInstallationModal, setSelectedQuoteForInstallationModal] = useState<Quote | null>(null);

  const [isManualTransactionModalOpen, setIsManualTransactionModalOpen] = useState(false);
  const [editingManualTransaction, setEditingManualTransaction] = useState<ManualTransaction | null>(null);
  const [manualTransactionModalType, setManualTransactionModalType] = useState<'income' | 'expense'>('expense');

  const [initialQuoteListFilter, setInitialQuoteListFilter] = useState<QuoteListChartFilter | null>(null);

  const [pomodoroTimeLeft, setPomodoroTimeLeft] = useLocalStorage<number>('pomodoroTimeLeft', POMODORO_WORK_DURATION * 60);
  const [pomodoroCurrentPhase, setPomodoroCurrentPhase] = useLocalStorage<PomodoroPhase>('pomodoroCurrentPhase', 'work');
  const [pomodoroIsRunning, setPomodoroIsRunning] = useLocalStorage<boolean>('pomodoroIsRunning', false);
  const [pomodoroCycleCount, setPomodoroCycleCount] = useLocalStorage<number>('pomodoroCycleCount', 0);
  const [pomodoroIsFloating, setPomodoroIsFloating] = useLocalStorage<boolean>('pomodoroIsFloating', false);
  const [pomodoroIsMinimized, setPomodoroIsMinimized] = useLocalStorage<boolean>('pomodoroIsMinimized', false);

  const pomodoroAudioRef = useRef<HTMLAudioElement>(null);
  const pomodoroTimerIntervalRef = useRef<number | null>(null);

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);


  const handleAddPoints = useCallback((points: number) => {
    setUserPoints(prev => prev + points);
  }, [setUserPoints]);

    const handleSaveDailyTask = useCallback((task: DailyTask) => {
    setDailyTasks(prevTasks => {
      const existingIndex = prevTasks.findIndex(t => t.id === task.id);
      if (existingIndex > -1) {
        const updatedTasks = [...prevTasks];
        updatedTasks[existingIndex] = task;
        return updatedTasks;
      }
      return [...prevTasks, task];
    });
  }, [setDailyTasks]);

  const handleDeleteDailyTask = useCallback((taskId: string) => {
    setDailyTasks(prevTasks => prevTasks.filter(t => t.id !== taskId));
  }, [setDailyTasks]);


  const playPomodoroNotificationSound = useCallback(() => {
    if (pomodoroAudioRef.current) {
      pomodoroAudioRef.current.currentTime = 0;
      pomodoroAudioRef.current.play().catch(error => console.warn("Pomodoro audio play failed:", error));
    }
  }, []);

  useEffect(() => {
    if (pomodoroIsRunning && pomodoroTimeLeft > 0) {
      pomodoroTimerIntervalRef.current = window.setInterval(() => {
        setPomodoroTimeLeft(prevTime => prevTime - 1);
      }, 1000);
    } else if (pomodoroTimeLeft === 0 && pomodoroIsRunning) {
      playPomodoroNotificationSound();
      setPomodoroIsRunning(false);

      let nextPhase: PomodoroPhase = 'work';
      let nextTime = POMODORO_WORK_DURATION * 60;
      let newCycleCount = pomodoroCycleCount;

      if (pomodoroCurrentPhase === 'work') {
        newCycleCount++;
        setPomodoroCycleCount(newCycleCount);
        handleAddPoints(POINTS_PER_POMODORO_WORK_CYCLE);
        if (newCycleCount % POMODORO_CYCLES_BEFORE_LONG_BREAK === 0) {
          nextPhase = 'longBreak';
          nextTime = POMODORO_LONG_BREAK_DURATION * 60;
        } else {
          nextPhase = 'shortBreak';
          nextTime = POMODORO_SHORT_BREAK_DURATION * 60;
        }
      } else {
        nextPhase = 'work';
        nextTime = POMODORO_WORK_DURATION * 60;
      }
      setPomodoroCurrentPhase(nextPhase);
      setPomodoroTimeLeft(nextTime);
      setPomodoroIsRunning(true);
    }

    return () => {
      if (pomodoroTimerIntervalRef.current) {
        clearInterval(pomodoroTimerIntervalRef.current);
      }
    };
  }, [pomodoroIsRunning, pomodoroTimeLeft, pomodoroCurrentPhase, pomodoroCycleCount, handleAddPoints, playPomodoroNotificationSound, setPomodoroTimeLeft, setPomodoroCurrentPhase, setPomodoroIsRunning, setPomodoroCycleCount]);

  const setPomodoroPhaseAndTime = useCallback((phase: PomodoroPhase, time: number) => {
    setPomodoroCurrentPhase(phase);
    setPomodoroTimeLeft(time);
  }, [setPomodoroCurrentPhase, setPomodoroTimeLeft]);

  const handlePomodoroStartTimerAndFloat = useCallback(() => {
    setPomodoroIsFloating(true);
    setPomodoroIsMinimized(false);
    if (!pomodoroIsRunning) {
      if (pomodoroCurrentPhase === 'work' && pomodoroTimeLeft !== POMODORO_WORK_DURATION * 60 && pomodoroTimeLeft > 0) {
      } else if (pomodoroCurrentPhase === 'shortBreak' && pomodoroTimeLeft !== POMODORO_SHORT_BREAK_DURATION * 60 && pomodoroTimeLeft > 0) {
      } else if (pomodoroCurrentPhase === 'longBreak' && pomodoroTimeLeft !== POMODORO_LONG_BREAK_DURATION * 60 && pomodoroTimeLeft > 0) {
      } else {
        switch(pomodoroCurrentPhase) {
            case 'work': setPomodoroTimeLeft(POMODORO_WORK_DURATION * 60); break;
            case 'shortBreak': setPomodoroTimeLeft(POMODORO_SHORT_BREAK_DURATION * 60); break;
            case 'longBreak': setPomodoroTimeLeft(POMODORO_LONG_BREAK_DURATION * 60); break;
        }
      }
      setPomodoroIsRunning(true);
    }
  }, [pomodoroIsRunning, pomodoroCurrentPhase, pomodoroTimeLeft, setPomodoroIsFloating, setPomodoroIsMinimized, setPomodoroIsRunning, setPomodoroTimeLeft]);

  const handlePomodoroPausePlay = useCallback(() => {
    setPomodoroIsRunning(!pomodoroIsRunning);
  }, [pomodoroIsRunning, setPomodoroIsRunning]);

  const handlePomodoroResetCycle = useCallback(() => {
    setPomodoroIsFloating(false);
    setPomodoroIsMinimized(false);
    setPomodoroIsRunning(false);
    setPomodoroPhaseAndTime('work', POMODORO_WORK_DURATION * 60);
    setPomodoroCycleCount(0);
  }, [setPomodoroIsFloating, setPomodoroIsMinimized, setPomodoroIsRunning, setPomodoroPhaseAndTime, setPomodoroCycleCount]);

  const handlePomodoroSkipPhase = useCallback(() => {
    if (pomodoroTimerIntervalRef.current) clearInterval(pomodoroTimerIntervalRef.current);
    playPomodoroNotificationSound();

    let nextPhase: PomodoroPhase;
    let nextTime: number;
    let newCycleCount = pomodoroCycleCount;

    if (pomodoroCurrentPhase === 'work') {
      newCycleCount++;
      setPomodoroCycleCount(newCycleCount);
      if (newCycleCount % POMODORO_CYCLES_BEFORE_LONG_BREAK === 0) {
        nextPhase = 'longBreak';
        nextTime = POMODORO_LONG_BREAK_DURATION * 60;
      } else {
        nextPhase = 'shortBreak';
        nextTime = POMODORO_SHORT_BREAK_DURATION * 60;
      }
    } else {
      nextPhase = 'work';
      nextTime = POMODORO_WORK_DURATION * 60;
    }

    setPomodoroPhaseAndTime(nextPhase, nextTime);
    setPomodoroIsMinimized(false);
    if (!pomodoroIsFloating) setPomodoroIsFloating(true);
    setPomodoroIsRunning(true);
  }, [pomodoroCycleCount, pomodoroCurrentPhase, pomodoroIsFloating, playPomodoroNotificationSound, setPomodoroCycleCount, setPomodoroPhaseAndTime, setPomodoroIsMinimized, setPomodoroIsFloating, setPomodoroIsRunning]);

  const handlePomodoroMinimizeToggle = useCallback(() => {
    setPomodoroIsMinimized(!pomodoroIsMinimized);
  }, [pomodoroIsMinimized, setPomodoroIsMinimized]);

  const handlePomodoroDock = useCallback(() => {
    setPomodoroIsFloating(false);
    setPomodoroIsMinimized(false);
  }, [setPomodoroIsFloating, setPomodoroIsMinimized]);

  const handleLogin = (username: string, plainPasswordAttempt: string) => {
    const foundUser = users.find(
      (user) => user.username === username && user.password === plainPasswordAttempt
    );

    if (foundUser) {
      setCurrentUser(foundUser);
      setIsAuthenticated(true);
      setLoginError(null);
      // Set default view based on role after successful login
      switch (foundUser.role) {
        case UserRole.ADMINISTRADOR:
          setCurrentView('mainDashboard');
          break;
        case UserRole.USUARIO:
          setCurrentView('list'); // Or another appropriate default for User
          break;
        case UserRole.VENDEDOR:
          setCurrentView('list'); // Or another appropriate default for Salesperson
          break;
        default:
          setCurrentView('mainDashboard');
      }
    } else {
      setCurrentUser(null);
      setIsAuthenticated(false);
      setLoginError('Usuário ou senha inválidos.');
    }
  };

  const handleLogout = () => {
    setIsAuthenticated(false);
    setCurrentUser(null);
    setLoginError(null);
    // No Google Sign Out to handle
  };

  const handleUpdateUsers = (updatedUsers: User[]) => {
    setUsers(updatedUsers);
    // If current user was modified, update currentUser state
    if (currentUser) {
        const updatedCurrentUser = updatedUsers.find(u => u.id === currentUser.id);
        if (updatedCurrentUser) {
            setCurrentUser(updatedCurrentUser);
        } else { // Current user was deleted
            handleLogout();
        }
    }
  };

  const handleSaveQuote = useCallback((quote: Quote) => {
    let oldQuote: Quote | undefined;
    setQuotes(prevQuotes => {
      const existingIndex = prevQuotes.findIndex(q => q.id === quote.id);
      oldQuote = existingIndex > -1 ? prevQuotes[existingIndex] : undefined;
      let newQuotes;
      if (existingIndex > -1) {
        newQuotes = [...prevQuotes];
        newQuotes[existingIndex] = quote;
      } else {
        newQuotes = [...prevQuotes, quote];
      }
      return newQuotes.map(q => {
        if (q.clientId && (!q.clientDetails || q.clientDetails.id !== q.clientId)) {
          const client = clients.find(c => c.id === q.clientId);
          return { ...q, clientDetails: client, clientName: client ? client.name : q.clientName };
        }
        return q;
      }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    if (oldQuote &&
        oldQuote.installationProgress !== InstallationProgressStatus.COMPLETED &&
        quote.installationProgress === InstallationProgressStatus.COMPLETED) {
      handleAddPoints(POINTS_PER_TASK_COMPLETION);
    }

    setCurrentView('list');
    setEditingQuote(null);
    setInitialQuoteListFilter(null);
  }, [setQuotes, clients, handleAddPoints]);

  const handleAddClient = useCallback((client: Client) => {
    setClients(prevClients => {
      const existingClientById = prevClients.find(c => c.id === client.id);
      const existingClientByName = prevClients.find(c => c.name.toLowerCase() === client.name.toLowerCase());
      if (existingClientById || existingClientByName) {
        console.warn("Client already exists, not adding duplicate.");
        return prevClients.map(c => c.id === client.id || c.name.toLowerCase() === client.name.toLowerCase() ? client : c);
      }
      return [...prevClients, client];
    });
  }, [setClients]);

  const handleUpdateQuoteInstallationDetails = useCallback((updatedQuote: Quote) => {
    let oldQuoteProgress: InstallationProgressStatus | undefined;
    setQuotes(prevQuotes => {
      const index = prevQuotes.findIndex(q => q.id === updatedQuote.id);
      if (index === -1) return prevQuotes;
      oldQuoteProgress = prevQuotes[index].installationProgress;
      const newQuotes = [...prevQuotes];
      newQuotes[index] = { ...newQuotes[index], ...updatedQuote };
      return newQuotes.sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    });

    if (oldQuoteProgress &&
        oldQuoteProgress !== InstallationProgressStatus.COMPLETED &&
        updatedQuote.installationProgress === InstallationProgressStatus.COMPLETED) {
        handleAddPoints(POINTS_PER_TASK_COMPLETION);
    }
  }, [setQuotes, handleAddPoints]);


  const handleCreateNewQuote = () => {
    setEditingQuote(null);
    setInitialQuoteListFilter(null);
    setCurrentView('form');
  };

  const handleEditQuote = (quote: Quote) => {
    setEditingQuote(quote);
    setInitialQuoteListFilter(null);
    setCurrentView('form');
  };

  const handleDeleteQuote = (quoteId: string) => {
    if (window.confirm(`Tem certeza que deseja excluir o orçamento ${quoteId}? Esta ação não pode ser desfeita.`)) {
      setQuotes(prev => prev.filter(q => q.id !== quoteId));
    }
  };

  const handleViewQuote = (quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const quoteWithFullDetails = { ...quote, clientDetails: client || quote.clientDetails };
    setQuoteToPreview(quoteWithFullDetails);
  };

  const handleDownloadPdf = useCallback(async () => {
    if (!printRef.current || !quoteToPreview) return;
    if(!jsPDF || !html2canvas) return;

    requestAnimationFrame(async () => {
        try {
            const canvas = await html2canvas(printRef.current as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', imageTimeout: 15000, removeContainer: true });
            if (canvas.width === 0 || canvas.height === 0) return;
            let imgData = canvas.toDataURL('image/png', 1.0);
            if(!imgData || imgData === 'data:,') return;

            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pageRatio = pdfWidth / imgWidth;
            const scaledImgHeight = imgHeight * pageRatio;

            if (scaledImgHeight <= pdfHeight) {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledImgHeight);
            } else {
                let currentPosition = 0;
                const pageCanvasHeightPX = pdfHeight / pageRatio;
                while(currentPosition < imgHeight) {
                    const sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = imgWidth;
                    sliceCanvas.height = Math.max(0, Math.min(pageCanvasHeightPX, imgHeight - currentPosition));
                    if (sliceCanvas.width === 0 || sliceCanvas.height === 0) { currentPosition += pageCanvasHeightPX; continue; }
                    const sliceCtx = sliceCanvas.getContext('2d');
                    if(!sliceCtx) return;
                    sliceCtx.drawImage(canvas, 0, currentPosition, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height);
                    let pageImgData = sliceCanvas.toDataURL('image/png', 1.0);
                    if(!pageImgData || pageImgData === 'data:,') { currentPosition += pageCanvasHeightPX; continue; }
                    if (currentPosition > 0 || (pdf.getNumberOfPages() > 0 && currentPosition === 0) ) pdf.addPage();
                    pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, sliceCanvas.height * pageRatio );
                    currentPosition += pageCanvasHeightPX;
                }
            }
            pdf.save(`orcamento-${quoteToPreview.id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        } catch (error) { console.error("Error generating PDF:", error); }
    });
  }, [quoteToPreview]);

  const handleOpenServiceOrderPreview = useCallback((quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const quoteWithFullDetails = { ...quote, clientDetails: client || quote.clientDetails, installationAddress: quote.installationAddress || client?.address };
    setQuoteForOSPreview(quoteWithFullDetails);
  }, [clients]);

  const handleCloseServiceOrderPreview = useCallback(() => setQuoteForOSPreview(null), []);

  const handleDownloadServiceOrderPdf = useCallback(async () => {
    if (!osPrintRef.current || !quoteForOSPreview) return;
    if(!jsPDF || !html2canvas) return;
    requestAnimationFrame(async () => {
        try {
            const canvas = await html2canvas(osPrintRef.current as HTMLElement, { scale: 2, useCORS: true, logging: false, backgroundColor: '#ffffff', imageTimeout: 15000, removeContainer: true });
            if (canvas.width === 0 || canvas.height === 0) return;
            let imgData = canvas.toDataURL('image/png', 1.0);
            if(!imgData || imgData === 'data:,') return;
            const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
            const pdfWidth = pdf.internal.pageSize.getWidth();
            const pdfHeight = pdf.internal.pageSize.getHeight();
            const imgWidth = canvas.width;
            const imgHeight = canvas.height;
            const pageRatio = pdfWidth / imgWidth;
            const scaledImgHeight = imgHeight * pageRatio;
            if (scaledImgHeight <= pdfHeight) {
                pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, scaledImgHeight);
            } else {
                let currentPosition = 0;
                const pageCanvasHeightPX = pdfHeight / pageRatio;
                while(currentPosition < imgHeight) {
                    const sliceCanvas = document.createElement('canvas');
                    sliceCanvas.width = imgWidth;
                    sliceCanvas.height = Math.max(0, Math.min(pageCanvasHeightPX, imgHeight - currentPosition));
                    if (sliceCanvas.width === 0 || sliceCanvas.height === 0) { currentPosition += pageCanvasHeightPX; continue; }
                    const sliceCtx = sliceCanvas.getContext('2d');
                    if(!sliceCtx) return;
                    sliceCtx.drawImage(canvas, 0, currentPosition, imgWidth, sliceCanvas.height, 0, 0, imgWidth, sliceCanvas.height);
                    let pageImgData = sliceCanvas.toDataURL('image/png', 1.0);
                    if(!pageImgData || pageImgData === 'data:,') { currentPosition += pageCanvasHeightPX; continue; }
                    if (currentPosition > 0 || (pdf.getNumberOfPages() > 0 && currentPosition === 0) ) pdf.addPage();
                    pdf.addImage(pageImgData, 'PNG', 0, 0, pdfWidth, sliceCanvas.height * pageRatio);
                    currentPosition += pageCanvasHeightPX;
                }
            }
            pdf.save(`OS-${quoteForOSPreview.id.replace(/[^a-zA-Z0-9]/g, '_')}.pdf`);
        } catch (error) { console.error("Error generating OS PDF:", error); }
    });
  }, [quoteForOSPreview]);

  const handleOpenInstallationDetailsModal = useCallback((quote: Quote) => {
    const client = clients.find(c => c.id === quote.clientId);
    const quoteWithFullDetails = { ...quote, clientDetails: client || quote.clientDetails, installationAddress: quote.installationAddress || client?.address || '' };
    setSelectedQuoteForInstallationModal(quoteWithFullDetails);
    setIsInstallationModalOpen(true);
  }, [clients]);

  const handleCloseInstallationDetailsModal = useCallback(() => {
    setSelectedQuoteForInstallationModal(null);
    setIsInstallationModalOpen(false);
  }, []);

  const handleSaveFromInstallationDetailsModal = useCallback((updatedQuote: Quote) => {
    handleUpdateQuoteInstallationDetails(updatedQuote);
    handleCloseInstallationDetailsModal();
  }, [handleUpdateQuoteInstallationDetails, handleCloseInstallationDetailsModal]);

  const handleOpenManualTransactionModal = useCallback((type: 'income' | 'expense', transaction?: ManualTransaction) => {
    setManualTransactionModalType(type);
    setEditingManualTransaction(transaction || null);
    setIsManualTransactionModalOpen(true);
  }, []);

  const handleCloseManualTransactionModal = useCallback(() => {
    setEditingManualTransaction(null);
    setIsManualTransactionModalOpen(false);
  }, []);

  const handleSaveManualTransaction = useCallback((transaction: ManualTransaction) => {
    setManualTransactions(prev => {
      const existingIndex = prev.findIndex(t => t.id === transaction.id);
      if (existingIndex > -1) {
        const updated = [...prev];
        updated[existingIndex] = transaction;
        return updated;
      }
      return [...prev, transaction];
    });
    handleCloseManualTransactionModal();
  }, [setManualTransactions, handleCloseManualTransactionModal]);

  const handleDeleteManualTransaction = useCallback((transactionId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este lançamento financeiro?")) {
      setManualTransactions(prev => prev.filter(t => t.id !== transactionId));
    }
  }, [setManualTransactions]);

  const handleSaveImportantLink = useCallback((link: ImportantLink) => {
    setImportantLinks(prev => {
        const existingIndex = prev.findIndex(l => l.id === link.id);
        if (existingIndex > -1) {
            const updated = [...prev];
            updated[existingIndex] = link;
            return updated;
        }
        return [...prev, link];
    });
  }, [setImportantLinks]);

  const handleDeleteImportantLink = useCallback((linkId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este link importante?")) {
        setImportantLinks(prev => prev.filter(l => l.id !== linkId));
    }
  }, [setImportantLinks]);

  const handleChartNavigation = useCallback((filter: QuoteListChartFilter) => {
    setInitialQuoteListFilter(filter);
    setCurrentView('list');
  }, []);

  const clearInitialQuoteListFilter = useCallback(() => setInitialQuoteListFilter(null), []);

  const allNavItems: NavItemEntry[] = [
      { id: 'mainDashboard', name: 'Dashboard', title: 'Dashboard', view: 'mainDashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" /></svg> },
      { id: 'list', name: 'Gerenciador de Orçamentos', title: 'Gerenciador de Orçamentos', view: 'list', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M9 17.25v1.007a3 3 0 01-.879 2.122L7.5 21M9 17.25v-1.007a3 3 0 00-.879-2.122L7.5 15M21 17.25v1.007a3 3 0 01-.879 2.122L19.5 21M21 17.25v-1.007a3 3 0 00-.879-2.122L19.5 15M3 17.25v1.007a3 3 0 01-.879 2.122L1.5 21M3 17.25v-1.007a3 3 0 00-.879-2.122L1.5 15M12 17.25v1.007a3 3 0 01-.879 2.122L10.5 21M12 17.25v-1.007a3 3 0 00-.879-2.122L10.5 15" /><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75h.008v.008H12V6.75zm0 3.75h.008v.008H12v-.008zm0 3.75h.008v.008H12v-.008zm0-11.25H12a2.25 2.25 0 00-2.25 2.25v.044H9.75v-.044A2.25 2.25 0 0112 0h.01M12 3h.01M12 9h.01M6.75 6.75h.008v.008H6.75V6.75zm0 3.75h.008v.008H6.75v-.008zm0 3.75h.008v.008H6.75v-.008zM3 3h.01M3 6h.01M3 9h.01M17.25 6.75h.008v.008H17.25V6.75zm0 3.75h.008v.008H17.25v-.008zm0 3.75h.008v.008H17.25v-.008zM21 3h-.01M21 6h-.01M21 9h-.01" /></svg> },
      { id: 'serviceOrderDashboard', name: 'Ordens de Serviço', title: 'Dashboard O.S.', view: 'serviceOrderDashboard', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M11.42 15.17L17.25 21A2.652 2.652 0 0021 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.528-1.036.926-2.185.926-3.345A4.5 4.5 0 0011.42 3.75c-1.16 0-2.309.398-3.345.926L3.75 11.42M11.42 15.17L3.75 11.42" /></svg> },
      { id: 'reports', name: 'Relatórios', title: 'Relatórios', view: 'reports', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 3v11.25A2.25 2.25 0 006 16.5h12M3.75 3h-1.5m1.5 0h16.5m0 0h1.5M12 3v11.25m0 0h-1.125M12 14.25v4.5A2.25 2.25 0 019.75 21H7.5M12 14.25S13.875 12 16.5 12h3.75M12 14.25S10.125 12 7.5 12H3.75" /></svg> },
      { id: 'adminDivider', name: 'Admin', type: 'divider'},
      { id: 'financial', name: 'Financeiro', title: 'Financeiro', view: 'financial', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M2.25 18.75a60.07 60.07 0 0115.797 2.101c.727.198 1.453-.342 1.453-1.096V18.75M3.75 4.5v.75A.75.75 0 013 6h-.75m0 0v-.75A.75.75 0 013 4.5h.75m0 0H21m-9 12.75h5.25m0 0H21m-2.25 0V12m0 6.75V12M3 12.75H18v2.25H3v-2.25z" /></svg> },
      { id: 'settings', name: 'Empresas', title: 'Configurações', view: 'settings', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6m-6 3.75h6m-6 3.75h6m-6 3.75h6M4.5 21v-3.375c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125V21" /></svg> }, // Includes User Management for Admins
      { id: 'focus', name: 'Foco & Recompensas', title: 'Foco & Recompensas', view: 'focus', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>},
      // { id: 'importantFiles', name: 'Usuários', title: 'Arquivos Importantes', view: 'importantFiles', icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-3"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];


  const getFilteredNavItems = (): NavItemEntry[] => {
    if (!currentUser) return [];
    switch (currentUser.role) {
      case UserRole.ADMINISTRADOR:
        return allNavItems;
      case UserRole.USUARIO:
        return allNavItems.filter(item => item.id !== 'financial' && item.id !== 'mainDashboard' && item.id !== 'settings' && item.id !== 'adminDivider' && item.id !== 'teamManagement' /* Also hide original team management from user */);
      case UserRole.VENDEDOR:
        return allNavItems.filter(item => item.id === 'focus' || item.id === 'list');
      default:
        return [];
    }
  };

  const navItems = getFilteredNavItems();
  const currentViewTitle = navItems.find(item => item.view === currentView)?.title || APP_NAME;

  const renderView = () => {
    let viewToRender: AppView;

    // Check if currentView is allowed for the current user
    const isViewAllowedForUser = navItems.some(item => item.view === currentView);

    if (currentView === 'form') {
      viewToRender = 'form'; // Always allow form view if explicitly set
    } else if (isViewAllowedForUser) {
      viewToRender = currentView;
    } else {
      // If currentView is not allowed, redirect to the first allowed nav item or a default view
      const defaultView = navItems.find(item => item.type !== 'divider')?.view;
      viewToRender = defaultView || (currentUser?.role === UserRole.ADMINISTRADOR ? 'mainDashboard' : 'list');
      if (currentView !== viewToRender) {
         setTimeout(() => setCurrentView(viewToRender), 0);
      }
    }


    switch (viewToRender) {
      case 'mainDashboard':
        return <MainDashboardView quotes={quotes} clients={clients} products={products} userPoints={userPoints} />;
      case 'list':
        return <QuoteList quotes={quotes} onEdit={handleEditQuote} onView={handleViewQuote} onDelete={handleDeleteQuote} initialFilter={initialQuoteListFilter} clearInitialFilter={clearInitialQuoteListFilter} />;
      case 'form':
        return <QuoteForm initialQuote={editingQuote} onSave={handleSaveQuote} onCancel={() => { setCurrentView(currentUser?.role === UserRole.ADMINISTRADOR ? 'mainDashboard' : 'list'); setEditingQuote(null); setInitialQuoteListFilter(null); }} isEditing={!!editingQuote} clients={clients} products={products} appSettings={appSettings} onAddClient={handleAddClient} />;
      case 'settings':
        if (currentUser?.role !== UserRole.ADMINISTRADOR) return <p>Acesso negado.</p>;
        return <SettingsView companyInfo={companyInfo} onSaveCompanyInfo={setCompanyInfo} clients={clients} onUpdateClients={setClients} products={products} onUpdateProducts={setProducts} appSettings={appSettings} onSaveAppSettings={setAppSettings} users={users} onUpdateUsers={handleUpdateUsers} />;
      case 'teamManagement': // This view is now less prominent, may be removed or refactored
        return <TeamManagementView quotes={quotes.filter(q => q.status === QuoteStatus.APPROVED && q.installationProgress !== InstallationProgressStatus.CANCELED)} clients={clients} onUpdateQuote={handleUpdateQuoteInstallationDetails} onOpenInstallationModal={handleOpenInstallationDetailsModal} onGenerateServiceOrder={handleOpenServiceOrderPreview} onTaskCompleted={handleAddPoints} />;
      case 'serviceOrderDashboard':
        return <ServiceOrderDashboardView quotes={quotes} clients={clients} onGenerateServiceOrder={handleOpenServiceOrderPreview} />;
      case 'financial':
        return <FinancialView quotes={quotes} clients={clients} manualTransactions={manualTransactions} onOpenManualTransactionModal={handleOpenManualTransactionModal} onDeleteManualTransaction={handleDeleteManualTransaction} />;
      case 'importantFiles': 
         if (currentUser?.role !== UserRole.ADMINISTRADOR) return <p>Acesso negado.</p>;
         setTimeout(() => setCurrentView('settings'), 0);
         return <SettingsView companyInfo={companyInfo} onSaveCompanyInfo={setCompanyInfo} clients={clients} onUpdateClients={setClients} products={products} onUpdateProducts={setProducts} appSettings={appSettings} onSaveAppSettings={setAppSettings} users={users} onUpdateUsers={handleUpdateUsers} />;
      case 'reports':
        return <ReportsView quotes={quotes} clients={clients} products={products} />;
      case 'focus':
        return <FocusView userPoints={userPoints} onAddPoints={handleAddPoints} dailyTasks={dailyTasks} onSaveDailyTask={handleSaveDailyTask} onDeleteDailyTask={handleDeleteDailyTask} />;
      case 'oldDashboard':
        return <OldDashboard quotes={quotes} clients={clients} manualTransactions={manualTransactions} onUpdateQuote={handleSaveQuote} onChartNavigation={handleChartNavigation} />;
      default:
        // Fallback default view
        const fallbackView = currentUser?.role === UserRole.ADMINISTRADOR ? 'mainDashboard' : 'list';
        if (currentView !== fallbackView) {
            setTimeout(() => setCurrentView(fallbackView), 0);
        }
        return <MainDashboardView quotes={quotes} clients={clients} products={products} userPoints={userPoints} />;
    }
  };

  const userDisplayName = currentUser?.name || appSettings.defaultSalesperson || "Usuário";
  const userRoleDisplay = currentUser?.role || "Cargo";

  if (!isAuthenticated) {
    return <LoginView onLoginSuccess={handleLogin} setLoginAttemptError={setLoginError} loginError={loginError} companyLogoUrl={companyInfo.logoUrl} companyName={companyInfo.name || APP_NAME} />;
  }

  return (
    <div className="flex h-screen bg-secondary-100">
      <audio ref={pomodoroAudioRef} src="https://assets.mixkit.co/sfx/preview/mixkit-clear-announce-tones-2861.mp3" preload="auto"></audio>

      {/* Sidebar */}
      <nav className={`flex flex-col bg-secondary-800 text-secondary-100 transition-all duration-300 ease-in-out ${isSidebarCollapsed ? 'w-20' : 'w-72'} shadow-lg`}>
        <div className="flex items-center justify-center h-20 border-b border-secondary-700">
          {companyInfo.logoUrl ? (
            <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className={`object-contain transition-all duration-300 ${isSidebarCollapsed ? 'h-10' : 'h-12'}`} />
          ) : (
            <span className={`font-bold text-white transition-opacity duration-300 ${isSidebarCollapsed ? 'opacity-0 text-sm' : 'opacity-100 text-xl'}`}>{companyInfo.name.substring(0,1)}</span>
          )}
          {!isSidebarCollapsed && <h1 className="ml-3 text-lg font-semibold text-white">{companyInfo.name || APP_NAME}</h1>}
        </div>

        {!isSidebarCollapsed && currentUser && (
          <div className="p-4 border-b border-secondary-700">
            <div className="flex items-center">
              <div className="w-10 h-10 rounded-full bg-primary-500 flex items-center justify-center text-white font-semibold mr-3">
                {userDisplayName?.[0]?.toUpperCase() || 'U'}
              </div>
              <div>
                <p className="text-sm font-semibold text-white">{userDisplayName}</p>
                <p className="text-xs text-secondary-400">{userRoleDisplay}</p>
              </div>
            </div>
          </div>
        )}

        <div className="flex-grow p-3 space-y-1.5 overflow-y-auto">
          {navItems.map(item => {
            if (item.type === 'divider') {
              if (isSidebarCollapsed) return null;
              return <div key={item.id} className={`my-2 border-t border-secondary-700 mx-4`}>
                 <span className="block text-xs text-secondary-500 font-semibold uppercase mt-2 mb-1 px-2">{item.name}</span>
              </div>;
            }
            // If not a divider, item is NavViewEntry.
            // Explicitly cast to NavViewEntry to resolve TypeScript inference issues.
            const viewItem = item as NavViewEntry;
            return (
            <button
                key={viewItem.id}
                onClick={() => { setInitialQuoteListFilter(null); setCurrentView(viewItem.view); }}
                title={viewItem.name}
                className={`w-full flex items-center h-11 px-3 rounded-md text-sm font-medium transition-colors group
                            ${currentView === viewItem.view
                                ? 'bg-primary-500 text-white shadow-md'
                                : `text-secondary-300 hover:bg-secondary-700 hover:text-white focus:bg-secondary-700 focus:text-white outline-none`}
                            ${isSidebarCollapsed ? 'justify-center' : ''}`}
            >
                {viewItem.icon}
                {!isSidebarCollapsed && <span className="transition-opacity duration-200">{viewItem.name}</span>}
            </button>
            );
        })}
        </div>

        <div className="p-4 border-t border-secondary-700">
            <Button onClick={handleCreateNewQuote} className="w-full bg-primary-600 hover:bg-primary-700 text-white" leftIcon={isSidebarCollapsed ? null : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>} >
            {isSidebarCollapsed ? <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg> : 'Novo Orçamento'}
            </Button>
        </div>

        <div className={`p-3 border-t border-secondary-700 ${isSidebarCollapsed ? 'flex flex-col items-center space-y-2' : ''}`}>
           <button
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            className={`w-full flex items-center text-secondary-300 hover:bg-secondary-700 hover:text-white p-2 rounded-md transition-colors ${isSidebarCollapsed ? 'justify-center' : ''}`}
            title={isSidebarCollapsed ? "Expandir Menu" : "Recolher Menu"}
            >
            {isSidebarCollapsed ?
                <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5-7.5M8.25 4.5L1.5 12l6.75-7.5" transform="rotate(180 12 12) translate(0 -1.5)" /></svg> // >>
                : <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5 M15.75 19.5L8.25 12l7.5-7.5" transform="translate(1.5 0)" /></svg> // <<
            }
            {!isSidebarCollapsed && <span className="text-sm">Recolher</span>}
            </button>
            {!isSidebarCollapsed &&
                <p className="mt-3 text-center text-xs text-secondary-400">&copy; {new Date().getFullYear()} {companyInfo.name}.</p>
            }
        </div>

      </nav>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Bar */}
        <header className="h-16 bg-white border-b border-secondary-200 flex items-center justify-between px-6 shadow-sm shrink-0">
          <h2 className="text-xl font-semibold text-secondary-800">{currentViewTitle}</h2>
          <div className="flex items-center space-x-4">
            <button className="text-secondary-500 hover:text-primary-600 focus:outline-none" title="Notificações">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0" /></svg>
            </button>
             <div className="h-8 w-px bg-secondary-300"></div>
            <Button onClick={handleLogout} variant="ghost" size="sm" className="text-secondary-600 hover:text-primary-600" leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" /></svg>}>
              Sair
            </Button>
          </div>
        </header>

        {/* Page Content */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-6 bg-secondary-50">
          {renderView()}
        </main>
      </div>

      <PomodoroTimer
        timeLeft={pomodoroTimeLeft}
        currentPhase={pomodoroCurrentPhase}
        isRunning={pomodoroIsRunning}
        pomodoroCount={pomodoroCycleCount}
        isFloating={pomodoroIsFloating}
        isMinimized={pomodoroIsMinimized}
        isFocusViewActive={currentView === 'focus'}
        audioRef={pomodoroAudioRef}
        onStartFloating={handlePomodoroStartTimerAndFloat}
        onPausePlay={handlePomodoroPausePlay}
        onResetCycle={handlePomodoroResetCycle}
        onSkipPhase={handlePomodoroSkipPhase}
        onMinimizeToggle={handlePomodoroMinimizeToggle}
        onDock={handlePomodoroDock}
      />

      <Modal isOpen={!!quoteToPreview} onClose={() => setQuoteToPreview(null)} title={`Visualizar Orçamento #${quoteToPreview?.id}`} size="xl"
        footer={ <div className="flex justify-end space-x-3"> <Button variant="secondary" onClick={() => setQuoteToPreview(null)}>Fechar</Button> <Button variant="primary" onClick={handleDownloadPdf} leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>} > Baixar PDF do Orçamento </Button> </div> } >
        <div id="quote-preview-content-for-pdf"> {quoteToPreview && <QuotePrintPreview quote={quoteToPreview} companyInfo={companyInfo} printRef={printRef} />} </div>
      </Modal>

      <Modal isOpen={!!quoteForOSPreview} onClose={handleCloseServiceOrderPreview} title={`Visualizar Ordem de Serviço - OS-${quoteForOSPreview?.id}`} size="xl"
        footer={ <div className="flex justify-end space-x-3"> <Button variant="secondary" onClick={handleCloseServiceOrderPreview}>Fechar</Button> <Button variant="primary" onClick={handleDownloadServiceOrderPdf} leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M3 16.5v2.25A2.25 2.25 0 005.25 21h13.5A2.25 2.25 0 0021 18.75V16.5M16.5 12L12 16.5m0 0L7.5 12m4.5 4.5V3" /></svg>} > Baixar PDF da O.S. </Button> </div> } >
        <div id="os-preview-content-for-pdf"> {quoteForOSPreview && <ServiceOrderPrintPreview quote={quoteForOSPreview} companyInfo={companyInfo} printRef={osPrintRef} />} </div>
      </Modal>

      {selectedQuoteForInstallationModal && ( <InstallationDetailsModal isOpen={isInstallationModalOpen} onClose={handleCloseInstallationDetailsModal} quote={selectedQuoteForInstallationModal} onSave={handleSaveFromInstallationDetailsModal} onGenerateServiceOrder={handleOpenServiceOrderPreview} /> )}
      {isManualTransactionModalOpen && ( <ManualTransactionModal isOpen={isManualTransactionModalOpen} onClose={handleCloseManualTransactionModal} onSave={handleSaveManualTransaction} initialTransaction={editingManualTransaction} transactionType={manualTransactionModalType} /> )}
    </div>
  );
};

export default App;
