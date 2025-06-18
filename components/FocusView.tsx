
import React, { useState } from 'react';
import Button from './common/Button';
import Input from './common/Input';
import Modal from './common/Modal';
import { AUDIOBOOK_LIST, POINTS_PER_AUDIOBOOK, POINTS_PER_DAILY_TASK_COMPLETION } from '../constants';
import { Audiobook, DailyTask, DailyTaskStatus } from '../types';
import useLocalStorage from '../hooks/useLocalStorage';


interface FocusViewProps {
  userPoints: number;
  onAddPoints: (points: number) => void;
  dailyTasks: DailyTask[];
  onSaveDailyTask: (task: DailyTask) => void;
  onDeleteDailyTask: (taskId: string) => void;
}

const AudiobookItemDisplay: React.FC<{ audiobook: Audiobook; onClaimPoints: (points: number) => void }> = ({ audiobook, onClaimPoints }) => {
  const handleClaim = () => {
    window.open(audiobook.url, '_blank', 'noopener,noreferrer');
    onClaimPoints(POINTS_PER_AUDIOBOOK);
  };

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-secondary-200 hover:shadow-md transition-shadow">
      <h5 className="font-semibold text-primary-700 text-sm">{audiobook.title}</h5>
      <p className="text-xs text-secondary-600 mb-2">Autor: {audiobook.author}</p>
      <Button
        onClick={handleClaim}
        variant="secondary"
        size="sm"
        className="w-full text-xs"
        title={`Ouvir em ${audiobook.source} e ganhar ${POINTS_PER_AUDIOBOOK} pontos`}
        rightIcon={<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-3.5 h-3.5"><path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" /></svg>}
      >
        Ouvir & Resgatar {POINTS_PER_AUDIOBOOK} Pontos
      </Button>
    </div>
  );
};

const DailyTaskCard: React.FC<{ task: DailyTask; onEdit: () => void; onDelete: () => void; onDragStart: (e: React.DragEvent<HTMLDivElement>, taskId: string) => void }> = 
  ({ task, onEdit, onDelete, onDragStart }) => (
  <div 
    draggable 
    onDragStart={(e) => onDragStart(e, task.id)}
    className="bg-white p-3 rounded-md shadow-sm border border-secondary-200 cursor-grab active:cursor-grabbing hover:shadow-md"
  >
    <h5 className="font-medium text-secondary-800 text-sm mb-1">{task.title}</h5>
    {task.description && <p className="text-xs text-secondary-600 mb-2 whitespace-pre-wrap">{task.description}</p>}
    <div className="flex justify-end space-x-1 mt-1">
      <Button onClick={onEdit} variant="ghost" size="sm" className="p-1 text-xs">Editar</Button>
      <Button onClick={onDelete} variant="ghost" size="sm" className="p-1 text-xs text-red-500 hover:text-red-700">Excluir</Button>
    </div>
  </div>
);


