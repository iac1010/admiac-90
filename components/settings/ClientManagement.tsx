
import React, { useState, useEffect } from 'react';
import { Client } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import SearchBar from '../common/SearchBar'; // Assuming SearchBar is generic enough

interface ClientManagementProps {
  initialClients: Client[];
  onUpdateClients: (clients: Client[]) => void;
}

const ClientManagement: React.FC<ClientManagementProps> = ({ initialClients, onUpdateClients }) => {
  const [clients, setClientsState] = useState<Client[]>(initialClients);
  const [filteredClients, setFilteredClients] = useState<Client[]>(initialClients);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [currentClient, setCurrentClient] = useState<Partial<Client>>({});
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    setClientsState(initialClients);
    setFilteredClients(initialClients);
  }, [initialClients]);

  const handleSearch = (results: Client[]) => {
    setFilteredClients(results);
  };

  const openModalForNew = () => {
    setEditingClient(null);
    setCurrentClient({ id: `client-${Date.now()}` });
    setIsModalOpen(true);
  };

  const openModalForEdit = (client: Client) => {
    setEditingClient(client);
    setCurrentClient({ ...client });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingClient(null);
    setCurrentClient({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setCurrentClient(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveClient = () => {
    if (!currentClient.name || !currentClient.id) {
      alert("Nome do cliente é obrigatório."); // Simple validation
      return;
    }
    let updatedClients;
    if (editingClient) {
      updatedClients = clients.map(c => c.id === editingClient.id ? (currentClient as Client) : c);
    } else {
      updatedClients = [...clients, currentClient as Client];
    }
    setClientsState(updatedClients);
    onUpdateClients(updatedClients);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    closeModal();
  };

  const handleDeleteClient = (clientId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este cliente?")) {
      const updatedClients = clients.filter(c => c.id !== clientId);
      setClientsState(updatedClients);
      onUpdateClients(updatedClients);
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-secondary-700">Gerenciar Clientes</h3>
      <div className="flex justify-between items-center">
        <div className="w-full md:w-1/2">
            <SearchBar<Client>
            items={clients}
            searchKeys={['name', 'cnpj', 'contact']}
            onSearch={handleSearch}
            placeholder="Buscar cliente..."
            label="Buscar Clientes"
            />
        </div>
        <Button onClick={openModalForNew} variant="primary">
          Adicionar Novo Cliente
        </Button>
      </div>

      {isSaved && <p className="text-sm text-green-600 mb-4">Lista de clientes atualizada!</p>}

      <div className="overflow-x-auto bg-white rounded-md shadow">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Contato</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">CNPJ</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredClients.length > 0 ? filteredClients.map(client => (
              <tr key={client.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{client.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{client.contact}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{client.cnpj || 'N/A'}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(client)} title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteClient(client.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                  </Button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-secondary-500">Nenhum cliente encontrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingClient ? "Editar Cliente" : "Adicionar Novo Cliente"}>
        <div className="space-y-4">
          <Input label="ID (automático)" name="id" value={currentClient.id || ''} readOnly disabled containerClassName="mb-0"/>
          <Input label="Nome do Cliente" name="name" value={currentClient.name || ''} onChange={handleChange} required placeholder="Ex: Condomínio Edifício Telles"/>
          <Input label="Endereço" name="address" value={currentClient.address || ''} onChange={handleChange} placeholder="Ex: Rua das Palmeiras, 123"/>
          <Input label="Contato (Telefone/Email)" name="contact" value={currentClient.contact || ''} onChange={handleChange} placeholder="Ex: Sr. Telles (11) 99999-0000"/>
          <Input label="CNPJ/CPF (Opcional)" name="cnpj" value={currentClient.cnpj || ''} onChange={handleChange} />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveClient}>{editingClient ? "Salvar Alterações" : "Adicionar Cliente"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ClientManagement;