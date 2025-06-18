
import React from 'react';
import { Quote, CompanyInfo } from '../types';
import { APP_NAME } from '../constants';

interface QuotePrintPreviewProps {
  quote: Quote;
  companyInfo: CompanyInfo;
  printRef: React.RefObject<HTMLDivElement>;
}

const QuotePrintPreview: React.FC<QuotePrintPreviewProps> = ({ quote, companyInfo, printRef }) => {
  const formatDate = (dateString: string) => new Date(dateString).toLocaleDateString('pt-BR');

  return (
    <div ref={printRef} className="p-8 bg-white text-secondary-900 font-sans text-sm A4-sheet">
      {/* Header */}
      <div className="flex justify-between items-start mb-8">
        <div>
          {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="h-12 mb-2" />}
          <h1 className="text-2xl font-bold text-secondary-800">{companyInfo.name}</h1>
          <p className="text-secondary-800">{companyInfo.address}</p>
          <p className="text-secondary-800">CNPJ: {companyInfo.cnpj}</p>
          <p className="text-secondary-800">Tel: {companyInfo.phone} | Email: {companyInfo.email}</p>
          {companyInfo.website && <p className="text-secondary-800">Website: {companyInfo.website}</p>}
        </div>
        <div className="text-right">
          <h2 className="text-3xl font-bold text-secondary-800">ORÇAMENTO</h2>
          <p className="text-lg text-secondary-800">Número: <span className="font-semibold">{quote.id}</span></p>
          <p className="text-secondary-800">Data: <span className="font-semibold">{formatDate(quote.date)}</span></p>
          {quote.validityDays && <p className="text-secondary-800">Validade: <span className="font-semibold">{quote.validityDays} dias</span></p>}
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-8 p-4 border border-secondary-300 rounded-md bg-secondary-50">
        <h3 className="font-semibold text-secondary-700 mb-1">Cliente:</h3>
        <p className="font-bold text-lg text-secondary-900">{quote.clientDetails?.name || quote.clientName}</p>
        <p className="text-secondary-800">{quote.clientDetails?.address}</p>
        <p className="text-secondary-800">Contato: {quote.clientDetails?.contact}</p>
        {quote.clientDetails?.cnpj && <p className="text-secondary-800">CNPJ/CPF: {quote.clientDetails.cnpj}</p>}
      </div>

      {/* Items Table */}
      <div className="mb-8">
        <table className="w-full border-collapse">
          <thead>
            <tr className="bg-primary-600 text-white">
              <th className="p-2 border border-primary-400 text-left">Item</th>
              <th className="p-2 border border-primary-400 text-left">Descrição</th>
              <th className="p-2 border border-primary-400 text-center">Qtd.</th>
              <th className="p-2 border border-primary-400 text-right">Preço Unit. (R$)</th>
              <th className="p-2 border border-primary-400 text-right">Total (R$)</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={item.id} className="border-b border-secondary-200 hover:bg-secondary-50">
                <td className="p-2 border border-secondary-300 text-secondary-900">{index + 1}</td>
                <td className="p-2 border border-secondary-300">
                  <p className="font-semibold text-secondary-900">{item.name}</p>
                  <p className="text-xs text-secondary-700">{item.description}</p>
                </td>
                <td className="p-2 border border-secondary-300 text-center text-secondary-900">{item.quantity}</td>
                <td className="p-2 border border-secondary-300 text-right text-secondary-900">{item.unitPrice.toFixed(2)}</td>
                <td className="p-2 border border-secondary-300 text-right text-secondary-900">{item.totalPrice.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Totals and Payment */}
      <div className="flex justify-end mb-8">
        <div className="w-1/2">
          <div className="flex justify-between p-2 bg-secondary-100">
            <span className="font-semibold text-secondary-900">Subtotal:</span>
            <span className="text-secondary-900">R$ {quote.subTotal.toFixed(2)}</span>
          </div>
          {/* Discount can be added here if implemented */}
          <div className="flex justify-between p-2 bg-primary-600 mt-1"> {/* Darker red background */}
            <span className="font-bold text-lg text-white">TOTAL GERAL:</span> {/* White text */}
            <span className="font-bold text-lg text-white">R$ {quote.totalAmount.toFixed(2)}</span> {/* White text */}
          </div>
        </div>
      </div>
      
      <div className="mb-8 p-4 border border-secondary-300 rounded-md">
        <h3 className="font-semibold text-secondary-700 mb-1">Condições de Pagamento:</h3>
        <p className="text-secondary-900">{quote.paymentTerms}</p>
        {quote.installments > 1 && quote.installmentAmount > 0 && (
          <p className="text-secondary-900">{quote.installments} parcelas de R$ {quote.installmentAmount.toFixed(2)}</p>
        )}
      </div>

      {/* Notes */}
      {quote.notes && (
        <div className="mb-8 p-4 border border-secondary-300 rounded-md">
          <h3 className="font-semibold text-secondary-700 mb-1">Observações:</h3>
          <p className="whitespace-pre-wrap text-secondary-900">{quote.notes}</p>
        </div>
      )}
      
      {/* Salesperson */}
       <div className="mb-8 text-secondary-900">
        <p>Atenciosamente,</p>
        <p className="font-semibold">{quote.salesperson}</p>
        <p>{companyInfo.name}</p>
      </div>

      {/* Footer */}
      <div className="text-center text-xs text-secondary-800 pt-8 border-t border-secondary-300 mt-8">
        <p>{APP_NAME} | {companyInfo.name} - {companyInfo.phone} - {companyInfo.email}</p>
        <p>Este orçamento é válido por {quote.validityDays || 'N/A'} dias a partir da data de emissão.</p>
      </div>
       <style>{`
        .A4-sheet {
          width: 210mm;
          min-height: 297mm; /* Use min-height to allow content to expand */
          margin: auto; /* Center the sheet if it's smaller than the viewport */
          box-shadow: 0 0 0.5cm rgba(0,0,0,0.2);
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .A4-sheet, .A4-sheet * {
            visibility: visible;
          }
          .A4-sheet {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            box-shadow: none;
            page-break-after: always; /* Ensure proper page breaks for multi-page content */
          }
        }
      `}</style>
    </div>
  );
};

export default QuotePrintPreview;