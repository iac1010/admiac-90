
import React from 'react';
import { Quote, CompanyInfo } from '../types';

interface ServiceOrderPrintPreviewProps {
  quote: Quote;
  companyInfo: CompanyInfo;
  printRef: React.RefObject<HTMLDivElement>;
}

const ServiceOrderPrintPreview: React.FC<ServiceOrderPrintPreviewProps> = ({ quote, companyInfo, printRef }) => {
  const formatDate = (dateString?: string, includeTime = false) => {
    if (!dateString) return 'N/A';
    const dateToFormat = dateString.length === 10 ? `${dateString}T00:00:00` : dateString; // Ensure local if only date
    const options: Intl.DateTimeFormatOptions = { year: 'numeric', month: '2-digit', day: '2-digit' };
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    return new Date(dateToFormat).toLocaleDateString('pt-BR', options);
  };

  const osNumber = `OS-${quote.id}`;
  const issueDate = new Date().toLocaleDateString('pt-BR');

  return (
    <div ref={printRef} className="p-8 bg-white text-secondary-900 font-sans text-sm A4-sheet-os">
      {/* Header */}
      <div className="flex justify-between items-start mb-6 pb-4 border-b border-secondary-300">
        <div className="w-2/3">
          {companyInfo.logoUrl && <img src={companyInfo.logoUrl} alt={`${companyInfo.name} Logo`} className="h-14 mb-2 object-contain" />}
          <h1 className="text-xl font-bold text-secondary-800">{companyInfo.name}</h1>
          <p className="text-xs text-secondary-700">{companyInfo.address}</p>
          <p className="text-xs text-secondary-700">CNPJ: {companyInfo.cnpj}</p>
          <p className="text-xs text-secondary-700">Tel: {companyInfo.phone} | Email: {companyInfo.email}</p>
        </div>
        <div className="text-right w-1/3">
          <h2 className="text-2xl font-bold text-primary-600">ORDEM DE SERVIÇO</h2>
          <p className="text-md text-secondary-800">Número O.S.: <span className="font-semibold">{osNumber}</span></p>
          <p className="text-xs text-secondary-700">Data de Emissão: <span className="font-semibold">{issueDate}</span></p>
          <p className="text-xs text-secondary-700">Ref. Orçamento: <span className="font-semibold">{quote.id}</span></p>
        </div>
      </div>

      {/* Client Info */}
      <div className="mb-6 p-3 border border-secondary-200 rounded-md bg-secondary-50">
        <h3 className="font-semibold text-sm text-secondary-700 mb-1">Dados do Cliente:</h3>
        <p className="text-md text-secondary-900"><strong>{quote.clientDetails?.name || quote.clientName}</strong></p>
        <p className="text-xs text-secondary-800">Endereço: {quote.clientDetails?.address}</p>
        <p className="text-xs text-secondary-800">Contato: {quote.clientDetails?.contact}</p>
        {quote.clientDetails?.cnpj && <p className="text-xs text-secondary-800">CNPJ/CPF: {quote.clientDetails.cnpj}</p>}
      </div>

      {/* Installation Details */}
      <div className="mb-6 p-3 border border-secondary-200 rounded-md">
        <h3 className="font-semibold text-sm text-secondary-700 mb-1">Detalhes da Instalação/Serviço:</h3>
        <p className="text-xs text-secondary-800">
            Local da Instalação: <span className="font-medium text-secondary-900">{quote.installationAddress || quote.clientDetails?.address || 'Não especificado'}</span>
        </p>
        <p className="text-xs text-secondary-800">
            Data Prevista: <span className="font-medium text-secondary-900">{formatDate(quote.installationDate)}</span>
        </p>
         <p className="text-xs text-secondary-800">
            Progresso Atual: <span className="font-medium text-secondary-900">{quote.installationProgress || 'Não Iniciado'}</span>
        </p>
      </div>

      {/* Items Table */}
      <div className="mb-6">
        <h3 className="font-semibold text-sm text-secondary-700 mb-2">Descrição dos Serviços / Produtos:</h3>
        <table className="w-full border-collapse">
          <thead className="bg-primary-600 text-white">
            <tr>
              <th className="p-1.5 border border-primary-400 text-left text-xs w-12">Item</th>
              <th className="p-1.5 border border-primary-400 text-left text-xs">Nome</th>
              <th className="p-1.5 border border-primary-400 text-left text-xs">Descrição Detalhada</th>
              <th className="p-1.5 border border-primary-400 text-center text-xs w-16">Qtd.</th>
            </tr>
          </thead>
          <tbody>
            {quote.items.map((item, index) => (
              <tr key={item.id} className="border-b border-secondary-200">
                <td className="p-1.5 border border-secondary-300 text-secondary-900 text-center text-xs">{index + 1}</td>
                <td className="p-1.5 border border-secondary-300 text-xs">
                  <p className="font-semibold text-secondary-900">{item.name}</p>
                </td>
                <td className="p-1.5 border border-secondary-300 text-xs text-secondary-700">{item.description}</td>
                <td className="p-1.5 border border-secondary-300 text-center text-secondary-900 text-xs">{item.quantity}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Materials for Installation */}
      {quote.installationMaterials && (
        <div className="mb-6 p-3 border border-secondary-200 rounded-md">
          <h3 className="font-semibold text-sm text-secondary-700 mb-1">Materiais para Instalação:</h3>
          <p className="whitespace-pre-wrap text-xs text-secondary-900">{quote.installationMaterials}</p>
        </div>
      )}

      {/* Installation Notes */}
      {quote.installationNotes && (
        <div className="mb-6 p-3 border border-secondary-200 rounded-md">
          <h3 className="font-semibold text-sm text-secondary-700 mb-1">Observações da Instalação / Técnicas:</h3>
          <p className="whitespace-pre-wrap text-xs text-secondary-900">{quote.installationNotes}</p>
        </div>
      )}
      
      {/* Signature Area */}
      <div className="mt-12 pt-8 text-xs">
        <div className="grid grid-cols-2 gap-8">
            <div className="text-center">
                <p className="border-t border-secondary-400 pt-1">Assinatura do Técnico Responsável</p>
                <p className="mt-1 text-secondary-600">(Nome legível e Matrícula/ID, se aplicável)</p>
            </div>
            <div className="text-center">
                <p className="border-t border-secondary-400 pt-1">Assinatura do Cliente / Responsável</p>
                <p className="mt-1 text-secondary-600">(Nome legível e RG/CPF, se aplicável)</p>
            </div>
        </div>
         <p className="text-center mt-6 text-secondary-600">
            Declaro estar ciente e de acordo com os serviços descritos e/ou executados.
         </p>
      </div>


      {/* Footer */}
      <div className="text-center text-xs text-secondary-700 pt-8 border-t border-secondary-300 mt-10">
        <p>{companyInfo.name} - {companyInfo.phone} - {companyInfo.email}</p>
        <p>Obrigado pela preferência!</p>
      </div>
       <style>{`
        .A4-sheet-os {
          width: 210mm;
          min-height: 297mm;
          margin: auto;
          box-shadow: 0 0 0.5cm rgba(0,0,0,0.2);
          line-height: 1.4;
        }
        @media print {
          body * {
            visibility: hidden;
          }
          .A4-sheet-os, .A4-sheet-os * {
            visibility: visible;
          }
          .A4-sheet-os {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            height: auto;
            margin: 0;
            box-shadow: none;
            page-break-after: always;
            font-size: 10pt; /* Adjust base font for print if needed */
          }
          .A4-sheet-os h1 { font-size: 18pt; }
          .A4-sheet-os h2 { font-size: 16pt; }
          .A4-sheet-os h3 { font-size: 11pt; }
          .A4-sheet-os p, .A4-sheet-os td, .A4-sheet-os th { font-size: 9pt; }
          .A4-sheet-os .text-xs { font-size: 8pt; }
        }
      `}</style>
    </div>
  );
};

export default ServiceOrderPrintPreview;
