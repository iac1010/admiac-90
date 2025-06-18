import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Quote, InstallationProgressStatus, Client } from '../types';
import Button from './common/Button';
// MiniCalendar removed as Google Sync is removed and calendar functionality will be different or part of another view
import { KANBAN_COLUMN_TITLES, INSTALLATION_PROGRESS_STATUS_OPTIONS } from '../constants'; 

interface TeamManagementViewProps {
  quotes: Quote[]; 
  clients: Client[];
  onUpdateQuote: (updatedQuote: Quote) => void;
  onOpenInstallationModal: (quote: Quote) => void;
  onGenerateServiceOrder: (quote: Quote) => void; 
  onTaskCompleted: (points: number) => void; // For gamification
}

type KanbanColumnKey = keyof typeof KANBAN_COLUMN_TITLES;

const TeamManagementView: React.FC<TeamManagementViewProps> = ({
  quotes,
  clients,
  onUpdateQuote,
  onOpenInstallationModal,
  onGenerateServiceOrder, 
  onTaskCompleted,
}) => {
  const [todoQuotes, setTodoQuotes] = useState<Quote[]>([]);
  const [doingQuotes, setDoingQuotes] = useState<Quote[]>([]);
  const [completedQuotes, setCompletedQuotes] = useState<Quote[]>([]);
  const [draggedQuoteId, setDraggedQuoteId] = useState<string | null>(null);

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const monthlyInstallationCosts = useMemo(() => {
    return quotes.reduce((total, quote) => {
      if (quote.installationDate && typeof quote.installationCost === 'number') {
        const instDate = new Date(quote.installationDate + "T00:00:00");
        if (instDate.getMonth() === currentMonth && instDate.getFullYear() === currentYear) {
          return total + quote.installationCost;
        }
      }
      return total;
    }, 0);
  }, [quotes, currentMonth, currentYear]);


  useEffect(() => {
    const todos: Quote[] = [];
    const doings: Quote[] = [];
    const completeds: Quote[] = [];

    quotes.forEach(quote => {
      const client = clients.find(c => c.id === quote.clientId);
      const quoteWithClient = { 
        ...quote, 
        clientDetails: client || quote.clientDetails,
        clientName: client ? client.name : quote.clientName,
        installationAddress: quote.installationAddress || client?.address || 'N/A'
      };

      switch (quote.installationProgress) {
        case InstallationProgressStatus.NOT_STARTED:
        case InstallationProgressStatus.SCHEDULED:
        case InstallationProgressStatus.ON_HOLD:
          todos.push(quoteWithClient);
          break;
        case InstallationProgressStatus.IN_PROGRESS:
          doings.push(quoteWithClient);
          break;
        case InstallationProgressStatus.COMPLETED:
          completeds.push(quoteWithClient);
          break;
        default: 
          break;
      }
    });
    setTodoQuotes(todos.sort((a,b) => new Date(a.installationDate || 0).getTime() - new Date(b.installationDate || 0).getTime()));
    setDoingQuotes(doings.sort((a,b) => new Date(a.installationDate || 0).getTime() - new Date(b.installationDate || 0).getTime()));
    setCompletedQuotes(completeds.sort((a,b) => new Date(a.installationDate || 0).getTime() - new Date(b.installationDate || 0).getTime()));
  }, [quotes, clients]);

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, quoteId: string) => {
    setDraggedQuoteId(quoteId);
    e.dataTransfer.setData('text/plain', quoteId);
    e.currentTarget.style.opacity = '0.4';
  };
  
  const handleDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedQuoteId(null);
  };

  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault(); 
    e.currentTarget.classList.add('bg-primary-50');
  };
  
  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-primary-50');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, targetColumn: KanbanColumnKey) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary-50');
    if (!draggedQuoteId) return;

    const quoteToUpdate = quotes.find(q => q.id === draggedQuoteId);
    if (!quoteToUpdate) return;

    let newProgressStatus: InstallationProgressStatus;
    switch (targetColumn) {
      case 'TODO':
        newProgressStatus = InstallationProgressStatus.SCHEDULED; 
        break;
      case 'DOING':
        newProgressStatus = InstallationProgressStatus.IN_PROGRESS;
        break;
      case 'COMPLETED':
        newProgressStatus = InstallationProgressStatus.COMPLETED;
        break;
      default:
        return; 
    }

    if (quoteToUpdate.installationProgress !== newProgressStatus) {
      onUpdateQuote({ ...quoteToUpdate, installationProgress: newProgressStatus });
      // Point awarding is handled in App.tsx's onUpdateQuote logic
    }
    setDraggedQuoteId(null);
  };

  const getProgressColorClass = (status?: InstallationProgressStatus) => {
    switch (status) {
      case InstallationProgressStatus.COMPLETED: return 'border-green-500';
      case InstallationProgressStatus.IN_PROGRESS: return 'border-blue-500';
      case InstallationProgressStatus.SCHEDULED: return 'border-yellow-500';
      case InstallationProgressStatus.ON_HOLD: return 'border-orange-500';
      case InstallationProgressStatus.NOT_STARTED: return 'border-gray-400';
      default: return 'border-secondary-300';
    }
  };
  
  const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return 'N/A';
    const dateToFormat = dateString.length === 10 ? `${dateString}T00:00:00` : dateString;
    const defaultOptions: Intl.DateTimeFormatOptions = { day: '2-digit', month: '2-digit', year: 'numeric' };
    return new Date(dateToFormat).toLocaleDateString('pt-BR', options || defaultOptions);
  };
  
  const renderKanbanCard = (quote: Quote) => (
    <div
      key={quote.id}
      draggable
      onDragStart={(e) => handleDragStart(e, quote.id)}
      onDragEnd={handleDragEnd}
      className={`p-3 mb-3 bg-white rounded-md shadow-sm border-l-4 ${getProgressColorClass(quote.installationProgress)} cursor-grab active:cursor-grabbing`}
    >
      <p className="text-xs text-secondary-500">O.S.: {quote.id}</p>
      <p className="font-semibold text-sm text-secondary-800">{quote.clientName}</p>
      <p className="text-xs text-secondary-600 truncate" title={quote.installationAddress}>
        Local: {quote.installationAddress}
      </p>
      <p className="text-xs text-secondary-600">
        Data: {formatDate(quote.installationDate)}
      </p>
      <Button 
        size="sm" 
        variant="ghost" 
        className="text-primary-600 hover:text-primary-700 p-1 mt-2 text-xs w-full justify-start"
        onClick={() => onOpenInstallationModal(quote)}
      >
        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5 mr-1"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
        Ver/Gerenciar Detalhes
      </Button>
    </div>
  );

  const columns: { key: KanbanColumnKey; title: string; quotes: Quote[] }[] = [
    { key: 'TODO', title: KANBAN_COLUMN_TITLES.TODO, quotes: todoQuotes },
    { key: 'DOING', title: KANBAN_COLUMN_TITLES.DOING, quotes: doingQuotes },
    { key: 'COMPLETED', title: KANBAN_COLUMN_TITLES.COMPLETED, quotes: completedQuotes },
  ];

  return (
    <div className="p-0 md:p-6 bg-white shadow-lg rounded-lg space-y-8">
      <div className="px-6 md:px-0 pt-6 md:pt-0">
        <h2 className="text-2xl font-semibold text-secondary-800 mb-2">
          Kanban de Instalações (Antigo Team Management)
        </h2>
        <div className="bg-primary-50 p-3 rounded-md border border-primary-200 mb-6">
            <p className="text-md font-medium text-primary-700">
                Total de Custos de Instalação no Mês Atual: 
                <span className="font-bold ml-2">R$ {monthlyInstallationCosts.toFixed(2)}</span>
            </p>
        </div>
      </div>
      
      {/* Kanban Section */}
      <div className="px-6 md:px-0">
        {quotes.length === 0 ? (
            <p className="text-secondary-600 text-center py-8">Nenhuma ordem de serviço (orçamento aprovado e não cancelado) para exibir.</p>
        ) : (
            <div className="flex flex-col md:flex-row space-y-4 md:space-y-0 md:space-x-4">
                {columns.map(column => (
                <div
                    key={column.key}
                    className="flex-1 bg-secondary-100 p-4 rounded-lg min-h-[300px] border border-secondary-200 transition-colors"
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onDrop={(e) => handleDrop(e, column.key)}
                >
                    <h4 className="text-lg font-semibold text-secondary-700 mb-4 sticky top-0 bg-secondary-100 py-2 z-10">
                    {column.title} <span className="text-sm font-normal text-secondary-500">({column.quotes.length})</span>
                    </h4>
                    <div className="space-y-3 overflow-y-auto max-h-[calc(100vh-450px)] md:max-h-[calc(100vh-400px)]">
                    {column.quotes.length > 0 ? (
                        column.quotes.map(quote => renderKanbanCard(quote))
                    ) : (
                        <p className="text-sm text-secondary-500 text-center py-4">Nenhuma O.S. nesta etapa.</p>
                    )}
                    {column.quotes.length === 0 && <div className="h-10"></div>}
                    </div>
                </div>
                ))}
            </div>
        )}
      </div>
    </div>
  );
};

export default TeamManagementView;