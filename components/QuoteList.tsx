import React, { useState, useEffect } from 'react';
import { Quote, QuoteStatus, QuoteListChartFilter } from '../types';
import Button from './common/Button';
import Input from './common/Input'; // Added import for Input
import Select from './common/Select';
import { QUOTE_STATUS_OPTIONS } from '../constants';

interface QuoteListProps {
  quotes: Quote[];
  onEdit: (quote: Quote) => void;
  onView: (quote: Quote) => void;
  onDelete: (quoteId: string) => void;
  initialFilter: QuoteListChartFilter | null;
  clearInitialFilter: () => void;
}

const QuoteList: React.FC<QuoteListProps> = ({ 
  quotes, 
  onEdit, 
  onView, 
  onDelete,
  initialFilter,
  clearInitialFilter
}) => {
  const [filteredQuotes, setFilteredQuotes] = useState<Quote[]>(quotes);
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState<string>('');

  useEffect(() => {
    // Apply initial filter when component mounts or initialFilter prop changes
    if (initialFilter?.status) {
      setStatusFilter(initialFilter.status);
      // Do not clear search term if initial filter is applied, as they can coexist
    } else if (!initialFilter) { // If initialFilter is explicitly null, clear local filter
        setStatusFilter('');
    }
  }, [initialFilter]);

  useEffect(() => {
    let currentQuotes = [...quotes];

    // Apply status filter
    if (statusFilter) {
      currentQuotes = currentQuotes.filter(q => q.status === statusFilter);
    }

    // Apply search term filter
    if (searchTerm) {
      const lowerSearchTerm = searchTerm.toLowerCase();
      currentQuotes = currentQuotes.filter(q => 
        q.id.toLowerCase().includes(lowerSearchTerm) ||
        q.clientName?.toLowerCase().includes(lowerSearchTerm)
      );
    }
    
    // Sort by date descending by default
    currentQuotes.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    setFilteredQuotes(currentQuotes);
  }, [quotes, statusFilter, searchTerm]);


  const handleSearchTermChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSearchTerm(event.target.value);
    // If user types in search, clear the programmatically set initial filter
    if (initialFilter) {
      clearInitialFilter();
    }
  };
  
  const handleStatusFilterChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setStatusFilter(e.target.value);
    // If user manually changes filter, clear the programmatically set initial filter
    if (initialFilter) {
      clearInitialFilter();
    }
  };

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  const getStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return 'bg-green-100 text-green-800';
      case QuoteStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      case QuoteStatus.REJECTED: return 'bg-red-100 text-red-800'; 
      case QuoteStatus.DRAFT: return 'bg-primary-50 text-primary-700'; 
      case QuoteStatus.CANCELED: return 'bg-gray-100 text-gray-800'; 
      default: return 'bg-secondary-100 text-secondary-800';
    }
  };

  if (quotes.length === 0) {
    return <p className="text-center text-secondary-600 py-8">Nenhum orçamento encontrado. Crie um novo!</p>;
  }

  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-secondary-800 mb-6">Orçamentos Cadastrados</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
        <Input
          label="Buscar Orçamentos"
          type="text"
          placeholder="Buscar por Nº ou Cliente..."
          value={searchTerm}
          onChange={handleSearchTermChange} // Corrected: use direct input change
          containerClassName="mb-0"
        />
        <Select
          label="Filtrar por Status"
          value={statusFilter}
          onChange={handleStatusFilterChange}
          options={[{ value: "", label: "Todos os Status" }, ...QUOTE_STATUS_OPTIONS.map(s => ({ value: s, label: s }))]}
          containerClassName="mb-0"
        />
      </div>

      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Nº Orçamento</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Cliente</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Data</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">Valor Total</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-secondary-600 uppercase tracking-wider">Status</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-secondary-600 uppercase tracking-wider">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredQuotes.map((quote) => (
              <tr key={quote.id} className="hover:bg-secondary-50 transition-colors">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-primary-600">{quote.id}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800">{quote.clientName}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{formatDate(quote.date)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-800 text-right">R$ {quote.totalAmount.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-center">
                  <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColor(quote.status)}`}>
                    {quote.status}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-center space-x-2">
                  <Button onClick={() => onView(quote)} variant="ghost" size="sm" title="Visualizar/Imprimir">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </Button>
                  <Button onClick={() => onEdit(quote)} variant="ghost" size="sm" title="Editar">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0115.75 21H5.25A2.25 2.25 0 013 18.75V8.25A2.25 2.25 0 015.25 6H10" /></svg>
                  </Button>
                  <Button onClick={() => onDelete(quote.id)} variant="ghost" size="sm" className="text-red-500 hover:text-red-700" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
       {filteredQuotes.length === 0 && quotes.length > 0 && (
        <p className="text-center text-secondary-600 py-8">Nenhum orçamento encontrado para os filtros aplicados.</p>
      )}
    </div>
  );
};

export default QuoteList;