
import React, { useState, useMemo, useCallback, useEffect } from 'react';
import { Quote, QuoteStatus, InstallationProgressStatus, Client, ManualTransaction, QuoteListChartFilter } from '../types';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import MiniCalendar from './MiniCalendar';
import Button from './common/Button';
import { QUOTE_STATUS_OPTIONS } from '../constants'; // Removed DASHBOARD_QUOTE_KANBAN_COLUMN_TITLES as it's not used here

interface OldDashboardProps { // Renamed from DashboardProps
  quotes: Quote[];
  clients: Client[];
  manualTransactions: ManualTransaction[];
  onUpdateQuote: (updatedQuote: Quote) => void;
  onChartNavigation: (filter: QuoteListChartFilter) => void;
}

const OldDashboard: React.FC<OldDashboardProps> = ({ // Renamed from Dashboard
  quotes, 
  clients, 
  manualTransactions,
  onUpdateQuote,
  onChartNavigation
}) => {
  const [selectedCalendarDateDetails, setSelectedCalendarDateDetails] = useState<{date: Date; installations: Quote[]; payables: ManualTransaction[] } | null>(null);
  
  // State for Quote Kanban - This Kanban might be different from the new MainDashboardView's intent
  // For now, keeping its logic, but it's not directly displayed via main navigation.
  const [draftQuotesKanban, setDraftQuotesKanban] = useState<Quote[]>([]);
  const [pendingQuotesKanban, setPendingQuotesKanban] = useState<Quote[]>([]);
  const [approvedQuotesKanban, setApprovedQuotesKanban] = useState<Quote[]>([]);
  const [completedQuotesKanban, setCompletedQuotesKanban] = useState<Quote[]>([]);
  const [draggedQuoteIdKanban, setDraggedQuoteIdKanban] = useState<string | null>(null);
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null);


  const quotesByStatus = React.useMemo(() => {
    const statusCounts: { [key in QuoteStatus]?: number } = {};
    for (const quote of quotes) {
      statusCounts[quote.status] = (statusCounts[quote.status] || 0) + 1;
    }
    return Object.entries(statusCounts).map(([name, value]) => ({ name: name as QuoteStatus, value }));
  }, [quotes]);

  const totalRevenueByStatus = React.useMemo(() => {
    const revenue: { [key in QuoteStatus]?: number } = {};
    for (const quote of quotes) {
      revenue[quote.status] = (revenue[quote.status] || 0) + quote.totalAmount;
    }
    return Object.entries(revenue).map(([name, value]) => ({ name: name as QuoteStatus, value }));
  }, [quotes]);
  
  const approvedQuotesValue = quotes
    .filter(q => q.status === QuoteStatus.APPROVED)
    .reduce((sum, q) => sum + q.totalAmount, 0);

  const pendingQuotesValue = quotes
    .filter(q => q.status === QuoteStatus.PENDING)
    .reduce((sum, q) => sum + q.totalAmount, 0);

  const totalQuotes = quotes.length;

  const CHART_COLORS = {
    [QuoteStatus.APPROVED]: '#4CAF50',
    [QuoteStatus.PENDING]: '#FFC107',
    [QuoteStatus.REJECTED]: '#f44336',
    [QuoteStatus.DRAFT]: '#ef9a9a', 
    [QuoteStatus.CANCELED]: '#9e9e9e',
  };

  const KANBAN_CARD_BORDER_COLORS = {
    [QuoteStatus.DRAFT]: 'border-pink-400',
    [QuoteStatus.PENDING]: 'border-yellow-500',
    [QuoteStatus.APPROVED]: 'border-green-500',
    [QuoteStatus.REJECTED]: 'border-red-600',
    [QuoteStatus.CANCELED]: 'border-gray-500',
  };
  
  const getKanbanCardBorderColor = (status: QuoteStatus, installationProgress?: InstallationProgressStatus) => {
    if (status === QuoteStatus.APPROVED && installationProgress === InstallationProgressStatus.COMPLETED) {
      return 'border-blue-500'; 
    }
    return KANBAN_CARD_BORDER_COLORS[status] || 'border-gray-300';
  };


  const getProgressColor = (status?: InstallationProgressStatus) => {
    switch (status) {
      case InstallationProgressStatus.COMPLETED: return 'bg-green-100 text-green-800';
      case InstallationProgressStatus.IN_PROGRESS: return 'bg-blue-100 text-blue-800';
      case InstallationProgressStatus.SCHEDULED: return 'bg-yellow-100 text-yellow-800';
      case InstallationProgressStatus.ON_HOLD: return 'bg-orange-100 text-orange-800';
      case InstallationProgressStatus.CANCELED: return 'bg-red-100 text-red-800';
      case InstallationProgressStatus.NOT_STARTED: return 'bg-gray-100 text-gray-800';
      default: return 'bg-secondary-100 text-secondary-800';
    }
  };

  const formatDate = (dateString?: string, options?: Intl.DateTimeFormatOptions) => {
    if (!dateString) return 'N/A';
    const dateToFormat = dateString.includes('T') ? dateString : `${dateString}T00:00:00Z`;
    const defaultOptions: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit', timeZone: 'UTC' };
    return new Date(dateToFormat).toLocaleDateString('pt-BR', options || defaultOptions);
  };
  
  const formatTime = (dateString?: string) => {
    if (!dateString) return 'N/A';
    const dateObj = new Date(dateString.length === 10 ? `${dateString}T00:00:00` : dateString);
    return dateObj.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' });
  };

  const approvedQuotesWithInstallationDates = useMemo(() => {
    return quotes.filter(
      q => q.status === QuoteStatus.APPROVED && 
           q.installationDate &&
           q.installationProgress !== InstallationProgressStatus.COMPLETED &&
           q.installationProgress !== InstallationProgressStatus.CANCELED
    ).map(q => {
        const client = clients.find(c => c.id === q.clientId);
        return {
            ...q,
            clientDetails: client || q.clientDetails,
            clientName: client ? client.name : q.clientName,
            installationAddress: q.installationAddress || client?.address || 'Endereço não especificado'
        };
    });
  }, [quotes, clients]);

  const payablesForCalendar = useMemo(() => {
    return manualTransactions.filter(t => t.type === 'expense' && t.date);
  }, [manualTransactions]);

  const handleCalendarDateSelect = useCallback((date: Date, quotesOnDate: Quote[], payablesOnDate: ManualTransaction[]) => {
    setSelectedCalendarDateDetails({date, installations: quotesOnDate, payables: payablesOnDate });
  }, []);

  // Kanban Logic
  useEffect(() => {
    const drafts: Quote[] = [];
    const pendings: Quote[] = [];
    const approved: Quote[] = [];
    const completed: Quote[] = [];

    const enrichedQuotes = quotes.map(q => {
      const client = clients.find(c => c.id === q.clientId);
      return {
        ...q,
        clientName: client?.name || q.clientName,
      };
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());


    enrichedQuotes.forEach(quote => {
      if (quote.status === QuoteStatus.DRAFT) {
        drafts.push(quote);
      } else if (quote.status === QuoteStatus.PENDING) {
        pendings.push(quote);
      } else if (quote.status === QuoteStatus.APPROVED) {
        if (quote.installationProgress === InstallationProgressStatus.COMPLETED) {
          completed.push(quote);
        } else {
          approved.push(quote);
        }
      }
    });

    setDraftQuotesKanban(drafts);
    setPendingQuotesKanban(pendings);
    setApprovedQuotesKanban(approved);
    setCompletedQuotesKanban(completed);
  }, [quotes, clients]);

  const handleQuoteDragStart = (e: React.DragEvent<HTMLDivElement>, quoteId: string) => {
    setDraggedQuoteIdKanban(quoteId);
    e.dataTransfer.setData('text/plain', quoteId);
    e.currentTarget.style.opacity = '0.5';
  };

  const handleQuoteDragEnd = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.style.opacity = '1';
    setDraggedQuoteIdKanban(null);
  };

  const handleQuoteDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.currentTarget.classList.add('bg-primary-50');
  };

  const handleQuoteDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
     e.currentTarget.classList.remove('bg-primary-50');
  };

  const handleQuoteDrop = (e: React.DragEvent<HTMLDivElement>, targetColumnKey: any) => { // Use 'any' as DashboardQuoteKanbanColumnKey is removed
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary-50');
    if (!draggedQuoteIdKanban) return;

    const quoteToUpdate = quotes.find(q => q.id === draggedQuoteIdKanban);
    if (!quoteToUpdate) return;

    let updatedQuote = { ...quoteToUpdate };
    // This switch needs to be adapted if DASHBOARD_QUOTE_KANBAN_COLUMNS is not used anymore
    // For now, it will use simple string matching for column titles if they are passed directly.
    // However, the targetColumnKey is not well-defined here without its type.
    // Assuming the column keys are 'DRAFT_COL', 'PENDING_COL', etc. as strings.

    switch (targetColumnKey) {
      case 'DRAFT_COL': // Assuming these are string keys now
        updatedQuote.status = QuoteStatus.DRAFT;
        if (updatedQuote.installationProgress === InstallationProgressStatus.COMPLETED) {
          updatedQuote.installationProgress = InstallationProgressStatus.SCHEDULED; 
        }
        break;
      case 'PENDING_COL':
        updatedQuote.status = QuoteStatus.PENDING;
         if (updatedQuote.installationProgress === InstallationProgressStatus.COMPLETED) {
          updatedQuote.installationProgress = InstallationProgressStatus.SCHEDULED; 
        }
        break;
      case 'APPROVED_COL':
        updatedQuote.status = QuoteStatus.APPROVED;
        // No change to installationProgress if moving here unless it was from completed
        break;
      case 'COMPLETED_COL':
        updatedQuote.status = QuoteStatus.APPROVED;
        updatedQuote.installationProgress = InstallationProgressStatus.COMPLETED;
        break;
      default:
        return;
    }
    
    if (updatedQuote.status !== quoteToUpdate.status || updatedQuote.installationProgress !== quoteToUpdate.installationProgress) {
      onUpdateQuote(updatedQuote);
    }
    setDraggedQuoteIdKanban(null);
  };

  const handleManualStatusChange = (quoteId: string, newStatus: QuoteStatus) => {
    const quoteToUpdate = quotes.find(q => q.id === quoteId);
    if (!quoteToUpdate) return;

    let updatedQuote = { ...quoteToUpdate, status: newStatus };
    
    if (newStatus === QuoteStatus.APPROVED && updatedQuote.installationProgress === InstallationProgressStatus.COMPLETED) {
       // Stays completed
    } 
    else if (quoteToUpdate.status === QuoteStatus.APPROVED && 
               quoteToUpdate.installationProgress === InstallationProgressStatus.COMPLETED &&
               newStatus !== QuoteStatus.APPROVED) {
        updatedQuote.installationProgress = InstallationProgressStatus.SCHEDULED; 
    }
    
    onUpdateQuote(updatedQuote);
    setActiveDropdown(null); 
  };

  const toggleDropdown = (quoteId: string) => {
    setActiveDropdown(activeDropdown === quoteId ? null : quoteId);
  };

  const handleChartClick = (data: any) => {
    if (data && data.name) { 
        onChartNavigation({ status: data.name as QuoteStatus });
    }
  };


  const KanbanColumn: React.FC<{ title: string; quotes: Quote[]; columnKey: any; children?: React.ReactNode }> = ({ title, quotes, columnKey, children }) => (
    <div
      className="flex-1 bg-secondary-100 p-3 sm:p-4 rounded-lg min-h-[200px] border border-secondary-200 transition-colors"
      onDragOver={handleQuoteDragOver}
      onDragLeave={handleQuoteDragLeave}
      onDrop={(e) => handleQuoteDrop(e, columnKey)}
    >
      <h4 className="text-md sm:text-lg font-semibold text-secondary-700 mb-3 sm:mb-4 sticky top-0 bg-secondary-100 py-1.5 sm:py-2 z-10">
        {title} <span className="text-xs sm:text-sm font-normal text-secondary-500">({quotes.length})</span>
      </h4>
      <div className="space-y-2 sm:space-y-3 overflow-y-auto max-h-[300px] sm:max-h-[400px]">
        {quotes.length > 0 ? (
          quotes.map(quote => (
            <div
              key={quote.id}
              draggable
              onDragStart={(e) => handleQuoteDragStart(e, quote.id)}
              onDragEnd={handleQuoteDragEnd}
              className={`p-2 sm:p-3 bg-white rounded-md shadow-sm border-l-4 ${getKanbanCardBorderColor(quote.status, quote.installationProgress)} cursor-grab active:cursor-grabbing`}
            >
              <div className="flex justify-between items-start">
                <p className="text-xs text-primary-600 font-medium">{quote.id}</p>
                <div className="relative">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="p-1 -mr-1 -mt-1"
                    onClick={() => toggleDropdown(quote.id)}
                    aria-haspopup="true"
                    aria-expanded={activeDropdown === quote.id}
                  >
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-4 h-4 text-secondary-500">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 12.75a.75.75 0 110-1.5.75.75 0 010 1.5zM12 18.75a.75.75 0 110-1.5.75.75 0 010 1.5z" />
                    </svg>
                  </Button>
                  {activeDropdown === quote.id && (
                    <div className="absolute right-0 mt-1 w-48 bg-white rounded-md shadow-lg z-20 border border-secondary-200">
                      {QUOTE_STATUS_OPTIONS.map(statusOption => (
                        <button
                          key={statusOption}
                          onClick={() => handleManualStatusChange(quote.id, statusOption)}
                          className="block w-full text-left px-3 py-1.5 text-xs text-secondary-700 hover:bg-secondary-100 hover:text-secondary-900"
                        >
                          Mover para {statusOption}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
              <p className="font-medium text-xs sm:text-sm text-secondary-800 mt-0.5">{quote.clientName}</p>
              <p className="text-xxs sm:text-xs text-secondary-600">
                Data: {formatDate(quote.date, { day: '2-digit', month: '2-digit', year: '2-digit' })} | Total: R$ {quote.totalAmount.toFixed(2)}
              </p>
            </div>
          ))
        ) : (
          <p className="text-xs text-secondary-500 text-center py-4">Nenhum orçamento nesta etapa.</p>
        )}
        {quotes.length === 0 && <div className="h-5"></div>} 
      </div>
    </div>
  );


  if (quotes.length === 0 && approvedQuotesWithInstallationDates.length === 0 && payablesForCalendar.length === 0) {
    return <div className="p-6 text-center text-secondary-600">Sem dados para exibir no dashboard. Crie alguns orçamentos, lance despesas e agende instalações!</div>;
  }

  return (
    <div className="p-0 sm:p-4 md:p-6 bg-white shadow-lg rounded-lg space-y-8">
      <div className="px-2 sm:px-0">
        <h2 className="text-xl sm:text-2xl font-semibold text-secondary-800 mb-6 sm:mb-8">Dashboard de Orçamentos (Antigo)</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 mb-6 sm:mb-8">
          <div className="bg-primary-50 p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-primary-700">Total de Orçamentos</h3>
            <p className="text-2xl sm:text-3xl font-bold text-primary-600">{totalQuotes}</p>
          </div>
          <div className="bg-green-50 p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-green-700">Valor Aprovado</h3>
            <p className="text-2xl sm:text-3xl font-bold text-green-600">R$ {approvedQuotesValue.toFixed(2)}</p>
          </div>
          <div className="bg-yellow-50 p-4 sm:p-6 rounded-lg shadow">
            <h3 className="text-xs sm:text-sm font-medium text-yellow-700">Valor Pendente</h3>
            <p className="text-2xl sm:text-3xl font-bold text-yellow-600">R$ {pendingQuotesValue.toFixed(2)}</p>
          </div>
        </div>

        { quotes.length > 0 && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 sm:gap-8 mb-6 sm:mb-8">
            <div className="bg-secondary-50 p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold text-secondary-700 mb-4">Orçamentos por Status</h3>
                <ResponsiveContainer width="100%" height={250}>
                <PieChart>
                    <Pie
                        data={quotesByStatus}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                        nameKey="name"
                        label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                        onClick={handleChartClick} 
                        className="cursor-pointer"
                    >
                    {quotesByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as QuoteStatus] || '#82ca9d'} />
                    ))}
                    </Pie>
                    <Tooltip formatter={(value: number) => `${value} orçamentos`} />
                    <Legend wrapperStyle={{fontSize: "10px"}}/>
                </PieChart>
                </ResponsiveContainer>
            </div>

            <div className="bg-secondary-50 p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-base sm:text-lg font-semibold text-secondary-700 mb-4">Valor Total por Status (R$)</h3>
                <ResponsiveContainer width="100%" height={250}>
                <BarChart data={totalRevenueByStatus} margin={{ top: 5, right: 10, left: 20, bottom: 5 }} onClick={(eventData: any) => { if (eventData && eventData.activePayload && eventData.activePayload[0]) handleChartClick(eventData.activePayload[0].payload); }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" tick={{fontSize: 10}} />
                    <YAxis tickFormatter={(value) => `R$${value / 1000}k`} tick={{fontSize: 10}} />
                    <Tooltip formatter={(value: number) => `R$ ${value.toFixed(2)}`} />
                    <Legend wrapperStyle={{fontSize: "10px"}} />
                    <Bar dataKey="value" name="Valor Total" className="cursor-pointer">
                    {totalRevenueByStatus.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={CHART_COLORS[entry.name as QuoteStatus] || '#82ca9d'} />
                    ))}
                    </Bar>
                </BarChart>
                </ResponsiveContainer>
            </div>
            </div>
        )}
      </div>

      <div className="px-2 sm:px-0 pt-6 sm:pt-8 border-t border-secondary-200">
        <h2 className="text-xl sm:text-2xl font-semibold text-secondary-800 mb-4 sm:mb-6">Agenda e Despesas</h2>
        {(approvedQuotesWithInstallationDates.length === 0 && payablesForCalendar.length === 0) ? (
            <p className="text-secondary-500 text-center py-4">Nenhuma instalação futura ou despesa agendada.</p>
        ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 sm:gap-6">
            <div className="lg:col-span-2">
                <MiniCalendar
                    installations={approvedQuotesWithInstallationDates}
                    payables={payablesForCalendar}
                    onDateSelect={handleCalendarDateSelect}
                />
            </div>
            <div className="lg:col-span-1">
                <h3 className="text-base sm:text-xl font-semibold text-secondary-700 mb-3 sm:mb-4">
                    {selectedCalendarDateDetails?.date ? `Detalhes para ${formatDate(selectedCalendarDateDetails.date.toISOString().split('T')[0])}` : "Selecione uma Data"}
                </h3>
                {selectedCalendarDateDetails ? (
                <div className="space-y-2 sm:space-y-3 max-h-[300px] lg:max-h-[calc(100vh-500px)] overflow-y-auto pr-1 sm:pr-2 bg-secondary-50 p-2 sm:p-3 rounded-md border border-secondary-200">
                    {selectedCalendarDateDetails.installations.length === 0 && selectedCalendarDateDetails.payables.length === 0 && <p className="text-xs sm:text-sm text-secondary-500">Nenhuma atividade para esta data.</p>}
                    {selectedCalendarDateDetails.installations.length > 0 && <h4 className="text-xs font-semibold text-red-700 uppercase">Instalações</h4>}
                    {selectedCalendarDateDetails.installations.map(quote => (
                    <div key={`dashboard-inst-${quote.id}`} className="p-2 sm:p-3 border border-secondary-200 rounded-md shadow-sm bg-white hover:shadow-md transition-shadow">
                        <div className="flex justify-between items-start mb-0.5 sm:mb-1">
                        <p className="text-xs sm:text-sm font-semibold text-primary-700">{quote.clientName}</p>
                        <span className={`px-1.5 sm:px-2 py-0.5 text-xxs sm:text-xs font-semibold rounded-full ${getProgressColor(quote.installationProgress)}`}>
                            {quote.installationProgress || InstallationProgressStatus.NOT_STARTED}
                        </span>
                        </div>
                        <p className="text-xxs sm:text-xs text-secondary-600">Ref. Orçamento: {quote.id}</p>
                        {quote.installationAddress && <p className="text-xxs sm:text-xs text-secondary-500 mt-0.5 sm:mt-1">Local: {quote.installationAddress}</p>}
                        <p className="text-xxs sm:text-xs text-secondary-500 mt-0.5 sm:mt-1">
                            Horário Agendado: <span className="text-secondary-700 font-medium">{formatTime(quote.installationDate)}</span>
                        </p>
                    </div>
                    ))}
                    {selectedCalendarDateDetails.payables.length > 0 && <h4 className="text-xs font-semibold text-blue-700 uppercase mt-3">Contas a Pagar</h4>}
                    {selectedCalendarDateDetails.payables.map(payable => (
                      <div key={`dashboard-payable-${payable.id}`} className="p-2 sm:p-3 border border-secondary-200 rounded-md shadow-sm bg-white hover:shadow-md transition-shadow">
                        <p className="text-xs sm:text-sm font-semibold text-blue-700">{payable.description}</p>
                        <p className="text-xxs sm:text-xs text-secondary-600">Categoria: {payable.category || 'N/A'}</p>
                        <p className="text-xxs sm:text-xs text-red-600 font-medium">Valor: R$ {payable.amount.toFixed(2)}</p>
                      </div>
                    ))}
                </div>
                ) : (
                <p className="text-xs sm:text-sm text-secondary-500 bg-secondary-50 p-3 rounded-md border border-secondary-200">Clique em uma data no calendário para ver as atividades agendadas.</p>
                )}
            </div>
            </div>
        )}
      </div>

      <div className="px-2 sm:px-0 pt-6 sm:pt-8 border-t border-secondary-200">
        <h2 className="text-xl sm:text-2xl font-semibold text-secondary-800 mb-4 sm:mb-6">Kanban de Orçamentos (Antigo)</h2>
        {quotes.length === 0 ? (
          <p className="text-secondary-600 text-center py-8">Nenhum orçamento para exibir no Kanban.</p>
        ) : (
          <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
            {/* The KanbanColumn definitions depend on constants that might be removed or changed.
                This part might break if DASHBOARD_QUOTE_KANBAN_COLUMNS is fully removed.
                For now, assuming they are simple string titles.
            */}
            <KanbanColumn title={"Rascunho"} quotes={draftQuotesKanban} columnKey="DRAFT_COL" />
            <KanbanColumn title={"Pendente"} quotes={pendingQuotesKanban} columnKey="PENDING_COL" />
            <KanbanColumn title={"Aprovado"} quotes={approvedQuotesKanban} columnKey="APPROVED_COL" />
            <KanbanColumn title={"Concluído"} quotes={completedQuotesKanban} columnKey="COMPLETED_COL" />
          </div>
        )}
      </div>

    </div>
  );
};

export default OldDashboard; // Renamed export
