
import React, { useMemo } from 'react';
import { Quote, Client, QuoteStatus, InstallationProgressStatus, Product } from '../types';

interface MainDashboardViewProps {
  quotes: Quote[];
  clients: Client[]; // Assuming clients might be needed for quote details
  products: Product[]; // Added products for "Produtos Mais Vendidos"
  userPoints: number;
}

const KPICard: React.FC<{ title: string; value: string | number; icon: React.ReactNode; colorClass: string; footerText?: string; onClick?: () => void }> =
({ title, value, icon, colorClass, footerText, onClick }) => (
  <div
    className={`p-5 rounded-xl shadow-lg transition-all duration-300 ease-in-out hover:shadow-xl hover:scale-105 ${colorClass} text-white cursor-pointer`}
    onClick={onClick}
    role={onClick ? "button" : undefined}
    tabIndex={onClick ? 0 : undefined}
    onKeyDown={onClick ? (e) => { if (e.key === 'Enter' || e.key === ' ') onClick() } : undefined}
    aria-label={`${title}: ${value}`}
  >
    <div className="flex justify-between items-center mb-2">
      <div className="text-3xl opacity-80">{icon}</div>
      <div className="text-right">
        <p className="text-4xl font-bold">{value}</p>
        <p className="text-sm uppercase tracking-wide opacity-90">{title}</p>
      </div>
    </div>
    {footerText && <p className="text-xs opacity-70 mt-3">{footerText}</p>}
  </div>
);

const BadgeItem: React.FC<{ icon: string; name: string; bgColor: string }> = ({ icon, name, bgColor }) => (
    <div className={`flex flex-col items-center p-4 rounded-lg shadow-md hover:shadow-lg transition-shadow ${bgColor}`}>
        <span className="text-4xl mb-2">{icon}</span>
        <h4 className="font-semibold text-secondary-800 text-sm text-center">{name}</h4>
    </div>
);


