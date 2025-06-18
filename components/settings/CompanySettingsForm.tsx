import React, { useState, useEffect } from 'react';
import { CompanyInfo } from '../../types';
import Input from '../common/Input';
import Button from '../common/Button';

interface CompanySettingsFormProps {
  initialCompanyInfo: CompanyInfo;
  onSave: (info: CompanyInfo) => void;
}

const CompanySettingsForm: React.FC<CompanySettingsFormProps> = ({ initialCompanyInfo, onSave }) => {
  const [formData, setFormData] = useState<CompanyInfo>(initialCompanyInfo);
  const [isSaved, setIsSaved] = useState(false);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);

  useEffect(() => {
    setFormData(initialCompanyInfo);
    setSelectedFileName(null); // Reset file name on initial load or prop change
  }, [initialCompanyInfo]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setIsSaved(false);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type === "image/jpeg" || file.type === "image/png") {
        const reader = new FileReader();
        reader.onloadend = () => {
          setFormData(prev => ({ ...prev, logoUrl: reader.result as string }));
          setSelectedFileName(file.name);
          setIsSaved(false);
        };
        reader.readAsDataURL(file);
      } else {
        alert("Por favor, selecione um arquivo JPG ou PNG.");
        e.target.value = ''; // Reset file input
        setSelectedFileName(null);
      }
    } else {
      // If no file is selected (e.g., user cancels dialog), keep existing or clear
      // For simplicity, let's allow clearing if they had one and now select none.
      // Or, keep current logo if they cancel selection of a new one.
      // Current behavior: if they cancel, formData.logoUrl remains unchanged.
      // If they explicitly want to remove logo, that's a different feature.
      setSelectedFileName(null);
    }
  };


  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(formData);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000); // Hide message after 3 seconds
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <h3 className="text-xl font-semibold text-secondary-700 mb-4">Informações da Empresa</h3>
      
      <Input
        label="Nome da Empresa"
        name="name"
        value={formData.name}
        onChange={handleChange}
        required
      />
      
      <div>
        <label htmlFor="logoUpload" className="block text-sm font-medium text-secondary-700 mb-1">
          Logo da Empresa (JPG, PNG)
        </label>
        <div className="mt-1 flex items-center">
          <label
            htmlFor="logoUpload"
            className="cursor-pointer bg-white py-2 px-3 border border-secondary-300 rounded-md shadow-sm text-sm leading-4 font-medium text-secondary-700 hover:bg-secondary-50 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-primary-500"
          >
            <span>Escolher Arquivo</span>
            <input id="logoUpload" name="logoUpload" type="file" className="sr-only" accept=".jpg, .jpeg, .png" onChange={handleFileChange} />
          </label>
          {selectedFileName && <span className="ml-3 text-sm text-secondary-600">{selectedFileName}</span>}
        </div>
        {formData.logoUrl && (
          <div className="mt-3">
            <p className="text-xs text-secondary-500 mb-1">Pré-visualização do Logo:</p>
            <img src={formData.logoUrl} alt="Pré-visualização do Logo" className="max-h-24 border border-secondary-200 p-1 rounded bg-white" />
          </div>
        )}
      </div>

      <Input
        label="Endereço"
        name="address"
        value={formData.address}
        onChange={handleChange}
      />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Telefone"
          name="phone"
          value={formData.phone}
          onChange={handleChange}
        />
        <Input
          label="Email"
          name="email"
          type="email"
          value={formData.email}
          onChange={handleChange}
        />
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Input
          label="Website"
          name="website"
          value={formData.website || ''}
          onChange={handleChange}
          placeholder="www.suaempresa.com"
        />
        <Input
          label="CNPJ"
          name="cnpj"
          value={formData.cnpj || ''}
          onChange={handleChange}
        />
      </div>
      
      <div className="flex items-center space-x-4">
        <Button type="submit" variant="primary">
          Salvar Informações da Empresa
        </Button>
        {isSaved && <p className="text-sm text-green-600">Informações salvas com sucesso!</p>}
      </div>
    </form>
  );
};

export default CompanySettingsForm;