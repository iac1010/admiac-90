
import React, { useState, useEffect } from 'react';
import { User, UserRole } from '../../types';
import Button from '../common/Button';
import Input from '../common/Input';
import Modal from '../common/Modal';
import Select from '../common/Select'; // Added Select import
import SearchBar from '../common/SearchBar';

interface UserManagementProps {
  initialUsers: User[];
  onUpdateUsers: (users: User[]) => void;
}

const UserManagement: React.FC<UserManagementProps> = ({ initialUsers, onUpdateUsers }) => {
  const [usersState, setUsersState] = useState<User[]>(initialUsers);
  const [filteredUsers, setFilteredUsers] = useState<User[]>(initialUsers);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [currentUserData, setCurrentUserData] = useState<Partial<User>>({});
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    setUsersState(initialUsers);
    setFilteredUsers(initialUsers);
  }, [initialUsers]);

  const handleSearch = (results: User[]) => {
    setFilteredUsers(results);
  };

  const openModalForNew = () => {
    setEditingUser(null);
    setCurrentUserData({ id: `user-${Date.now()}`, role: UserRole.USUARIO, password: '' }); // Default role
    setFormError(null);
    setIsModalOpen(true);
  };

  const openModalForEdit = (user: User) => {
    setEditingUser(user);
    setCurrentUserData({ ...user });
    setFormError(null);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setEditingUser(null);
    setCurrentUserData({});
    setFormError(null);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCurrentUserData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveUser = () => {
    if (!currentUserData.username?.trim()) {
      setFormError("Nome de usuário é obrigatório.");
      return;
    }
    if (!currentUserData.name?.trim()) {
      setFormError("Nome completo é obrigatório.");
      return;
    }
    if (!currentUserData.role) {
      setFormError("Perfil de acesso é obrigatório.");
      return;
    }
    if (!editingUser && !currentUserData.password?.trim()) { // Require password for new users
        setFormError("Senha é obrigatória para novos usuários.");
        return;
    }
    // For existing users, password can be empty if not changing it
    if (editingUser && currentUserData.password === '') {
        // If password field is empty for an existing user, keep their old password.
        // This requires fetching the old password, or just not updating it if the field is empty.
        // For simplicity, if empty, it means "don't change". If user wants to clear, they must enter something like " " then admin fixes.
        // Or, assume admin MUST provide a password if they touch the field.
        // Let's assume an empty password field during edit means "do not change password".
        // The actual logic for this depends on how we want to handle password updates.
        // For now, if currentUserData.password is empty string for an edit, we might remove it or use the original.
        // For now, if password is empty on edit, let's keep the existing one.
        // This is tricky without a dedicated "change password" flow.
        // Simplest for now: if password field is modified (even to empty), it gets updated.
        // This means admin can set an empty password, which is bad.
        // Better: if editing, and password field is empty, do NOT update password.
        // If password has a value, update it.
    }


    setFormError(null);

    let updatedUsersList;
    const userToSave: User = {
        id: currentUserData.id || `user-${Date.now()}`,
        username: currentUserData.username.trim(),
        name: currentUserData.name.trim(),
        role: currentUserData.role,
        password: currentUserData.password // Store password as is for this example
    };

    if (editingUser) {
        // If password field was left blank during edit, retain old password
        if (currentUserData.password === undefined || currentUserData.password.trim() === '') {
            userToSave.password = editingUser.password;
        }
      updatedUsersList = usersState.map(u => u.id === editingUser.id ? userToSave : u);
    } else {
      updatedUsersList = [...usersState, userToSave];
    }
    setUsersState(updatedUsersList);
    onUpdateUsers(updatedUsersList);
    closeModal();
  };

  const handleDeleteUser = (userId: string) => {
    const userToDelete = usersState.find(u => u.id === userId);
    if (!userToDelete) return;

    if (userToDelete.role === UserRole.ADMINISTRADOR) {
      const adminCount = usersState.filter(u => u.role === UserRole.ADMINISTRADOR).length;
      if (adminCount <= 1) {
        alert("Não é possível excluir o único administrador do sistema.");
        return;
      }
    }

    if (window.confirm(`Tem certeza que deseja excluir o usuário ${userToDelete.username}?`)) {
      const updatedUsersList = usersState.filter(u => u.id !== userId);
      setUsersState(updatedUsersList);
      onUpdateUsers(updatedUsersList);
    }
  };

  const roleOptions = Object.values(UserRole).map(role => ({ value: role, label: role }));

  return (
    <div className="space-y-6">
      <h3 className="text-xl font-semibold text-secondary-700">Gerenciar Usuários e Permissões</h3>
      <div className="flex justify-between items-center">
        <div className="w-full md:w-1/2">
            <SearchBar<User>
            items={usersState}
            searchKeys={['name', 'username']}
            onSearch={setFilteredUsers}
            placeholder="Buscar usuário..."
            label="Buscar Usuários"
            />
        </div>
        <Button onClick={openModalForNew} variant="primary">
          Adicionar Novo Usuário
        </Button>
      </div>

      <div className="overflow-x-auto bg-white rounded-md shadow">
        <table className="min-w-full divide-y divide-secondary-200">
          <thead className="bg-secondary-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Nome Completo</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Usuário</th>
              <th className="px-6 py-3 text-left text-xs font-medium text-secondary-600 uppercase">Perfil</th>
              <th className="px-6 py-3 text-center text-xs font-medium text-secondary-600 uppercase">Ações</th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-secondary-200">
            {filteredUsers.length > 0 ? filteredUsers.map(user => (
              <tr key={user.id} className="hover:bg-secondary-50">
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-secondary-900">{user.name}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{user.username}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-secondary-600">{user.role}</td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-center space-x-2">
                  <Button variant="ghost" size="sm" onClick={() => openModalForEdit(user)} title="Editar">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M16.862 4.487l1.687-1.688a1.875 1.875 0 112.652 2.652L10.582 16.07a4.5 4.5 0 01-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 011.13-1.897l8.932-8.931z" /></svg>
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => handleDeleteUser(user.id)} className="text-red-500 hover:text-red-700" title="Excluir">
                     <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-4 h-4"><path strokeLinecap="round" strokeLinejoin="round" d="M14.74 9l-.346 9m-4.788 0L9.26 9m9.968-3.21c.342.052.682.107 1.022.166m-1.022-.165L18.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0a48.108 48.108 0 00-3.478-.397m-12.56 0c1.153 0 2.242.078 3.223.22C6.538 6.088 6.758 6.168 7 6.248m10.168-1.743c-.221.056-.441.111-.661.166M17.16 19.673a2.25 2.25 0 01-2.244 2.077H8.084a2.25 2.25 0 01-2.244-2.077L4.772 5.79m14.456 0H4.772" /></svg>
                  </Button>
                </td>
              </tr>
            )) : (
                <tr>
                    <td colSpan={4} className="px-6 py-4 text-center text-sm text-secondary-500">Nenhum usuário encontrado.</td>
                </tr>
            )}
          </tbody>
        </table>
      </div>

      <Modal isOpen={isModalOpen} onClose={closeModal} title={editingUser ? "Editar Usuário" : "Adicionar Novo Usuário"}>
        <div className="space-y-4">
          {formError && <p className="text-sm text-red-600 bg-red-50 p-2 rounded-md mb-3">{formError}</p>}
          <Input label="ID (automático)" name="id" value={currentUserData.id || ''} readOnly disabled containerClassName="mb-0"/>
          <Input label="Nome Completo" name="name" value={currentUserData.name || ''} onChange={handleChange} required placeholder="Ex: João Silva"/>
          <Input label="Nome de Usuário (Login)" name="username" value={currentUserData.username || ''} onChange={handleChange} required placeholder="Ex: joao.silva"/>
          <Input 
            label="Senha" 
            name="password" 
            type="password" 
            value={currentUserData.password || ''} 
            onChange={handleChange} 
            placeholder={editingUser ? "Deixe em branco para não alterar" : "Senha"}
            required={!editingUser} 
          />
          <Select
            label="Perfil de Acesso"
            name="role"
            value={currentUserData.role || ''}
            onChange={handleChange}
            options={roleOptions}
            required
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveUser}>{editingUser ? "Salvar Alterações" : "Adicionar Usuário"}</Button>
        </div>
      </Modal>
    </div>
  );
};

export default UserManagement;