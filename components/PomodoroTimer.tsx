
import React from 'react';
import ReactDOM from 'react-dom';
import { PomodoroPhase } from '../types';
import Button from './common/Button';
import { 
  POMODORO_WORK_DURATION,
  POMODORO_SHORT_BREAK_DURATION,
  POMODORO_LONG_BREAK_DURATION,
} from '../constants';

interface PomodoroTimerProps {
  timeLeft: number;
  currentPhase: PomodoroPhase;
  isRunning: boolean;
  pomodoroCount: number;
  isFloating: boolean;
  isMinimized: boolean;
  isFocusViewActive: boolean; // New prop: true if currentView in App.tsx is 'focus'
  audioRef: React.RefObject<HTMLAudioElement>; // Pass audioRef if needed for direct control, though sound is played by App.tsx

  onStartFloating: () => void;
  onPausePlay: () => void;
  onResetCycle: () => void;
  onSkipPhase: () => void;
  onMinimizeToggle: () => void;
  onDock: () => void;
}

const PomodoroTimer: React.FC<PomodoroTimerProps> = ({
  timeLeft,
  currentPhase,
  isRunning,
  pomodoroCount,
  isFloating,
  isMinimized,
  isFocusViewActive,
  audioRef, // Can be removed if App.tsx handles all audio play
  onStartFloating,
  onPausePlay,
  onResetCycle,
  onSkipPhase,
  onMinimizeToggle,
  onDock,
}) => {

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const getPhaseName = (phase: PomodoroPhase) => {
    switch (phase) {
      case 'work': return 'Foco!';
      case 'shortBreak': return 'Pausa Curta';
      case 'longBreak': return 'Pausa Longa';
      default: return '';
    }
  };

  const getPhaseColor = (phase: PomodoroPhase, type: 'bg' | 'text' | 'border' = 'bg') => {
    const colors = {
      work: { bg: 'bg-primary-600', text: 'text-primary-600', border: 'border-primary-600' },
      shortBreak: { bg: 'bg-green-500', text: 'text-green-500', border: 'border-green-500' },
      longBreak: { bg: 'bg-blue-500', text: 'text-blue-500', border: 'border-blue-500' },
    };
    return colors[phase]?.[type] || 'bg-secondary-500';
  };

  const floatingUI = () => {
    if (!isFloating) return null;

    if (isMinimized) {
      return ReactDOM.createPortal(
        <div className="fixed bottom-4 right-4 z-[9999]">
          <Button
            onClick={onMinimizeToggle}
            variant="primary"
            size="sm"
            className={`shadow-xl ${getPhaseColor(currentPhase)} hover:opacity-90`}
            title="Restaurar Timer"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
            {formatTime(timeLeft)}
          </Button>
        </div>,
        document.body
      );
    }

    return ReactDOM.createPortal(
      <div className={`fixed bottom-4 right-4 z-[9998] p-4 bg-white rounded-lg shadow-2xl border-2 ${getPhaseColor(currentPhase, 'border')} w-72 transform transition-all duration-300 ease-in-out`}>
        <div className="flex justify-between items-center mb-2">
          <h4 className={`text-sm font-semibold ${getPhaseColor(currentPhase, 'text')}`}>{getPhaseName(currentPhase)}</h4>
          <div className="flex space-x-1">
            <Button onClick={onMinimizeToggle} variant="ghost" size="sm" className="p-1 text-secondary-500 hover:text-secondary-700" title="Minimizar">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 12h-15" /></svg>
            </Button>
            <Button onClick={onDock} variant="ghost" size="sm" className="p-1 text-secondary-500 hover:text-secondary-700" title="Fixar no Painel">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M3 8.25V18a2.25 2.25 0 002.25 2.25h13.5A2.25 2.25 0 0021 18V8.25m-18 0V6a2.25 2.25 0 012.25-2.25h13.5A2.25 2.25 0 0121 6v2.25m-18 0h18M5.25 6.375l7.5-3 7.5 3M5.25 6.375V18m13.5-11.625V18" /></svg>
            </Button>
          </div>
        </div>
        <div className={`text-5xl font-mono font-bold text-center mb-3 ${getPhaseColor(currentPhase, 'text')}`}>
          {formatTime(timeLeft)}
        </div>
        <Button onClick={onPausePlay} variant="primary" size="md" className={`w-full ${getPhaseColor(currentPhase)} hover:opacity-90`}>
          {isRunning ? 'Pausar' : (timeLeft > 0 && timeLeft < (currentPhase === 'work' ? POMODORO_WORK_DURATION : currentPhase === 'shortBreak' ? POMODORO_SHORT_BREAK_DURATION : POMODORO_LONG_BREAK_DURATION) * 60 ? 'Continuar' : 'Iniciar')}
        </Button>
      </div>,
      document.body
    );
  };
  
  const dockedPlaceholderUI = () => (
    <div className="text-center p-6 border border-secondary-200 rounded-lg bg-secondary-50 shadow-md">
      <div className="flex items-center justify-center mb-3">
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-10 h-10 text-primary-500 animate-pulse mr-3">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <div>
          <p className="text-secondary-700 font-semibold text-lg">O temporizador está ativo e flutuando!</p>
          <p className="text-sm text-secondary-600">Fase atual: {getPhaseName(currentPhase)} | Tempo: {formatTime(timeLeft)}</p>
        </div>
      </div>
      <Button onClick={onDock} variant="secondary" size="md">
        Ver Controles / Fixar no Painel
      </Button>
    </div>
  );

  const dockedControlsUI = () => (
    <div className="flex flex-col items-center p-6 border border-secondary-200 rounded-lg shadow-md bg-secondary-50">
      <div className={`w-full p-4 mb-6 rounded-md text-center text-xl font-semibold ${getPhaseColor(currentPhase)} text-white`}>
        {getPhaseName(currentPhase)}
      </div>
      <div className="text-7xl font-mono font-bold text-secondary-800 mb-6 tabular-nums">
        {formatTime(timeLeft)}
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 mb-6 w-full max-w-lg">
        <Button onClick={onStartFloating} variant="primary" size="lg" className="w-full">
          {isRunning ? 'Pausar' : (timeLeft > 0 && timeLeft < (currentPhase === 'work' ? POMODORO_WORK_DURATION : currentPhase === 'shortBreak' ? POMODORO_SHORT_BREAK_DURATION : POMODORO_LONG_BREAK_DURATION) * 60 ? 'Continuar e Flutuar' : 'Iniciar e Flutuar')}
        </Button>
        <Button onClick={onResetCycle} variant="secondary" size="lg" className="w-full">
          Reiniciar Ciclo
        </Button>
        <Button onClick={onSkipPhase} variant="ghost" size="lg" className="w-full text-sm">
          Pular Fase
        </Button>
      </div>
      <p className="text-sm text-secondary-600">
        Ciclos de foco completados: <span className="font-semibold">{pomodoroCount}</span>
      </p>
    </div>
  );

  // Render Logic
  if (isFloating) {
    return (
      <>
        {floatingUI()}
        {isFocusViewActive && dockedPlaceholderUI()}
      </>
    );
  } else { // Not floating
    if (isFocusViewActive) {
      return dockedControlsUI();
    }
    return null; // Don't render anything if not floating and not in focus view
  }
};

export default PomodoroTimer;
