
import React, { useState, useEffect, useRef } from 'react';
import { Product } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import SearchBar from '../common/SearchBar';

// Declare XLSX for SheetJS, assuming it's loaded globally via CDN
declare var XLSX: any;

interface ProductManagementProps {
  initialProducts: Product[];
  onUpdateProducts: (products: Product[]) => void;
}

const ProductManagement: React.FC<ProductManagementProps> = ({ initialProducts, onUpdateProducts }) => {
  const [products, setProductsState] = useState<Product[]>(initialProducts);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>(initialProducts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [currentProduct, setCurrentProduct] = useState<Partial<Product>>({});
  const [isSaved, setIsSaved] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setProductsState(initialProducts);
    setFilteredProducts(initialProducts);
  }, [initialProducts]);

  const handleSearch = (results: Product[]) => {
    setFilteredProducts(results);
  };

  const openModalForNew = () => {
    setEditingProduct(null);
    setCurrentProduct({ id: `prod-${Date.now()}`, unitPrice: 0, costPrice: 0 });
    setIsModalOpen(true);
  };

  const openModalForEdit = (product: Product) => {
    setEditingProduct(product);
    setCurrentProduct({ ...product });
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    setCurrentProduct({});
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setCurrentProduct(prev => ({ 
      ...prev, 
      [name]: type === 'number' ? parseFloat(value) || 0 : value 
    }));
  };

  const handleSaveProduct = () => {
    if (!currentProduct.name || !currentProduct.id || currentProduct.unitPrice === undefined) {
      alert("Nome e Preço Unitário do produto são obrigatórios.");
      return;
    }
    // Ensure costPrice is a number, defaulting to 0 if not set or invalid
    const costPrice = Number.isFinite(currentProduct.costPrice) ? currentProduct.costPrice : 0;

    let updatedProductsList;
    const productToSave: Product = {
        ...(currentProduct as Product), // Cast currentProduct, assuming required fields are present by validation
        costPrice: costPrice,
    };


    if (editingProduct) {
      updatedProductsList = products.map(p => p.id === editingProduct.id ? productToSave : p);
    } else {
      updatedProductsList = [...products, productToSave];
    }
    setProductsState(updatedProductsList);
    onUpdateProducts(updatedProductsList);
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 3000);
    closeModal();
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm("Tem certeza que deseja excluir este produto/serviço?")) {
      const updatedProductsList = products.filter(p => p.id !== productId);
      setProductsState(updatedProductsList);
      onUpdateProducts(updatedProductsList);
    }
  };

  const handleImportExcel = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const data = e.target?.result;
        const workbook = XLSX.read(data, { type: 'array' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData: any[] = XLSX.utils.sheet_to_json(worksheet);

        let importedCount = 0;
        let skippedCount = 0;
        const newProducts: Product[] = [...products]; 

        jsonData.forEach((row, index) => {
          const name = row['Nome'] || row['nome'];
          const priceString = row['Preco'] || row['Preço'] || row['preco'] || row['preço'] || row['Valor de Venda'] || row['valor de venda'];
          const costString = row['Custo'] || row['custo'] || row['Valor de Compra'] || row['valor de compra'];
          const description = row['Descricao'] || row['Descrição'] || row['descricao'] || row['descrição'] || 'Importado via Excel';
          
          if (!name || typeof name !== 'string' || !name.trim()) {
            console.warn(`Linha ${index + 2}: Nome do produto ausente ou inválido. Pulando.`);
            skippedCount++;
            return;
          }

          const unitPrice = parseFloat(String(priceString).replace(',', '.'));
          let costPrice: number | undefined = undefined;
          if (costString !== undefined && costString !== null && String(costString).trim() !== '') {
            costPrice = parseFloat(String(costString).replace(',', '.'));
            if (isNaN(costPrice) || costPrice < 0) {
                 console.warn(`Linha ${index + 2} (${name}): Custo inválido ('${costString}'). Será definido como 0 ou indefinido.`);
                 costPrice = 0; // Or undefined, depending on preference
            }
          }


          if (isNaN(unitPrice) || unitPrice < 0) {
            console.warn(`Linha ${index + 2} (${name}): Preço unitário ausente ou inválido ('${priceString}'). Pulando.`);
            skippedCount++;
            return;
          }
          
          const existingProductIndex = newProducts.findIndex(p => p.name.toLowerCase() === name.trim().toLowerCase());

          if (existingProductIndex !== -1) {
            newProducts[existingProductIndex] = {
              ...newProducts[existingProductIndex],
              unitPrice,
              costPrice: costPrice !== undefined ? costPrice : newProducts[existingProductIndex].costPrice, // Keep old cost if new one is not provided
              description: description || newProducts[existingProductIndex].description,
            };
          } else {
             newProducts.push({
                id: `prod-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`,
                name: name.trim(),
                description: description.trim(),
                unitPrice,
                costPrice: costPrice !== undefined ? costPrice : 0, // Default cost to 0 if not provided for new product
             });
          }
          importedCount++;
        });

        if (importedCount > 0) {
          setProductsState(newProducts);
          onUpdateProducts(newProducts);
          setIsSaved(true);
           setTimeout(() => setIsSaved(false), 3000);
        }
        alert(
          `Importação Concluída!\n${importedCount} produtos importados/atualizados.\n${skippedCount} linhas puladas devido a dados ausentes/inválidos (ver console para detalhes).`
        );

      } catch (error) {
        console.error("Erro ao importar arquivo Excel:", error);
        alert("Ocorreu um erro ao importar o arquivo. Verifique se o formato está correto (Nome, Preco/Preço, Custo, Descricao/Descrição) e tente novamente.");
      }
    };
    reader.readAsArrayBuffer(file);
    event.target.value = ''; 
  };


  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-secondary-700">Gerenciar Produtos/Serviços</h3>
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center space-y-3 md:space-y-0">
        <div className="w-full md:w-1/2">
            <SearchBar<Product>
            items={products}
            searchKeys={['name', 'description']}
            onSearch={handleSearch}
            placeholder="Buscar produto/serviço..."
            label="Buscar Produtos/Serviços"
            />
        </div>
        <div className="flex space-x-3 w-full md:w-auto">
            <input 
                type="file" 
                ref={fileInputRef} 
                className="hidden" 
                accept=".xlsx, .xls"
                onChange={handleFileChange}
            />
            <Button onClick={handleImportExcel} variant="secondary" className="w-full md:w-auto"
                leftIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M12 16.5V9.75m0 0l3 3m-3-3l-3 3M6.75 19.5a4.5 4.5 0 01-1.41-8.775 5.25 5.25 0 0110.338 0 4.5 4.5 0 01-1.41 8.775H6.75z" /></svg>}
            >
            Importar de Excel
            </Button>
            <Button onClick={openModalForNew} variant="primary" className="w-full md:w-auto">
            Adicionar Novo
            </Button>
        </div>
      </div>
       <p className="text-xs text-secondary-500">
        Para importar: o arquivo Excel deve conter as colunas "Nome", "Preco" (ou "Preço", "Valor de Venda"), opcionalmente "Custo" (ou "Valor de Compra") e "Descricao" (ou "Descrição").
      </p>

      {isSaved && <p className="text-sm text-green-600 mb-4">Lista de produtos/serviços atualizada!</p>}

      <div className="overflow-x-auto bg-white rounded-md shadow">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Nome</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Descrição</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Preço Custo (R$)</th>
              <th className="px-6 py-3 text-right text-xs font-medium text-secondary-600 uppercase">Preço Venda (R$)</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredProducts.length > 0 ? filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{product.name}</td>
                <td className="px-6 py-4 text-sm text-secondary-600 max-w-xs truncate" title={product.description}>{product.description}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 text-right">{(product.costPrice || 0).toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600 text-right">{product.unitPrice.toFixed(2)}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(product)} title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteProduct(product.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                  </Button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={5} className="px-6 py-4 text-center text-sm text-secondary-500">Nenhum produto/serviço encontrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingProduct ? "Editar Produto/Serviço" : "Adicionar Novo Produto/Serviço"}>
        <div className="space-y-4">
          <Input label="ID (automático)" name="id" value={currentProduct.id || ''} readOnly disabled containerClassName="mb-0"/>
          <Input label="Nome do Produto/Serviço" name="name" value={currentProduct.name || ''} onChange={handleChange} required placeholder="Ex: Câmera IP Dome"/>
          <div>
            <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">Descrição</label>
            <textarea
                id="description"
                name="description"
                value={currentProduct.description || ''}
                onChange={handleChange}
                rows={3}
                className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
                placeholder="Ex: Câmera de segurança IP, Full HD, infravermelho."
            />
          </div>
          <Input 
            label="Preço de Custo (R$)" 
            name="costPrice" 
            type="number" 
            step="0.01" 
            value={currentProduct.costPrice || 0} 
            onChange={handleChange} 
          />
          <Input 
            label="Preço de Venda (R$)" 
            name="unitPrice" 
            type="number" 
            step="0.01" 
            value={currentProduct.unitPrice || 0} 
            onChange={handleChange} 
            required 
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveProduct}>{editingProduct ? "Salvar Alterações" : "Adicionar"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default ProductManagement;