const MainDashboardView: React.FC<MainDashboardViewProps> = ({ quotes, clients, products, userPoints }) => {

  const openQuotesCount = useMemo(() =>
    quotes.filter(q => q.status === QuoteStatus.PENDING || q.status === QuoteStatus.DRAFT).length
  , [quotes]);

  const approvedQuotesCount = useMemo(() =>
    quotes.filter(q => q.status === QuoteStatus.APPROVED).length
  , [quotes]);

  const completedInstallationsCount = useMemo(() =>
    quotes.filter(q => q.installationProgress === InstallationProgressStatus.COMPLETED).length
  , [quotes]);

  const totalRelevantQuotes = useMemo(() =>
    quotes.filter(q => q.status !== QuoteStatus.DRAFT && q.status !== QuoteStatus.CANCELED).length
  , [quotes]);

  const overallProgress = useMemo(() => {
    if (totalRelevantQuotes === 0) return 0;
    const completedOrApprovedCount = quotes.filter(q =>
        q.status === QuoteStatus.APPROVED || q.installationProgress === InstallationProgressStatus.COMPLETED
    ).length;
    // To avoid double counting, let's count unique quotes that are either approved OR have completed installation
    const uniqueRelevantQuotes = new Set<string>();
    quotes.forEach(q => {
        if (q.status === QuoteStatus.APPROVED) uniqueRelevantQuotes.add(q.id);
        if (q.installationProgress === InstallationProgressStatus.COMPLETED) uniqueRelevantQuotes.add(q.id);
    });

    // Filter these unique IDs from the original quotes array to ensure they also meet "relevant" criteria
    const actuallyCompletedOrApprovedRelevant = quotes.filter(q =>
        uniqueRelevantQuotes.has(q.id) && q.status !== QuoteStatus.DRAFT && q.status !== QuoteStatus.CANCELED
    ).length;

    return (actuallyCompletedOrApprovedRelevant / totalRelevantQuotes) * 100;

  }, [quotes, totalRelevantQuotes]);

  const displayProgress = Math.round(Math.max(0, Math.min(100, overallProgress)));

  const topSellingProducts = useMemo(() => {
    const productRevenueMap = new Map<string, { name: string; revenue: number; quantity: number }>();
    quotes.forEach(quote => {
      if (quote.status === QuoteStatus.APPROVED) {
        quote.items.forEach(item => {
          const productInfo = products.find(p => p.id === item.productId);
          const productName = productInfo?.name || 'Produto Desconhecido';
          const current = productRevenueMap.get(item.productId) || { name: productName, revenue: 0, quantity: 0 };
          current.revenue += item.totalPrice;
          current.quantity += item.quantity;
          productRevenueMap.set(item.productId, current);
        });
      }
    });
    return Array.from(productRevenueMap.values())
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5); // Top 5 products
  }, [quotes, products]);

  const topQuotesByValue = useMemo(() => {
    return quotes
      .filter(q => q.status === QuoteStatus.APPROVED)
      .sort((a, b) => b.totalAmount - a.totalAmount)
      .slice(0, 5); // Top 5 quotes
  }, [quotes]);


  return (
    <div className="space-y-6 md:space-y-8">
      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <KPICard title="Orçamentos em Aberto" value={openQuotesCount} icon={<span>📝</span>} colorClass="bg-yellow-500" />
        <KPICard title="Orçamentos Aprovados" value={approvedQuotesCount} icon={<span>✅</span>} colorClass="bg-green-500" />
        <KPICard title="Instalações Concluídas" value={completedInstallationsCount} icon={<span>🛠️</span>} colorClass="bg-orange-500" />
        <KPICard title="Seus Pontos (XP)" value={userPoints} icon={<span>⭐</span>} colorClass="bg-indigo-500" />
      </div>

      {/* Progresso Geral de Demandas */}
      <div className="bg-white p-6 rounded-xl shadow-lg">
        <h3 className="text-lg font-semibold text-secondary-700 mb-3">Progresso Geral de Demandas</h3>
        <div className="w-full bg-secondary-200 rounded-full h-6">
          <div
            className="bg-primary-500 h-6 rounded-full text-xs font-medium text-blue-100 text-center p-1 leading-none transition-all duration-500 ease-out"
            style={{ width: `${displayProgress}%` }}
            role="progressbar"
            aria-valuenow={displayProgress}
            aria-valuemin={0}
            aria-valuemax={100}
          >
           {displayProgress}%
          </div>
        </div>
         <p className="text-xs text-secondary-500 mt-2">Baseado em orçamentos aprovados ou com instalação concluída sobre o total de orçamentos (excluindo rascunhos e cancelados).</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 md:gap-8">
        {/* Suas Medalhas e Badges */}
        <div className="lg:col-span-2 bg-white p-6 rounded-xl shadow-lg">
            <h3 className="text-lg font-semibold text-secondary-700 mb-1">Suas Medalhas e Badges</h3>
            <p className="text-sm text-secondary-500 mb-4">Continue trabalhando para conquistar badges!</p>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <BadgeItem icon="🚀" name="Iniciante Produtivo" bgColor="bg-blue-100" />
                <BadgeItem icon="💡" name="Mestre da Eficiência" bgColor="bg-yellow-100" />
                <BadgeItem icon="🏗️" name="Lenda da Construção" bgColor="bg-orange-100" />
                <BadgeItem icon="🛡️" name="Checklist Hero" bgColor="bg-green-100" />
            </div>
        </div>

        <div className="space-y-6 md:space-y-8">
            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-secondary-700 mb-3">Produtos Mais Vendidos (Top 5 por Receita)</h3>
                {topSellingProducts.length > 0 ? (
                    <ul className="space-y-2">
                        {topSellingProducts.map((product, index) => (
                        <li key={product.name} className="flex justify-between items-center p-2 bg-secondary-50 rounded-md text-sm">
                            <span className="font-medium text-secondary-700">{index + 1}. {product.name}</span>
                            <span className="font-semibold text-primary-600">R$ {product.revenue.toFixed(2)}</span>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-secondary-500">Nenhum produto vendido em orçamentos aprovados ainda.</p>
                )}
            </div>

            <div className="bg-white p-6 rounded-xl shadow-lg">
                <h3 className="text-lg font-semibold text-secondary-700 mb-3">Top Orçamentos por Valor (Top 5 Aprovados)</h3>
                 {topQuotesByValue.length > 0 ? (
                    <ul className="space-y-2">
                        {topQuotesByValue.map((quote, index) => (
                        <li key={quote.id} className="flex justify-between items-center p-2 bg-secondary-50 rounded-md text-sm">
                            <div className="flex items-center">
                                <span className="text-secondary-700 mr-2">{index + 1}.</span>
                                <div>
                                    <span className="font-medium text-secondary-700">ID: {quote.id}</span>
                                    <span className="block text-xs text-secondary-500">Cliente: {quote.clientName}</span>
                                </div>
                            </div>
                            <span className="font-semibold text-primary-600">R$ {quote.totalAmount.toFixed(2)}</span>
                        </li>
                        ))}
                    </ul>
                ) : (
                    <p className="text-sm text-secondary-500">Nenhum orçamento aprovado para exibir.</p>
                )}
            </div>
        </div>
      </div>

    </div>
  );
};

export default MainDashboardView;
