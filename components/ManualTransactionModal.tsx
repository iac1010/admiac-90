import React, { useState, useEffect } from 'react';
import { ManualTransaction } from '../types';
import Modal from './common/Modal';
import Input from './common/Input';
import Button from './common/Button';

interface ManualTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (transaction: ManualTransaction) => void;
  initialTransaction?: ManualTransaction | null;
  transactionType: 'income' | 'expense';
}

const ManualTransactionModal: React.FC<ManualTransactionModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialTransaction,
  transactionType,
}) => {
  const [description, setDescription] = useState('');
  const [amount, setAmount] = useState<number | string>(''); // Use string for input flexibility
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [category, setCategory] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState('');

  useEffect(() => {
    if (initialTransaction) {
      setDescription(initialTransaction.description);
      setAmount(initialTransaction.amount);
      setDate(initialTransaction.date);
      setCategory(initialTransaction.category || '');
      setNotes(initialTransaction.notes || '');
    } else {
      // Reset form for new transaction
      setDescription('');
      setAmount('');
      setDate(new Date().toISOString().split('T')[0]);
      setCategory('');
      setNotes('');
    }
    setError(''); // Clear error on open or when initialTransaction changes
  }, [initialTransaction, isOpen]);

  const handleSubmit = () => {
    const numericAmount = parseFloat(String(amount));
    if (!description.trim()) {
      setError('A descrição é obrigatória.');
      return;
    }
    if (isNaN(numericAmount) || numericAmount <= 0) {
      setError('O valor deve ser um número positivo.');
      return;
    }
    if (!date) {
        setError('A data é obrigatória.');
        return;
    }

    onSave({
      id: initialTransaction?.id || `manual-${Date.now()}`,
      type: transactionType,
      description: description.trim(),
      amount: numericAmount,
      date,
      category: category.trim() || undefined,
      notes: notes.trim() || undefined,
    });
  };

  const modalTitle = initialTransaction 
    ? `Editar Lançamento de ${transactionType === 'income' ? 'Receita' : 'Despesa'}`
    : `Novo Lançamento de ${transactionType === 'income' ? 'Receita' : 'Despesa'}`;

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={modalTitle} size="md">
      <div className="space-y-4">
        {error && <p className="text-sm text-red-600 bg-red-50 p-3 rounded-md">{error}</p>}
        <Input
          label="Descrição"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder={transactionType === 'income' ? 'Ex: Venda de serviço avulso' : 'Ex: Compra de material'}
          required
        />
        <Input
          label="Valor (R$)"
          type="number"
          value={String(amount)} // Keep as string for input control, convert on save
          onChange={(e) => setAmount(e.target.value)}
          placeholder="0.00"
          step="0.01"
          required
        />
        <Input
          label="Data"
          type="date"
          value={date}
          onChange={(e) => setDate(e.target.value)}
          required
        />
        <Input
          label="Categoria (Opcional)"
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          placeholder={transactionType === 'income' ? 'Ex: Serviços Extras' : 'Ex: Fornecedores'}
        />
        <div>
          <label htmlFor="notes" className="block text-sm font-medium text-secondary-700 mb-1">
            Observações (Opcional)
          </label>
          <textarea
            id="notes"
            name="notes"
            rows={3}
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
            placeholder="Detalhes adicionais sobre o lançamento..."
          />
        </div>
      </div>
      <div className="mt-6 flex justify-end space-x-3">
        <Button variant="secondary" onClick={onClose}>
          Cancelar
        </Button>
        <Button 
            variant={transactionType === 'income' ? 'success' : 'danger'} 
            onClick={handleSubmit}
        >
          {initialTransaction ? 'Salvar Alterações' : 'Adicionar Lançamento'}
        </Button>
      </div>
    </Modal>
  );
};

export default ManualTransactionModal;