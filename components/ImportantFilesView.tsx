import React, { useState, useEffect } from 'react';
import { ImportantLink } from '../types';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';

interface ImportantFilesViewProps {
  links: ImportantLink[];
  onSaveLink: (link: ImportantLink) => void;
  onDeleteLink: (linkId: string) => void;
}

const ImportantFilesView: React.FC<ImportantFilesViewProps> = ({ links, onSaveLink, onDeleteLink }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<ImportantLink | null>(null);
  const [currentLinkData, setCurrentLinkData] = useState<Partial<ImportantLink>>({ name: '', url: '', description: '' });
  const [formError, setFormError] = useState<string | null>(null);

  const openModalForNew = () => {
    setEditingLink(null);
    setCurrentLinkData({ id: `link-${Date.now()}`, name: '', url: '', description: '' });
    setFormError(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (link: ImportantLink) => {
    setEditingLink(link);
    setCurrentLinkData({ ...link });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingLink(null);
    setCurrentLinkData({ name: '', url: '', description: '' });
    setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentLinkData(prev => ({ ...prev, [name]: value }));
  };

  const isValidUrl = (urlString: string): boolean => {
    try {
      new URL(urlString);
      return true;
    } catch (e) {
      return false;
    }
  };

  const handleSave = () => {
    if (!currentLinkData.name?.trim()) {
      setFormError("O nome do link é obrigatório.");
      return;
    }
    if (!currentLinkData.url?.trim()) {
      setFormError("A URL do link é obrigatória.");
      return;
    }
    if (!isValidUrl(currentLinkData.url)) {
      setFormError("A URL fornecida não é válida. Certifique-se de incluir http:// ou https://");
      return;
    }
    setFormError(null);
    onSaveLink(currentLinkData as ImportantLink);
    closeModal();
  };

  return (
    <div className="p-0 md:p-6 bg-white shadow-lg rounded-lg">
      <div className="px-6 md:px-0 pt-6 md:pt-0 flex justify-between items-center mb-6">
        <h2 className="text-2xl font-semibold text-secondary-800">Arquivos e Links Importantes</h2>
        <Button onClick={openModalForNew} variant="primary"
          leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
        >
          Adicionar Novo Link
        </Button>
      </div>

      {links.length === 0 ? (
        <p className="text-center text-secondary-600 py-8">Nenhum link importante adicionado ainda.</p>
      ) : (
        <div className="space-y-4">
          {links.map(link => (
            <div key={link.id} className="p-4 border border-secondary-200 rounded-lg shadow-sm hover:shadow-md transition-shadow bg-secondary-50">
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
                <div>
                  <a
                    href={link.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-lg font-semibold text-primary-600 hover:text-primary-700 hover:underline break-all"
                  >
                    {link.name}
                  </a>
                  <p className="text-xs text-secondary-500 break-all">{link.url}</p>
                  {link.description && <p className="text-sm text-secondary-700 mt-1">{link.description}</p>}
                </div>
                <div className="mt-3 sm:mt-0 flex space-x-2 shrink-0">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(link)} title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => onDeleteLink(link.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                  </Button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingLink ? "Editar Link Importante" : "Adicionar Novo Link Importante"}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md">{formError}</p>}
          <Input
            label="Nome do Link"
            name="name"
            value={currentLinkData.name || ''}
            onChange={handleChange}
            required
            placeholder="Ex: Planilha de Controle Financeiro"
          />
          <Input
            label="URL do Link"
            name="url"
            type="url"
            value={currentLinkData.url || ''}
            onChange={handleChange}
            required
            placeholder="https://docs.google.com/spreadsheets/..."
          />
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">
              Descrição (Opcional)
            </label>
            <textarea
              id="description"
              name="description"
              rows={2}
              value={currentLinkData.description || ''}
              onChange={handleChange}
              className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
              placeholder="Uma breve descrição sobre o link..."
            />
          </div>
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSave}>{editingLink ? "Salvar Alterações" : "Adicionar Link"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ImportantFilesView;