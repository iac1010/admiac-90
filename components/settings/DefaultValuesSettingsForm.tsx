import React, { useState, useEffect } from 'react';
import { AppSettings } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';

interface DefaultValuesSettingsFormProps {
  initialSettings: AppSettings;
  onSave: (settings: AppSettings) => void;
}

const DefaultValuesSettingsForm: React.FC<DefaultValuesSettingsFormProps> = ({ initialSettings, onSave }) => {
  const [settings, setSettings] = useState<AppSettings>(initialSettings);
  const [newPaymentTerm, setNewPaymentTerm] = useState('');
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setSettings(initialSettings);
  }, [initialSettings]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value, type } = e.target;
    setSettings(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseInt(value, 10) || 0 : value 
    }));
    setIsSaved(false);
  };

  const handleAddPaymentTerm = () => {
    if (newPaymentTerm.trim() && !settings.paymentTermSuggestions.includes(newPaymentTerm.trim())) {
      setSettings(prev => ({
        ...prev,
        paymentTermSuggestions: [...prev.paymentTermSuggestions, newPaymentTerm.trim()],
      }));
      setNewPaymentTerm('');
      setIsSaved(false);
    }
  };

  const handleRemovePaymentTerm = (termToRemove: string) => {
    setSettings(prev => ({
      ...prev,
      paymentTermSuggestions: prev.paymentTermSuggestions.filter(term => term !== termToRemove),
    }));
    setIsSaved(false);
  };
  
  const handleEditPaymentTerm = (index: number, newValue: string) => {
    const updatedTerms = [...settings.paymentTermSuggestions];
    if (newValue.trim()) {
        updatedTerms[index] = newValue.trim();
        setSettings(prev => ({...prev, paymentTermSuggestions: updatedTerms}));
        setIsSaved(false);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(settings);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <div>
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Valores Padrão para Novos Orçamentos</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Input
            label="Vendedor Padrão"
            name="defaultSalesperson"
            value={settings.defaultSalesperson}
            onChange={handleChange}
          />
          <Input
            label="Validade Padrão (dias)"
            name="defaultValidityDays"
            type="number"
            value={settings.defaultValidityDays}
            onChange={handleChange}
            min="0"
          />
        </div>
      </div>

      <div>
        <h3 className="text-xl font-semibold text-secondary-700 mb-4">Sugestões de Condições de Pagamento</h3>
        <ul className="space-y-2 mb-4 max-h-60 overflow-y-auto border p-2 rounded-md">
          {settings.paymentTermSuggestions.map((term, index) => (
            <li key={index} className="flex items-center justify-between p-2 bg-secondary-50 rounded">
              <Input
                value={term}
                onChange={(e) => handleEditPaymentTerm(index, e.target.value)}
                containerClassName="flex-grow mr-2 mb-0"
                className="text-sm"
              />
              <Button type="button" variant="danger" size="sm" onClick={() => handleRemovePaymentTerm(term)}>
                Remover
              </Button>
            </li>
          ))}
           {settings.paymentTermSuggestions.length === 0 && (
            <li className="p-2 text-sm text-secondary-500">Nenhuma sugestão cadastrada.</li>
          )}
        </ul>
        <div className="flex items-end space-x-2">
          <Input
            label="Nova Sugestão de Pagamento"
            value={newPaymentTerm}
            onChange={(e) => setNewPaymentTerm(e.target.value)}
            placeholder="Ex: 30/60/90 dias"
            containerClassName="flex-grow mb-0"
          />
          <Button type="button" variant="secondary" onClick={handleAddPaymentTerm} className="shrink-0">
            Adicionar
          </Button>
        </div>
      </div>
      
      <div className="flex items-center space-x-4 pt-4 border-t border-secondary-200">
        <Button type="submit" variant="primary">
          Salvar Valores Padrão
        </Button>
        {isSaved && <p className="text-sm text-green-600">Configurações salvas com sucesso!</p>}
      </div>
    </form>
  );
};

export default DefaultValuesSettingsForm;