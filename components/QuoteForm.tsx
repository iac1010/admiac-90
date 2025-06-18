import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Quote, QuoteItem, Client, Product, QuoteStatus, AppSettings } from '../types';
// Removed MOCK_CLIENTS, MOCK_PRODUCTS, DEFAULT_SALESPERSON, DEFAULT_VALIDITY_DAYS, PAYMENT_TERM_SUGGESTIONS
import { QUOTE_STATUS_OPTIONS } from '../constants'; 
import Input from './common/Input';
import Button from './common/Button';
import Select from './common/Select';
import SearchBar from './common/SearchBar';
import Modal from './common/Modal';

interface QuoteFormProps {
  initialQuote?: Quote | null;
  onSave: (quote: Quote) => void;
  onCancel: () => void;
  isEditing: boolean;
  clients: Client[]; 
  products: Product[]; 
  appSettings: AppSettings; 
  onAddClient: (client: Client) => void; // For adding new client
}

const QuoteForm: React.FC<QuoteFormProps> = ({ 
  initialQuote, 
  onSave, 
  onCancel, 
  isEditing,
  clients,
  products,
  appSettings,
  onAddClient 
}) => {
  const generateNewQuoteId = (version: number = 1) => {
    const baseIdSource = initialQuote?.originalQuoteId || initialQuote?.id;
    const baseId = baseIdSource ? baseIdSource.split('-v')[0] : `ORC-${Date.now()}`;
    return version > 1 ? `${baseId}-v${version}` : baseId;
  };

  const [quote, setQuote] = useState<Quote>(() => {
    if (initialQuote) return JSON.parse(JSON.stringify(initialQuote)); // Deep copy
    return {
      id: generateNewQuoteId(),
      originalQuoteId: undefined,
      version: 1,
      clientId: '',
      clientName: '',
      clientDetails: undefined,
      date: new Date().toISOString().split('T')[0],
      items: [],
      subTotal: 0,
      discount: 0,
      totalAmount: 0,
      paymentTerms: appSettings.paymentTermSuggestions[0] || '',
      installments: 1,
      installmentAmount: 0,
      status: QuoteStatus.DRAFT,
      salesperson: appSettings.defaultSalesperson,
      validityDays: appSettings.defaultValidityDays,
      notes: '',
    };
  });

  const [filteredClientsForModal, setFilteredClientsForModal] = useState<Client[]>(clients);
  const [showClientModal, setShowClientModal] = useState(false);
  
  const [filteredProductsForModal, setFilteredProductsForModal] = useState<Product[]>(products);
  const [showProductModal, setShowProductModal] = useState(false);

  const [showAddClientModal, setShowAddClientModal] = useState(false);
  const [newClientData, setNewClientData] = useState<Partial<Client>>({});
  const [newClientError, setNewClientError] = useState<string | null>(null);


  useEffect(() => {
    if (initialQuote) {
      const deepCopiedInitialQuote = JSON.parse(JSON.stringify(initialQuote));
      setQuote(deepCopiedInitialQuote); 
      const client = clients.find(c => c.id === deepCopiedInitialQuote.clientId);
      if (client) {
        setQuote(prev => ({ ...prev, clientDetails: client, clientName: client.name }));
      }
    } else {
       setQuote(prev => ({
        ...prev,
        id: generateNewQuoteId(),
        date: new Date().toISOString().split('T')[0],
        salesperson: appSettings.defaultSalesperson,
        validityDays: appSettings.defaultValidityDays,
        paymentTerms: appSettings.paymentTermSuggestions[0] || '',
        status: QuoteStatus.DRAFT,
        items: [],
        version: 1,
        originalQuoteId: undefined,
        clientId: '',
        clientName: '',
        clientDetails: undefined,
        subTotal: 0,
        discount: 0,
        totalAmount: 0,
        installments: 1,
        installmentAmount: 0,
        notes: '',
      }));
    }
  }, [initialQuote, clients, appSettings]); 
  
  useEffect(() => {
    setFilteredClientsForModal(clients);
  }, [clients, showClientModal]); // Re-filter when clients list changes or modal opens

  useEffect(() => {
    setFilteredProductsForModal(products);
  }, [products]);


  const calculateTotals = useCallback((items: QuoteItem[], currentInstallments: number): { subTotal: number; totalAmount: number; installmentAmount: number } => {
    const subTotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
    const totalAmount = subTotal; // Placeholder for discount logic
    const installmentAmount = currentInstallments > 0 ? totalAmount / currentInstallments : 0;
    return { subTotal, totalAmount, installmentAmount };
  }, []);

  useEffect(() => {
    const { subTotal, totalAmount, installmentAmount } = calculateTotals(quote.items, quote.installments);
    setQuote(prev => ({ ...prev, subTotal, totalAmount, installmentAmount }));
  }, [quote.items, quote.installments, calculateTotals]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    
    let processedValue: string | number = value;
    if (type === 'number' || name === 'installments' || name === 'validityDays') {
      processedValue = parseFloat(value) || 0;
      if (name === 'installments') processedValue = Math.max(1, processedValue); 
      if (name === 'validityDays') processedValue = Math.max(0, processedValue); 
    }
    
    setQuote(prev => ({ ...prev, [name]: processedValue }));
  };
  
  const handleClientSelect = (client: Client) => {
    setQuote(prev => ({ ...prev, clientId: client.id, clientName: client.name, clientDetails: client }));
    setShowClientModal(false);
  };

  const handleAddItem = (product: Product) => {
    const newItem: QuoteItem = {
      id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      productId: product.id,
      name: product.name,
      description: product.description,
      quantity: 1,
      unitPrice: product.unitPrice,
      totalPrice: product.unitPrice,
    };
    setQuote(prev => ({ ...prev, items: [...prev.items, newItem] }));
    setShowProductModal(false);
  };

  const handleItemChange = (index: number, field: keyof QuoteItem, value: string | number) => {
    const newItems = [...quote.items];
    const item = { ...newItems[index] };
    
    if (field === 'quantity' || field === 'unitPrice') {
        const numValue = Number(value);
        (item[field] as number) = numValue >= 0 ? numValue : 0;
    } else {
        (item[field] as string) = String(value);
    }
  
    if (field === 'quantity' || field === 'unitPrice') {
      item.totalPrice = item.quantity * item.unitPrice;
    }
    
    newItems[index] = item;
    setQuote(prev => ({ ...prev, items: newItems }));
  };

  const handleRemoveItem = (index: number) => {
    setQuote(prev => ({ ...prev, items: prev.items.filter((_, i) => i !== index) }));
  };

  const handleSave = (asNewVersion: boolean = false) => {
    let quoteToSave = { ...quote };
    if (isEditing && asNewVersion) {
      quoteToSave.originalQuoteId = initialQuote?.originalQuoteId || initialQuote?.id.split('-v')[0];
      quoteToSave.version = (initialQuote?.version || 0) + 1; 
      quoteToSave.id = generateNewQuoteId(quoteToSave.version);
    } else if (!isEditing) {
      quoteToSave.id = generateNewQuoteId(1);
      quoteToSave.version = 1;
      quoteToSave.originalQuoteId = undefined; 
    }
    onSave(quoteToSave);
  };
  
  const clientOptionsForSelect = useMemo(() => clients.map(c => ({ value: c.id, label: c.name })), [clients]);
  const paymentTermOptions = useMemo(() => appSettings.paymentTermSuggestions.map(p => ({ value: p, label: p})), [appSettings.paymentTermSuggestions]);

  const handleNewClientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setNewClientData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveNewClient = () => {
    if (!newClientData.name?.trim()) {
      setNewClientError("Nome do cliente é obrigatório.");
      return;
    }
    setNewClientError(null);
    const newClient: Client = {
      id: `client-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
      name: newClientData.name.trim(),
      address: newClientData.address?.trim() || '',
      contact: newClientData.contact?.trim() || '',
      cnpj: newClientData.cnpj?.trim() || '',
    };
    onAddClient(newClient); 
    handleClientSelect(newClient); // Automatically select the new client
    setShowAddClientModal(false);
    setShowClientModal(false); // Close the main client selection modal as well
  };


  return (
    <div className="p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-secondary-800 mb-6">{isEditing ? `Editar Orçamento #${quote.id}` : 'Novo Orçamento'}</h2>
      
      <form onSubmit={(e) => e.preventDefault()}>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          <Input label="Número do Orçamento" name="id" value={quote.id} readOnly />
          <Input label="Data" name="date" type="date" value={quote.date} onChange={handleInputChange} />
          <Input label="Vendedor" name="salesperson" value={quote.salesperson} onChange={handleInputChange} />
        </div>

        <div className="mb-6 p-4 border border-secondary-200 rounded-md">
            <h3 className="text-lg font-medium text-secondary-700 mb-2">Cliente</h3>
            {quote.clientDetails ? (
                <div>
                    <p><strong>{quote.clientDetails.name}</strong></p>
                    <p>{quote.clientDetails.address}</p>
                    <p>{quote.clientDetails.contact}</p>
                    <Button onClick={() => setShowClientModal(true)} variant="secondary" size="sm" className="mt-2">Alterar Cliente</Button>
                </div>
            ) : (
                 <Button onClick={() => setShowClientModal(true)} variant="primary">
                    Selecionar Cliente
                 </Button>
            )}
        </div>

        {/* Items Table */}
        <div className="mb-6">
          <h3 className="text-lg font-medium text-secondary-700 mb-2">Itens do Orçamento</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-secondary-200">
              <thead className="bg-secondary-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Produto</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Qtd</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Preço Unit.</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Total</th>
                  <th className="px-4 py-2 text-left text-xs font-medium text-secondary-600 uppercase tracking-wider">Ações</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-secondary-200">
                {quote.items.map((item, index) => (
                  <tr key={item.id}>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input 
                        value={item.name} 
                        onChange={(e) => handleItemChange(index, 'name', e.target.value)} 
                        className="w-full text-sm"
                        containerClassName="mb-0"
                      />
                      <textarea 
                        value={item.description} 
                        onChange={(e) => handleItemChange(index, 'description', e.target.value)} 
                        className="w-full text-xs text-secondary-600 mt-1 p-1 border border-secondary-300 rounded"
                        rows={1}
                      />
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input type="number" value={item.quantity} onChange={(e) => handleItemChange(index, 'quantity', e.target.value)} className="w-20 text-sm" containerClassName="mb-0"/>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Input type="number" value={item.unitPrice} onChange={(e) => handleItemChange(index, 'unitPrice', e.target.value)} className="w-28 text-sm" containerClassName="mb-0"/>
                    </td>
                    <td className="px-4 py-2 whitespace-nowrap text-sm text-secondary-800">R$ {item.totalPrice.toFixed(2)}</td>
                    <td className="px-4 py-2 whitespace-nowrap">
                      <Button onClick={() => handleRemoveItem(index)} variant="danger" size="sm">Remover</Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <Button onClick={() => setShowProductModal(true)} variant="secondary" className="mt-4" disabled={products.length === 0 && !document.getElementById('allow-custom-item')}>
            {products.length > 0 ? 'Adicionar Item da Lista' : 'Nenhum produto cadastrado'}
          </Button>
        </div>

        {/* Totals & Payment */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <Select 
              label="Condições de Pagamento"
              name="paymentTerms"
              value={quote.paymentTerms}
              onChange={handleInputChange}
              options={paymentTermOptions}
              disabled={paymentTermOptions.length === 0}
              placeholder={paymentTermOptions.length === 0 ? "Nenhuma condição cadastrada" : "Selecione"}
            />
            <Input label="Número de Parcelas" name="installments" type="number" value={quote.installments} min="1" onChange={handleInputChange}/>
            <div className="mt-2 text-sm">
                Valor da Parcela: <span className="font-semibold text-secondary-800">R$ {quote.installmentAmount.toFixed(2)}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-secondary-600">Subtotal: R$ {quote.subTotal.toFixed(2)}</p>
            <p className="text-xl font-bold text-primary-700 mt-1">TOTAL: R$ {quote.totalAmount.toFixed(2)}</p>
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
           <Select
              label="Status do Orçamento"
              name="status"
              value={quote.status}
              onChange={handleInputChange}
              options={QUOTE_STATUS_OPTIONS.map(status => ({ value: status, label: status }))}
            />
            <Input label="Validade (dias)" name="validityDays" type="number" value={quote.validityDays || 0} onChange={handleInputChange} min="0"/>
        </div>

        <div className="mb-6">
          <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">Observações</label>
          <textarea
            id="notes"
            name="notes"
            value={quote.notes}
            onChange={handleInputChange}
            rows={3}
            className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          ></textarea>
        </div>
        
        <div className="flex justify-end space-x-3 mt-8">
          <Button onClick={onCancel} variant="secondary">Cancelar</Button>
          {isEditing && (
            <Button onClick={() => handleSave(true)} variant="primary" className="bg-blue-500 hover:bg-blue-600">Salvar como Nova Versão</Button>
          )}
          <Button onClick={() => handleSave(false)} variant={isEditing ? 'success' : 'primary'}>
            {isEditing ? 'Salvar Alterações' : 'Criar Orçamento'}
          </Button>
        </div>
      </form>

      {/* Client Selection Modal */}
      <Modal isOpen={showClientModal} onClose={() => setShowClientModal(false)} title="Selecionar Cliente" size="lg">
        <div className="flex justify-between items-center mb-4">
            <SearchBar<Client>
            items={clients}
            searchKeys={['name', 'cnpj', 'contact']}
            onSearch={setFilteredClientsForModal}
            placeholder="Buscar cliente..."
            label="Buscar Cliente"
            />
            <Button 
                onClick={() => { setShowAddClientModal(true); setNewClientData({}); setNewClientError(null);}} 
                variant="success" 
                size="sm" 
                className="ml-4 shrink-0"
                leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" /></svg>}
            >
                Novo Cliente
            </Button>
        </div>
        <ul className="mt-4 max-h-96 overflow-y-auto">
          {filteredClientsForModal.map(client => (
            <li key={client.id} 
                className="p-3 hover:bg-secondary-100 cursor-pointer rounded-md"
                onClick={() => handleClientSelect(client)}>
              <p className="font-medium text-secondary-800">{client.name}</p>
              <p className="text-sm text-secondary-600">{client.contact} {client.cnpj && `- ${client.cnpj}`}</p>
            </li>
          ))}
          {filteredClientsForModal.length === 0 && <p className="text-secondary-500">Nenhum cliente encontrado.</p>}
        </ul>
      </Modal>

      {/* Add New Client Modal (nested for QuoteForm context) */}
      <Modal isOpen={showAddClientModal} onClose={() => setShowAddClientModal(false)} title="Adicionar Novo Cliente" size="md">
        {newClientError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3">{newClientError}</p>}
        <Input label="Nome do Cliente" name="name" value={newClientData.name || ''} onChange={handleNewClientChange} required placeholder="Ex: Condomínio Edifício Telles" />
        <Input label="Endereço" name="address" value={newClientData.address || ''} onChange={handleNewClientChange} placeholder="Ex: Rua das Palmeiras, 123" />
        <Input label="Contato (Telefone/Email)" name="contact" value={newClientData.contact || ''} onChange={handleNewClientChange} placeholder="Ex: Sr. Telles (11) 99999-0000" />
        <Input label="CNPJ/CPF (Opcional)" name="cnpj" value={newClientData.cnpj || ''} onChange={handleNewClientChange} />
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={() => setShowAddClientModal(false)}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveNewClient}>Salvar Novo Cliente</Button>
        </div>
      </Modal>


      {/* Product Selection Modal */}
      <Modal isOpen={showProductModal} onClose={() => setShowProductModal(false)} title="Adicionar Item ao Orçamento" size="lg">
        <SearchBar<Product>
          items={products}
          searchKeys={['name', 'description']}
          onSearch={setFilteredProductsForModal}
          placeholder="Buscar produto/serviço..."
          label="Buscar Produto/Serviço"
        />
        <ul className="mt-4 max-h-96 overflow-y-auto">
          {filteredProductsForModal.map(product => (
            <li key={product.id} 
                className="p-3 hover:bg-secondary-100 cursor-pointer rounded-md"
                onClick={() => handleAddItem(product)}>
              <div className="flex justify-between">
                <div>
                    <p className="font-medium text-secondary-800">{product.name}</p>
                    <p className="text-sm text-secondary-600">{product.description}</p>
                </div>
                <p className="text-sm font-semibold text-primary-600">R$ {product.unitPrice.toFixed(2)}</p>
              </div>
            </li>
          ))}
          {filteredProductsForModal.length === 0 && <p className="text-secondary-500">Nenhum produto/serviço encontrado.</p>}
        </ul>
      </Modal>

    </div>
  );
};

export default QuoteForm;