const FocusView: React.FC<FocusViewProps> = ({ userPoints, onAddPoints, dailyTasks, onSaveDailyTask, onDeleteDailyTask }) => {
  const [isTaskModalOpen, setIsTaskModalOpen] = useState(false);
  const [editingTask, setEditingTask] = useState<DailyTask | null>(null);
  const [currentTaskData, setCurrentTaskData] = useState<Partial<DailyTask>>({});
  const [draggedTaskId, setDraggedTaskId] = useState<string | null>(null);

  const openTaskModalForNew = () => {
    setEditingTask(null);
    setCurrentTaskData({ id: `task-${Date.now()}`, title: '', description: '', status: 'pending' });
    setIsTaskModalOpen(true);
  };

  const openTaskModalForEdit = (task: DailyTask) => {
    setEditingTask(task);
    setCurrentTaskData({ ...task });
    setIsTaskModalOpen(true);
  };

  const closeTaskModal = () => {
    setIsTaskModalOpen(false);
    setEditingTask(null);
    setCurrentTaskData({});
  };

  const handleTaskChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCurrentTaskData(prev => ({ ...prev, [name]: value }));
  };

  const handleSaveCurrentTask = () => {
    if (!currentTaskData.title?.trim()) {
      alert("O título da tarefa é obrigatório.");
      return;
    }
    const taskToSave: DailyTask = {
      id: currentTaskData.id || `task-${Date.now()}`,
      title: currentTaskData.title.trim(),
      description: currentTaskData.description?.trim() || '',
      status: currentTaskData.status || 'pending',
      pointsAwarded: editingTask?.pointsAwarded // Preserve existing awarded status
    };
    onSaveDailyTask(taskToSave);
    closeTaskModal();
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, taskId: string) => {
    setDraggedTaskId(taskId);
    e.dataTransfer.setData("taskId", taskId);
  };
  
  const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
     e.currentTarget.classList.add('bg-primary-100'); // Visual feedback
  };

  const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
    e.currentTarget.classList.remove('bg-primary-100');
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>, newStatus: DailyTaskStatus) => {
    e.preventDefault();
    e.currentTarget.classList.remove('bg-primary-100');
    const taskId = e.dataTransfer.getData("taskId");
    const taskToMove = dailyTasks.find(t => t.id === taskId);

    if (taskToMove && taskToMove.status !== newStatus) {
      const updatedTask = { ...taskToMove, status: newStatus };
      if (newStatus === 'done' && !updatedTask.pointsAwarded) {
        onAddPoints(POINTS_PER_DAILY_TASK_COMPLETION);
        updatedTask.pointsAwarded = true;
      }
      onSaveDailyTask(updatedTask);
    }
    setDraggedTaskId(null);
  };

  const taskColumns: { status: DailyTaskStatus; title: string }[] = [
    { status: 'pending', title: 'Pendente' },
    { status: 'doing', title: 'Realizando' },
    { status: 'done', title: 'Realizado' },
  ];


  return (
    <div className="p-0 md:p-4 lg:p-6 bg-gradient-to-br from-secondary-50 via-primary-50 to-secondary-100 min-h-full">
      <div className="max-w-7xl mx-auto space-y-6">
        <div className="bg-white p-6 rounded-xl shadow-xl text-center">
          <h2 className="text-3xl font-bold text-primary-700 mb-2 tracking-tight">Painel de Foco & Recompensas</h2>
          <p className="text-secondary-600 mb-4">Concentre-se, complete tarefas e ganhe recompensas!</p>
          <div className="bg-primary-600 text-white p-6 rounded-lg shadow-lg inline-block transform hover:scale-105 transition-transform">
            <p className="text-sm uppercase tracking-wider">Seus Pontos</p>
            <p className="text-5xl font-extrabold">{userPoints} ✨</p>
          </div>
        </div>

         <div className="bg-white p-6 rounded-xl shadow-xl">
          <h3 className="text-xl font-semibold text-secondary-800 mb-4 text-center border-b pb-2 border-secondary-200">Temporizador Pomodoro</h3>
           <p className="text-sm text-secondary-600 text-center">
            Os controles do temporizador Pomodoro aparecerão aqui quando não estiverem flutuando.
            Se o timer estiver ativo e flutuando, você o verá no canto da tela.
          </p>
        </div>


        <div className="grid grid-cols-1 gap-6">
          {/* Audiobooks Section - Now takes full width on lg screens since rewards are removed */}
          <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-xl font-semibold text-secondary-800 mb-4 text-center border-b pb-2 border-secondary-200">Audiobooks Inspiradores</h3>
            <p className="text-sm text-center text-secondary-600 mb-4">Ganhe <span className="font-bold text-primary-600">{POINTS_PER_AUDIOBOOK} pontos</span> por cada audiobook que explorar!</p>
            <div className="space-y-3 max-h-80 overflow-y-auto pr-2 custom-scrollbar">
              {AUDIOBOOK_LIST.map(audiobook => (
                <AudiobookItemDisplay key={audiobook.id} audiobook={audiobook} onClaimPoints={onAddPoints} />
              ))}
            </div>
          </div>
        </div>

        {/* Kanban de Produtividade */}
        <div className="bg-white p-6 rounded-xl shadow-xl">
          <div className="flex justify-between items-center mb-4 border-b pb-2 border-secondary-200">
            <h3 className="text-xl font-semibold text-secondary-800">Kanban de Produtividade Diária</h3>
            <Button onClick={openTaskModalForNew} variant="primary" size="sm">Adicionar Tarefa</Button>
          </div>
          <p className="text-sm text-center text-secondary-600 mb-4">Mova tarefas para "Realizado" para ganhar <span className="font-bold text-primary-600">{POINTS_PER_DAILY_TASK_COMPLETION} pontos</span> por cada uma!</p>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {taskColumns.map(column => (
              <div 
                key={column.status}
                className="bg-secondary-100 p-4 rounded-lg min-h-[200px] border border-secondary-200 transition-colors duration-150"
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, column.status)}
              >
                <h4 className="font-semibold text-secondary-700 mb-3 text-center">{column.title}</h4>
                <div className="space-y-2">
                  {dailyTasks.filter(task => task.status === column.status).map(task => (
                    <DailyTaskCard 
                      key={task.id} 
                      task={task} 
                      onEdit={() => openTaskModalForEdit(task)} 
                      onDelete={() => onDeleteDailyTask(task.id)}
                      onDragStart={handleDragStart}
                    />
                  ))}
                  {dailyTasks.filter(task => task.status === column.status).length === 0 && (
                    <p className="text-xs text-secondary-500 text-center py-2">Nenhuma tarefa aqui.</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>


        <div className="bg-white p-6 rounded-xl shadow-xl">
            <h3 className="text-lg font-semibold text-secondary-700 mb-3">Como Funciona o Pomodoro?</h3>
            <p className="text-sm text-secondary-600 mb-2">
            A Técnica Pomodoro é um método de gerenciamento de tempo que usa um cronômetro para dividir o trabalho em intervalos, tradicionalmente de 25 minutos de duração, separados por pausas curtas.
            </p>
            <ul className="list-disc list-inside text-sm text-secondary-600 space-y-1">
            <li><strong>Foco (Trabalho):</strong> 25 minutos de trabalho concentrado.</li>
            <li><strong>Pausa Curta:</strong> 5 minutos de descanso após cada sessão de foco.</li>
            <li><strong>Pausa Longa:</strong> 15 minutos de descanso após 4 ciclos de foco.</li>
            </ul>
        </div>
      </div>

      <Modal isOpen={isTaskModalOpen} onClose={closeTaskModal} title={editingTask ? "Editar Tarefa" : "Nova Tarefa Diária"}>
        <Input
          label="Título da Tarefa"
          name="title"
          value={currentTaskData.title || ''}
          onChange={handleTaskChange}
          required
        />
        <div className="mt-4">
          <label htmlFor="description" className="block text-sm font-medium text-secondary-700 mb-1">Descrição (Opcional)</label>
          <textarea
            id="description"
            name="description"
            rows={3}
            value={currentTaskData.description || ''}
            onChange={handleTaskChange}
            className="block w-full px-3 py-2 border border-secondary-300 rounded-md shadow-sm focus:outline-none focus:ring-primary-500 focus:border-primary-500 sm:text-sm"
          />
        </div>
        <div className="mt-6 flex justify-end space-x-3">
          <Button variant="secondary" onClick={closeTaskModal}>Cancelar</Button>
          <Button variant="primary" onClick={handleSaveCurrentTask}>{editingTask ? "Salvar" : "Adicionar"}</Button>
        </div>
      </Modal>

       <style>{`
        .custom-scrollbar::-webkit-scrollbar {
          width: 8px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: #f1f5f9; /* bg-secondary-100 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: #e2e8f0; /* bg-secondary-200 */
          border-radius: 10px;
        }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover {
          background: #cbd5e1; /* bg-secondary-300 */
        }
      `}</style>
    </div>
  );
};

export default FocusView;
