import React, { useState } from 'react';
import { CompanyInfo, Client, Product, AppSettings, User } from '../types';
import CompanySettingsForm from './settings/CompanySettingsForm';
import ClientManagement from './settings/ClientManagement';
import ProductManagement from './settings/ProductManagement';
import DefaultValuesSettingsForm from './settings/DefaultValuesSettingsForm';
import UserManagement from './settings/UserManagement'; // Import UserManagement
import Button from './common/Button';

interface SettingsViewProps {
  companyInfo: CompanyInfo;
  onSaveCompanyInfo: (info: CompanyInfo) => void;
  clients: Client[];
  onUpdateClients: (clients: Client[]) => void;
  products: Product[];
  onUpdateProducts: (products: Product[]) => void;
  appSettings: AppSettings;
  onSaveAppSettings: (settings: AppSettings) => void;
  users: User[]; // Add users
  onUpdateUsers: (users: User[]) => void; // Add handler for user updates
}

type SettingsTab = "company" | "clients" | "products" | "defaults" | "users";

const SettingsView: React.FC<SettingsViewProps> = ({
  companyInfo,
  onSaveCompanyInfo,
  clients,
  onUpdateClients,
  products,
  onUpdateProducts,
  appSettings,
  onSaveAppSettings,
  users, // Destructure users
  onUpdateUsers, // Destructure onUpdateUsers
}) => {
  const [activeTab, setActiveTab] = useState<SettingsTab>("company");

  const renderTabContent = () => {
    switch (activeTab) {
      case "company":
        return <CompanySettingsForm initialCompanyInfo={companyInfo} onSave={onSaveCompanyInfo} />;
      case "clients":
        return <ClientManagement initialClients={clients} onUpdateClients={onUpdateClients} />;
      case "products":
        return <ProductManagement initialProducts={products} onUpdateProducts={onUpdateProducts} />;
      case "defaults":
        return <DefaultValuesSettingsForm initialSettings={appSettings} onSave={onSaveAppSettings} />;
      case "users": // Add case for users
        return <UserManagement initialUsers={users} onUpdateUsers={onUpdateUsers} />;
      default:
        return null;
    }
  };

  const tabs: { id: SettingsTab; label: string; icon?: React.ReactNode }[] = [
    { id: "company", label: "Empresa", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M3.75 21h16.5M4.5 3h15M5.25 3v18m13.5-18v18M9 6.75h6m-6 3.75h6m-6 3.75h6m-6 3.75h6M4.5 21v-3.375c0-.621.504-1.125 1.125-1.125h12.75c.621 0 1.125.504 1.125 1.125V21" /></svg> },
    { id: "clients", label: "Clientes", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372m-10.75 L4.875 19.5m0 0A2.25 2.25 0 0112 17.25v-4.5m0 4.5A2.25 2.25 0 0012 17.25v-4.5m0 4.5L14.25 17.25M12 12.75v-4.5m0 4.5A2.25 2.25 0 0012 12.75v-4.5m0 0A2.25 2.25 0 0112 8.25m0 0v-4.5m0 4.5H9m3 0h3m-3 0A2.25 2.25 0 006 8.25m0 0v-4.5m0 4.5H3M3.75 6H20.25v13.5A2.25 2.25 0 0118 21.75H6A2.25 2.25 0 013.75 19.5V6z" /></svg> },
    { id: "products", label: "Produtos/Serviços", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M20.25 7.5l-.625 10.632a2.25 2.25 0 01-2.247 2.118H6.622a2.25 2.25 0 01-2.247-2.118L3.75 7.5M10.5 8.25h3M12 3v5.25m0 0l-1.14.995a1.125 1.125 0 01-1.71 0L3 8.25m9 0L21 8.25" /></svg> },
    { id: "defaults", label: "Valores Padrão", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M9.594 3.94c.09-.542.56-.94 1.11-.94h2.593c.55 0 1.02.398 1.11.94l.213.952c.07.319.303.578.618.733.314.155.67.136.97-.049l.802-.497a1.125 1.125 0 011.33.208l1.454 1.454a1.125 1.125 0 01.208 1.33l-.497.802c-.184.3-.204.656-.049.97.155.314.414.547.733.618l.952.213c.542.09.94.56.94 1.11v2.593c0 .55-.398 1.02-.94 1.11l-.952.213c-.319.07-.578.303-.733.618-.155.314-.136.67.049.97l.497.802c.292.463.226 1.056-.208 1.33l-1.454 1.454a1.125 1.125 0 01-1.33.208l-.802-.497c-.3-.184-.656-.204-.97-.049-.314.155-.547.414-.618.733l-.213.952c-.09.542-.56.94-1.11-.94h-2.593c-.55 0-1.02-.398-1.11-.94l-.213-.952c-.07-.319-.303.578-.618.733-.314-.155-.67-.136-.97.049l-.802-.497a1.125 1.125 0 01-1.33-.208l-1.454-1.454a1.125 1.125 0 01-.208-1.33l.497-.802c.184-.3.204.656-.049-.97-.155-.314-.414-.547-.733-.618L3.94 13.75c-.542-.09-.94-.56-.94-1.11V10.05c0-.55.398-1.02.94-1.11l.952-.213c.319-.07.578.303.733-.618.155-.314.136-.67-.049-.97l-.497-.802a1.125 1.125 0 01.208-1.33l1.454-1.454a1.125 1.125 0 011.33-.208l.802.497c.3.184.656.204.97.049.314-.155.547.414-.618.733L9.594 3.94zM15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
    { id: "users", label: "Gerenciar Usuários", icon: <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5 mr-2"><path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0z" /></svg> },
  ];


  return (
    <div className="p-0 md:p-6 bg-white shadow-lg rounded-lg">
      <h2 className="text-2xl font-semibold text-secondary-800 mb-6 px-6 md:px-0 pt-6 md:pt-0">Configurações</h2>

      <div className="flex flex-col md:flex-row">
        {/* Tab Navigation for smaller screens - as a select dropdown */}
        <div className="md:hidden mb-4 px-6 md:px-0">
          <select
            value={activeTab}
            onChange={(e) => setActiveTab(e.target.value as SettingsTab)}
            className="w-full p-2 border border-secondary-300 rounded-md bg-white"
          >
            {tabs.map(tab => (
              <option key={tab.id} value={tab.id}>{tab.label}</option>
            ))}
          </select>
        </div>

        {/* Tab Navigation for larger screens */}
        <nav className="hidden md:flex flex-col w-1/4 pr-6 space-y-1">
          {tabs.map(tab => (
            <Button
              key={tab.id}
              variant={activeTab === tab.id ? 'primary' : 'ghost'}
              onClick={() => setActiveTab(tab.id)}
              className={`w-full justify-start text-left ${activeTab === tab.id ? 'bg-primary-600 text-white' : 'text-secondary-700 hover:bg-primary-50 hover:text-primary-600'}`}
              leftIcon={tab.icon}
            >
              {tab.label}
            </Button>
          ))}
        </nav>

        {/* Tab Content */}
        <div className="flex-1 px-6 md:px-0 md:pl-6 border-t md:border-t-0 md:border-l border-secondary-200 pt-6 md:pt-0">
          {renderTabContent()}
        </div>
      </div>
    </div>
  );
};

export default SettingsView;