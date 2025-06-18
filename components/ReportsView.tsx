import React, { useState, useMemo } from 'react';
import { Quote, Client, Product, QuoteStatus, InstallationProgressStatus, DateRangeFilter, RevenueByClientItem, RevenueByProductItem, InstallationProfitabilityItem } from '../types';
import { BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import Input from './common/Input';
import Button from './common/Button';

interface ReportsViewProps {
  quotes: Quote[];
  clients: Client[];
  products: Product[];
}

const CHART_COLORS_REPORTS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8', '#82ca9d', '#ffc658'];

const ReportsView: React.FC<ReportsViewProps> = ({ quotes, clients, products }) => {
  const today = new Date();
  const firstDayOfMonth = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
  const lastDayOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0).toISOString().split('T')[0];

  const [dateRange, setDateRange] = useState<DateRangeFilter>({ startDate: firstDayOfMonth, endDate: lastDayOfMonth });

  const handleDateChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setDateRange(prev => ({ ...prev, [name]: value || null }));
  };

  const filteredQuotes = useMemo(() => {
    return quotes.filter(quote => {
      if (!dateRange.startDate || !dateRange.endDate) return true; // No filter if dates not set
      const quoteDate = new Date(quote.date).getTime();
      const startDate = new Date(dateRange.startDate + "T00:00:00").getTime();
      const endDate = new Date(dateRange.endDate + "T23:59:59").getTime();
      return quoteDate >= startDate && quoteDate <= endDate;
    });
  }, [quotes, dateRange]);

  // Report 1: Quote Conversion Rate
  const conversionRateStats = useMemo(() => {
    const approved = filteredQuotes.filter(q => q.status === QuoteStatus.APPROVED).length;
    const pending = filteredQuotes.filter(q => q.status === QuoteStatus.PENDING).length;
    const rejected = filteredQuotes.filter(q => q.status === QuoteStatus.REJECTED).length;
    const totalConsidered = approved + pending + rejected;
    const rate = totalConsidered > 0 ? (approved / totalConsidered) * 100 : 0;
    return { approved, pending, rejected, totalConsidered, rate: rate.toFixed(2) };
  }, [filteredQuotes]);

  // Report 2: Revenue by Client
  const revenueByClient: RevenueByClientItem[] = useMemo(() => {
    const clientRevenueMap = new Map<string, { totalRevenue: number, quoteCount: number }>();
    filteredQuotes.forEach(quote => {
      if (quote.status === QuoteStatus.APPROVED) {
        const current = clientRevenueMap.get(quote.clientId) || { totalRevenue: 0, quoteCount: 0 };
        current.totalRevenue += quote.totalAmount;
        current.quoteCount += 1;
        clientRevenueMap.set(quote.clientId, current);
      }
    });
    return Array.from(clientRevenueMap.entries()).map(([clientId, data]) => {
      const client = clients.find(c => c.id === clientId);
      return {
        clientId,
        clientName: client?.name || 'Cliente Desconhecido',
        totalRevenue: data.totalRevenue,
        quoteCount: data.quoteCount,
      };
    }).sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0,10); // Top 10
  }, [filteredQuotes, clients]);

  // Report 3: Revenue by Product/Service
  const revenueByProduct: RevenueByProductItem[] = useMemo(() => {
    const productRevenueMap = new Map<string, { totalRevenue: number, totalQuantity: number }>();
    filteredQuotes.forEach(quote => {
      if (quote.status === QuoteStatus.APPROVED) {
        quote.items.forEach(item => {
          const current = productRevenueMap.get(item.productId) || { totalRevenue: 0, totalQuantity: 0 };
          current.totalRevenue += item.totalPrice;
          current.totalQuantity += item.quantity;
          productRevenueMap.set(item.productId, current);
        });
      }
    });
     return Array.from(productRevenueMap.entries()).map(([productId, data]) => {
      const product = products.find(p => p.id === productId);
      return {
        productId,
        productName: product?.name || 'Produto Desconhecido',
        totalRevenue: data.totalRevenue,
        totalQuantity: data.totalQuantity,
      };
    }).sort((a,b) => b.totalRevenue - a.totalRevenue).slice(0,10); // Top 10
  }, [filteredQuotes, products]);

  // Report 4: Installation Profitability
  const installationProfitability: InstallationProfitabilityItem[] = useMemo(() => {
    return filteredQuotes
      .filter(q => q.status === QuoteStatus.APPROVED && q.installationProgress === InstallationProgressStatus.COMPLETED && typeof q.installationCost === 'number')
      .map(q => {
        const client = clients.find(c => c.id === q.clientId);
        const profit = q.totalAmount - (q.installationCost || 0);
        return {
          quoteId: q.id,
          clientName: client?.name || 'Cliente Desconhecido',
          quoteTotal: q.totalAmount,
          installationCost: q.installationCost,
          profit,
          installationDate: q.installationDate,
        };
      }).sort((a,b) => b.profit - a.profit);
  }, [filteredQuotes, clients]);

  const renderTable = (headers: string[], data: (string | number)[][], title: string) => (
    <div className="overflow-x-auto">
      <h4 className="text-md font-semibold text-secondary-700 mb-2">{title}</h4>
      {data.length === 0 ? <p className="text-sm text-secondary-500">Nenhum dado para este relatório no período selecionado.</p> :
      <table className="min-w-full divide-y divide-secondary-200 text-sm">
        <thead className="bg-secondary-50">
          <tr>{headers.map(h => <th key={h} className="px-3 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">{h}</th>)}</tr>
        </thead>
        <tbody className="bg-white divide-y divide-secondary-200">
          {data.map((row, rowIndex) => <tr key={rowIndex} className="hover:bg-secondary-50">{row.map((cell, cellIndex) => <td key={cellIndex} className={`px-3 py-2 whitespace-nowrap ${typeof cell === 'number' ? 'text-right' : ''}`}>{typeof cell === 'number' ? cell.toFixed(2) : cell}</td>)}</tr>)}
        </tbody>
      </table>}
    </div>
  );

  return (
    <div className="p-0 md:p-6 bg-white shadow-lg rounded-lg space-y-8">
      <div className="px-6 md:px-0 pt-6 md:pt-0">
        <h2 className="text-2xl font-semibold text-secondary-800 mb-6">Relatórios Gerenciais</h2>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 p-4 bg-secondary-50 rounded-md border border-secondary-200">
          <Input
            label="Data Inicial"
            type="date"
            name="startDate"
            value={dateRange.startDate || ''}
            onChange={handleDateChange}
            containerClassName="mb-0"
          />
          <Input
            label="Data Final"
            type="date"
            name="endDate"
            value={dateRange.endDate || ''}
            onChange={handleDateChange}
            containerClassName="mb-0"
          />
          <Button 
            onClick={() => console.log("Atualizar Relatórios com filtro:", dateRange)} // Placeholder, filtering is reactive
            variant="primary" 
            className="self-end h-10"
          >
            Aplicar Filtro de Data
          </Button>
        </div>
      </div>

      {/* Conversion Rate Section */}
      <div className="p-6 border border-secondary-200 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-700 mb-3">Taxa de Conversão de Orçamentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 items-center">
            <div>
                <p className="text-3xl font-bold text-primary-600">{conversionRateStats.rate}%</p>
                <p className="text-sm text-secondary-600">Baseado em {conversionRateStats.totalConsidered} orçamentos (Aprovados, Pendentes, Rejeitados) no período.</p>
                <ul className="text-sm mt-2">
                    <li>Aprovados: {conversionRateStats.approved}</li>
                    <li>Pendentes: {conversionRateStats.pending}</li>
                    <li>Rejeitados: {conversionRateStats.rejected}</li>
                </ul>
            </div>
            {conversionRateStats.totalConsidered > 0 && (
            <ResponsiveContainer width="100%" height={200}>
                <PieChart>
                <Pie data={[{name: 'Aprovados', value: conversionRateStats.approved}, {name: 'Não Convertidos', value: conversionRateStats.pending + conversionRateStats.rejected}]} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={60} label>
                    <Cell fill={CHART_COLORS_REPORTS[1]} />
                    <Cell fill={CHART_COLORS_REPORTS[3]} />
                </Pie>
                <Tooltip />
                <Legend />
                </PieChart>
            </ResponsiveContainer>
            )}
        </div>
      </div>

      {/* Revenue by Client Section */}
      <div className="p-6 border border-secondary-200 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-700 mb-3">Top 10 Clientes por Receita (Orçamentos Aprovados)</h3>
         {revenueByClient.length === 0 ? <p className="text-sm text-secondary-500">Nenhuma receita de cliente aprovada no período.</p> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderTable(['Cliente', 'Orçamentos', 'Receita (R$)'], revenueByClient.map(item => [item.clientName, item.quoteCount, item.totalRevenue]), '')}
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={revenueByClient} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} />
              <YAxis type="category" dataKey="clientName" width={100} interval={0} tick={{fontSize: 10}}/>
              <Tooltip formatter={(value:any) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="totalRevenue" name="Receita" fill={CHART_COLORS_REPORTS[0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>}
      </div>

      {/* Revenue by Product Section */}
      <div className="p-6 border border-secondary-200 rounded-lg">
        <h3 className="text-lg font-semibold text-secondary-700 mb-3">Top 10 Produtos/Serviços por Receita (Orçamentos Aprovados)</h3>
        {revenueByProduct.length === 0 ? <p className="text-sm text-secondary-500">Nenhuma receita de produto/serviço no período.</p> :
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {renderTable(['Produto/Serviço', 'Qtd. Vendida', 'Receita (R$)'], revenueByProduct.map(item => [item.productName, item.totalQuantity, item.totalRevenue]), '')}
          <ResponsiveContainer width="100%" height={300}>
             <BarChart data={revenueByProduct} layout="vertical" margin={{ top: 5, right: 30, left: 100, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis type="number" tickFormatter={(value) => `R$${value/1000}k`} />
              <YAxis type="category" dataKey="productName" width={100} interval={0} tick={{fontSize: 10}}/>
              <Tooltip formatter={(value:any) => `R$ ${Number(value).toFixed(2)}`} />
              <Legend />
              <Bar dataKey="totalRevenue" name="Receita" fill={CHART_COLORS_REPORTS[1]} />
            </BarChart>
          </ResponsiveContainer>
        </div>}
      </div>
      
      {/* Installation Profitability Section */}
      <div className="p-6 border border-secondary-200 rounded-lg">
        {renderTable(
            ['Orçamento ID', 'Cliente', 'Data Inst.', 'Receita (R$)', 'Custo Inst. (R$)', 'Saldo (R$)'],
            installationProfitability.map(item => [item.quoteId, item.clientName, item.installationDate ? new Date(item.installationDate+"T00:00:00").toLocaleDateString('pt-BR') : 'N/A', item.quoteTotal, item.installationCost || 0, item.profit]),
            'Rentabilidade por Instalação Concluída (Simplificado)'
        )}
      </div>

    </div>
  );
};

export default ReportsView;