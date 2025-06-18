import React, { useState, useMemo, useEffect } from 'react';
import { Quote, Client, QuoteStatus, InstallationProgressStatus, ManualTransaction } from '../types';
import Select from './common/Select';
import Button from './common/Button'; // Import Button

interface FinancialViewProps {
  quotes: Quote[];
  clients: Client[];
  manualTransactions: ManualTransaction[];
  onOpenManualTransactionModal: (type: 'income' | 'expense', transaction?: ManualTransaction) => void;
  onDeleteManualTransaction: (transactionId: string) => void;
}

const FinancialView: React.FC<FinancialViewProps> = ({ 
  quotes, 
  clients,
  manualTransactions,
  onOpenManualTransactionModal,
  onDeleteManualTransaction
}) => {
  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth(); // 0-indexed

  const [selectedYear, setSelectedYear] = useState<number>(currentYear);
  const [selectedMonth, setSelectedMonth] = useState<number>(currentMonth);

  const yearOptions = useMemo(() => {
    const years = new Set<number>();
    quotes.forEach(q => {
        if (q.date) years.add(new Date(q.date).getFullYear());
        if (q.installationDate) years.add(new Date(q.installationDate + "T00:00:00").getFullYear());
    });
    manualTransactions.forEach(t => {
        if (t.date) years.add(new Date(t.date).getFullYear());
    });
    if (!years.has(currentYear)) years.add(currentYear);
    return Array.from(years).sort((a, b) => b - a).map(y => ({ value: y, label: y.toString() }));
  }, [quotes, manualTransactions, currentYear]);

  const monthOptions = useMemo(() => {
    return Array.from({ length: 12 }, (_, i) => ({
      value: i,
      label: new Date(0, i).toLocaleString('pt-BR', { month: 'long' }),
    }));
  }, []);

  const formatDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    // Dates from input type="date" are YYYY-MM-DD. Treat as local.
    const dateToFormat = dateString.includes('T') ? dateString : `${dateString}T00:00:00`;
    return new Date(dateToFormat).toLocaleDateString('pt-BR', { year: 'numeric', month: '2-digit', day: '2-digit' });
  };
  
  const getQuoteStatusColor = (status: QuoteStatus) => {
    switch (status) {
      case QuoteStatus.APPROVED: return 'bg-green-100 text-green-800';
      case QuoteStatus.PENDING: return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-secondary-100 text-secondary-800';
    }
  };

  const getInstallationProgressColor = (status?: InstallationProgressStatus) => {
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

  const { filteredQuoteReceivables, totalQuoteReceivableAmount } = useMemo(() => {
    const receivables = quotes.filter(q => {
      const quoteDate = new Date(q.date); 
      return quoteDate.getFullYear() === selectedYear &&
             quoteDate.getMonth() === selectedMonth &&
             (q.status === QuoteStatus.APPROVED || q.status === QuoteStatus.PENDING);
    }).map(q => {
        const client = clients.find(c => c.id === q.clientId);
        return {...q, clientName: client?.name || q.clientName};
    });
    const total = receivables.reduce((sum, q) => sum + q.totalAmount, 0);
    return { filteredQuoteReceivables: receivables, totalQuoteReceivableAmount: total };
  }, [quotes, clients, selectedYear, selectedMonth]);

  const { filteredInstallationPayables, totalInstallationPayableAmount } = useMemo(() => {
    const payables = quotes.filter(q => {
      if (!q.installationDate || typeof q.installationCost !== 'number' || q.status !== QuoteStatus.APPROVED) {
        return false;
      }
      const instDate = new Date(q.installationDate + "T00:00:00"); 
      return instDate.getFullYear() === selectedYear &&
             instDate.getMonth() === selectedMonth;
    }).map(q => {
        const client = clients.find(c => c.id === q.clientId);
        return {...q, clientName: client?.name || q.clientName};
    });
    const total = payables.reduce((sum, q) => sum + (q.installationCost || 0), 0);
    return { filteredInstallationPayables: payables, totalInstallationPayableAmount: total };
  }, [quotes, clients, selectedYear, selectedMonth]);

  const estimatedTaxAmount = useMemo(() => {
    const approvedQuotesInPeriod = quotes.filter(q => {
        const quoteDate = new Date(q.date);
        return quoteDate.getFullYear() === selectedYear &&
               quoteDate.getMonth() === selectedMonth &&
               q.status === QuoteStatus.APPROVED;
    });
    const totalApprovedAmount = approvedQuotesInPeriod.reduce((sum, q) => sum + q.totalAmount, 0);
    return totalApprovedAmount * 0.20; // 20% tax
  }, [quotes, selectedYear, selectedMonth]);

  const filteredManualIncomes = useMemo(() => {
    return manualTransactions.filter(t => {
      const transactionDate = new Date(t.date + "T00:00:00");
      return t.type === 'income' &&
             transactionDate.getFullYear() === selectedYear &&
             transactionDate.getMonth() === selectedMonth;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [manualTransactions, selectedYear, selectedMonth]);

  const totalManualIncomeAmount = useMemo(() => {
    return filteredManualIncomes.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredManualIncomes]);

  const filteredManualExpenses = useMemo(() => {
    return manualTransactions.filter(t => {
      const transactionDate = new Date(t.date + "T00:00:00");
      return t.type === 'expense' &&
             transactionDate.getFullYear() === selectedYear &&
             transactionDate.getMonth() === selectedMonth;
    }).sort((a,b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [manualTransactions, selectedYear, selectedMonth]);

  const totalManualExpenseAmount = useMemo(() => {
    return filteredManualExpenses.reduce((sum, t) => sum + t.amount, 0);
  }, [filteredManualExpenses]);

  const totalOverallReceivableAmount = totalQuoteReceivableAmount + totalManualIncomeAmount;
  const totalOverallPayableAmount = totalInstallationPayableAmount + totalManualExpenseAmount + estimatedTaxAmount; // Add tax to payables
  const netBalance = totalOverallReceivableAmount - totalOverallPayableAmount;


  return (
    <div className="p-0 md:p-6 bg-white shadow-lg rounded-lg space-y-8">
      <div className="px-6 md:px-0 pt-6 md:pt-0">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6">
            <h2 className="text-2xl font-semibold text-secondary-800">Financeiro</h2>
            <div className="flex space-x-3 mt-4 sm:mt-0">
                <Button 
                    variant="success" 
                    onClick={() => onOpenManualTransactionModal('income')}
                    leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                >
                    + Lançar Receita
                </Button>
                <Button 
                    variant="danger" 
                    onClick={() => onOpenManualTransactionModal('expense')}
                    leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
                >
                    + Lançar Despesa
                </Button>
            </div>
        </div>
      </div>
      

      {/* Period Selector */}
      <div className="px-6 md:px-0 grid grid-cols-1 sm:grid-cols-2 gap-4 mb-6">
        <Select
          label="Mês"
          options={monthOptions}
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(parseInt(e.target.value))}
          containerClassName="mb-0"
        />
        <Select
          label="Ano"
          options={yearOptions.length > 0 ? yearOptions : [{value: currentYear, label: currentYear.toString()}]}
          value={selectedYear}
          onChange={(e) => setSelectedYear(parseInt(e.target.value))}
          containerClassName="mb-0"
        />
      </div>

      {/* Summary Cards */}
      <div className="px-6 md:px-0 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-green-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-green-700">Total a Receber no Período</h3>
          <p className="text-3xl font-bold text-green-600">R$ {totalOverallReceivableAmount.toFixed(2)}</p>
        </div>
        <div className="bg-red-50 p-6 rounded-lg shadow">
          <h3 className="text-sm font-medium text-red-700">Total Custos/Despesas no Período</h3>
          <p className="text-3xl font-bold text-red-600">R$ {(totalInstallationPayableAmount + totalManualExpenseAmount).toFixed(2)}</p>
        </div>
        <div className="bg-purple-50 p-6 rounded-lg shadow"> {/* New Tax Card */}
          <h3 className="text-sm font-medium text-purple-700">Impostos Estimados (20% s/ Aprovados)</h3>
          <p className="text-3xl font-bold text-purple-600">R$ {estimatedTaxAmount.toFixed(2)}</p>
        </div>
        <div className={`${netBalance >= 0 ? 'bg-blue-50' : 'bg-orange-50'} p-6 rounded-lg shadow`}>
          <h3 className={`text-sm font-medium ${netBalance >= 0 ? 'text-blue-700' : 'text-orange-700'}`}>Saldo Estimado do Período</h3>
          <p className={`text-3xl font-bold ${netBalance >= 0 ? 'text-blue-600' : 'text-orange-600'}`}>R$ {netBalance.toFixed(2)}</p>
        </div>
      </div>

      {/* Details - Accounts Receivable from Quotes */}
      <div className="px-6 md:px-0">
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Contas a Receber (Orçamentos Aprovados/Pendentes)</h3>
        {filteredQuoteReceivables.length === 0 ? (
          <p className="text-secondary-500">Nenhum orçamento a receber para o período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Nº Orçamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Data Emissão</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Valor Total (R$)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Status Orçam.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredQuoteReceivables.map(quote => (
                  <tr key={`rec-${quote.id}`} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-600">{quote.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{quote.clientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{formatDate(quote.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800 text-right">{quote.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getQuoteStatusColor(quote.status)}`}>
                        {quote.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Details - Installation Costs from Quotes */}
      <div className="px-6 md:px-0 mt-8">
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Custos de Instalação (Orçamentos Aprovados)</h3>
        {filteredInstallationPayables.length === 0 ? (
          <p className="text-secondary-500">Nenhum custo de instalação previsto para o período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Ref. Orçamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Data Prev. Inst.</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Custo Inst. (R$)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Progresso Inst.</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredInstallationPayables.map(quote => (
                  <tr key={`pay-${quote.id}`} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-600">{quote.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{quote.clientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{formatDate(quote.installationDate)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800 text-right">{(quote.installationCost || 0).toFixed(2)}</td>
                     <td className="px-4 py-3 whitespace-nowrap text-center">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getInstallationProgressColor(quote.installationProgress)}`}>
                        {quote.installationProgress || InstallationProgressStatus.NOT_STARTED}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Incomes Table */}
      <div className="px-6 md:px-0 mt-8">
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Outras Receitas Lançadas no Período</h3>
        {filteredManualIncomes.length === 0 ? (
          <p className="text-secondary-500">Nenhuma outra receita lançada para o período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Valor (R$)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredManualIncomes.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{transaction.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{transaction.category || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-green-600 text-right">{transaction.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                      <Button variant="ghost" size="sm" onClick={() => onOpenManualTransactionModal('income', transaction)} title="Editar">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                      </Button>
                      <Button variant="ghost" size="sm" onClick={() => onDeleteManualTransaction(transaction.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Manual Expenses Table */}
      <div className="px-6 md:px-0 mt-8">
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Outras Despesas Lançadas no Período</h3>
        {filteredManualExpenses.length === 0 ? (
          <p className="text-secondary-500">Nenhuma outra despesa lançada para o período selecionado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Descrição</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Data</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Categoria</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Valor (R$)</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredManualExpenses.map(transaction => (
                  <tr key={transaction.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{transaction.description}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{formatDate(transaction.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{transaction.category || 'N/A'}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-red-600 text-right">{transaction.amount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center space-x-2">
                       <Button variant="ghost" size="sm" onClick={() => onOpenManualTransactionModal('expense', transaction)} title="Editar">
                         <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                       </Button>
                       <Button variant="ghost" size="sm" onClick={() => onDeleteManualTransaction(transaction.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                        <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                       </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
};

export default FinancialView;