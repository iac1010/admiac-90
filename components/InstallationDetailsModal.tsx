
import React, { useState, useEffect } from 'react';
import { Quote, InstallationProgressStatus } from '../types';
import Modal from './common/Modal';
import Input from './common/Input';
import Select from './common/Select';
import Button from './common/Button';
import { INSTALLATION_PROGRESS_STATUS_OPTIONS } from '../constants';

interface InstallationDetailsModalProps {
  isOpen: boolean;
  onClose: () => void;
  quote: Quote;
  onSave: (updatedQuote: Quote) => void;
  onGenerateServiceOrder: (quote: Quote) => void; // New prop for OS
}

const InstallationDetailsModal: React.FC<InstallationDetailsModalProps> = ({ 
  isOpen, 
  onClose, 
  quote, 
  onSave,
  onGenerateServiceOrder
}) => {
  const [formData, setFormData] = useState<Partial<Quote>>({});

  useEffect(() => {
    if (quote) {
      setFormData({
        id: quote.id, 
        installationDate: quote.installationDate || '',
        installationMaterials: quote.installationMaterials || '',
        installationCost: quote.installationCost || 0,
        installationAddress: quote.installationAddress || quote.clientDetails?.address || '',
        installationProgress: quote.installationProgress || InstallationProgressStatus.NOT_STARTED,
        installationNotes: quote.installationNotes || '',
      });
    }
  }, [quote, isOpen]); 

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number | InstallationProgressStatus = value;
    if (name === 'installationCost') {
      processedValue = parseFloat(value) || 0;
    } else if (name === 'installationProgress') {
      processedValue = value as InstallationProgressStatus;
    }
    
    setFormData(prev => ({ ...prev, [name]: processedValue }));
  };

  const handleSubmit = () => {
    const updatedQuoteData: Partial<Quote> = {
        installationDate: formData.installationDate,
        installationMaterials: formData.installationMaterials,
        installationCost: formData.installationCost,
        installationAddress: formData.installationAddress,
        installationProgress: formData.installationProgress,
        installationNotes: formData.installationNotes,
    };
    onSave({ ...quote, ...updatedQuoteData }); 
  };

  const handleGenerateOS = () => {
    onGenerateServiceOrder(quote); // Pass the full current quote
    onClose(); // Close this modal after triggering OS generation
  };

  const progressOptions = INSTALLATION_PROGRESS_STATUS_OPTIONS.map(status => ({
    value: status,
    label: status,
  }));

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Gerenciar Instalação - Orçamento #${quote?.id}`} size="lg">
      <div className="space-y-4">
        <Input
          label="Data da Instalação"
          name="installationDate"
          type="date"
          value={formData.installationDate || ''}
          onChange={handleChange}
        />
        <Input
          label="Endereço da Instalação"
          name="installationAddress"
          value={formData.installationAddress || ''}
          onChange={handleChange}
          placeholder="Ex: Rua da Instalação, 100"
        />
        <div>
          <label htmlFor="installationMaterials" className="block text-sm font-medium text-secondary-700 mb-1">
            Materiais para Instalação
          </label>
          <textarea
            id="installationMaterials"
            name="installationMaterials"
            rows={3}
            value={formData.installationMaterials || ''}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Liste os materiais necessários..."
          />
        </div>
        <Input
          label="Custo da Instalação (R$)"
          name="installationCost"
          type="number"
          step="0.01"
          value={formData.installationCost || 0}
          onChange={handleChange}
        />
        <Select
          label="Progresso da Instalação"
          name="installationProgress"
          value={formData.installationProgress || InstallationProgressStatus.NOT_STARTED}
          onChange={handleChange}
          options={progressOptions}
        />
        <div>
          <label htmlFor="installationNotes" className="block text-sm font-medium text-secondary-700 mb-1">
            Observações da Instalação
          </label>
          <textarea
            id="installationNotes"
            name="installationNotes"
            rows={3}
            value={formData.installationNotes || ''}
            onChange={handleChange}
            className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Detalhes adicionais, ocorrências, etc."
          />
        </div>
      </div>
      <div className="mt-6 flex justify-between">
        <Button 
            variant="success" 
            onClick={handleGenerateOS}
            leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" /></svg>}
        >
            Gerar O.S.
        </Button>
        <div className="space-x-3">
            <Button variant="secondary" onClick={onClose}>Cancelar</Button>
            <Button variant="primary" onClick={handleSubmit}>Salvar Detalhes</Button>
        </div>
      </div>
    </Modal>
  );
};

export default InstallationDetailsModal;
