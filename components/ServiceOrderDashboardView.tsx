import React, { useMemo, useState } from 'react';
import { Quote, Client, QuoteStatus } from '../types';
import Button from './common/Button';
import Input from './common/Input';

interface ServiceOrderDashboardViewProps {
  quotes: Quote[];
  clients: Client[];
  onGenerateServiceOrder: (quote: Quote) => void;
}

const KPICard: React.FC<{ title: string; value: string | number; icon?: React.ReactNode; colorClass: string }> = 
({ title, value, icon, colorClass }) => (
  <div className={`p-5 rounded-xl shadow-lg ${colorClass} text-white`}>
    {icon && <div className="text-3xl opacity-80 mb-2">{icon}</div>}
    <p className="text-sm uppercase tracking-wide opacity-90">{title}</p>
    <p className="text-3xl font-bold">{value}</p>
  </div>
);

const ServiceOrderDashboardView: React.FC<ServiceOrderDashboardViewProps> = ({ quotes, clients, onGenerateServiceOrder }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const approvedQuotes = useMemo(() => {
    return quotes.filter(q => q.status === QuoteStatus.APPROVED).map(q => {
        const client = clients.find(c => c.id === q.clientId);
        return {...q, clientName: client?.name || q.clientName };
    });
  }, [quotes, clients]);

  const totalApprovedQuotes = approvedQuotes.length;

  const totalApprovedValue = useMemo(() => {
    return approvedQuotes.reduce((sum, q) => sum + q.totalAmount, 0);
  }, [approvedQuotes]);

  const totalInstallationCosts = useMemo(() => {
    return approvedQuotes.reduce((sum, q) => sum + (q.installationCost || 0), 0);
  }, [approvedQuotes]);

  const filteredApprovedQuotes = useMemo(() => {
    if (!searchTerm.trim()) {
      return approvedQuotes;
    }
    const lowerSearchTerm = searchTerm.toLowerCase();
    return approvedQuotes.filter(quote => 
      quote.id.toLowerCase().includes(lowerSearchTerm) ||
      quote.clientName.toLowerCase().includes(lowerSearchTerm)
    );
  }, [approvedQuotes, searchTerm]);

  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  return (
    <div className="space-y-6 md:space-y-8">
      <h2 className="text-2xl font-semibold text-secondary-800">Dashboard de Ordens de Serviço</h2>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        <KPICard title="O.S. (Orç. Aprovados)" value={totalApprovedQuotes} icon={<span>📋</span>} colorClass="bg-blue-500" />
        <KPICard title="Valor Bruto das O.S." value={`R$ ${totalApprovedValue.toFixed(2)}`} icon={<span>💰</span>} colorClass="bg-green-500" />
        <KPICard title="Custos de Instalação (Previstos)" value={`R$ ${totalInstallationCosts.toFixed(2)}`} icon={<span>🔧</span>} colorClass="bg-orange-500" />
      </div>

      {/* Gerador de OS / List of Approved Quotes */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4">
            <h3 className="text-lg font-semibold text-secondary-700 mb-2 sm:mb-0">Orçamentos Aprovados para Gerar O.S.</h3>
            <div className="w-full sm:w-auto sm:max-w-xs">
                <Input
                    type="text"
                    placeholder="Buscar por Nº ou Cliente..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    containerClassName="mb-0"
                />
            </div>
        </div>
        
        {filteredApprovedQuotes.length === 0 ? (
          <p className="text-center text-secondary-500 py-6">
            {searchTerm ? "Nenhum orçamento aprovado encontrado para sua busca." : "Nenhum orçamento aprovado no momento."}
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Nº Orçamento</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Cliente</th>
                  <th className="px-4 py-3 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Data Aprovação</th>
                  <th className="px-4 py-3 text-right text-xs font-medium text-secondary-600 uppercase tracking-wider">Valor Total</th>
                  <th className="px-4 py-3 text-center text-xs font-medium text-secondary-600 uppercase tracking-wider">Ação</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {filteredApprovedQuotes.map((quote) => (
                  <tr key={quote.id} className="hover:bg-secondary-50">
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-primary-600">{quote.id}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800">{quote.clientName}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-600">{formatDate(quote.date)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-secondary-800 text-right">R$ {quote.totalAmount.toFixed(2)}</td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-center">
                      <Button
                        onClick={() => onGenerateServiceOrder(quote)}
                        variant="primary"
                        size="sm"
                        leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m.75 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
                      >
                        Gerar/Ver O.S.
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

export default ServiceOrderDashboardView;