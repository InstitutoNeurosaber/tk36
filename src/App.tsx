import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import React, { useState, useEffect } from 'react';
import { Plus, Settings, Users, Book } from 'lucide-react';
import { BrowserRouter as Router, Routes, Route, useNavigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useTickets } from './hooks/useTickets';
import { useNotifications } from './hooks/useNotifications';
import { useUserStore } from './stores/userStore';
import { useTicketStatus } from './hooks/useTicketStatus';
import { Auth } from './components/Auth';
import { CreateTicketForm } from './components/CreateTicketForm';
import { TicketList } from './components/TicketList';
import { TicketDetailsModal } from './components/TicketDetailsModal';
import { Dashboard } from './components/Dashboard';
import { Notifications } from './components/Notifications';
import { WebhookConfig } from './components/WebhookConfig';
import { ThemeToggle } from './components/ThemeToggle';
import { UserMenu } from './components/UserMenu';
import { TicketFilters } from './components/TicketFilters';
import { UserManagement } from './components/UserManagement';
import { CommentsPage } from './pages/Comments';
import { DiaryPage } from './pages/Diary';
import type { Ticket, TicketStatus, TicketPriority, TicketCategory } from './types/ticket';

function MainContent() {
  const navigate = useNavigate();
  const { user, userData, signOut } = useAuthStore();
  const { tickets, loading, error, createTicket, deleteTicket } = useTickets();
  const { updateStatus } = useTicketStatus();
  const { 
    notifications, 
    createNotification, 
    markAsRead, 
    markAllAsRead, 
    deleteNotification, 
    clearAll 
  } = useNotifications();
  const {
    users,
    fetchUsers,
    createUser,
    deleteUser,
    toggleUserStatus
  } = useUserStore();

  const [isCreating, setIsCreating] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);
  const [showDashboard, setShowDashboard] = useState(false);
  const [showWebhookConfig, setShowWebhookConfig] = useState(false);
  const [showUserManagement, setShowUserManagement] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<TicketStatus | 'all'>('all');
  const [selectedPriority, setSelectedPriority] = useState<TicketPriority | 'all'>('all');
  const [selectedCategory, setSelectedCategory] = useState<TicketCategory | 'all'>('all');

  useEffect(() => {
    if (user) {
      fetchUsers();
    }
  }, [user, fetchUsers]);

  const handleCreateTicket = async (data: Omit<Ticket, 'id' | 'createdAt' | 'updatedAt' | 'deadline' | 'userId' | 'comments' | 'attachments'>) => {
    await createTicket({
      ...data,
      userId: user.uid,
      comments: [],
      attachments: []
    });
    
    await createNotification({
      ticketId: 'temp',
      userId: user.uid,
      message: `Novo ticket criado: ${data.title}`
    });
    
    setIsCreating(false);
  };

  const handleStatusChange = async (ticketId: string, newStatus: TicketStatus) => {
    try {
      await updateStatus(ticketId, newStatus);
      
      await createNotification({
        ticketId,
        userId: user.uid,
        message: `Status do ticket atualizado para: ${newStatus}`
      });
    } catch (error) {
      console.error('Erro ao atualizar status:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    try {
      await deleteTicket(ticketId);
      await createNotification({
        ticketId,
        userId: user.uid,
        message: 'Ticket excluído'
      });
    } catch (error) {
      console.error('Erro ao excluir ticket:', error);
    }
  };

  const handleTicketClick = (ticket: Ticket) => {
    setSelectedTicket(ticket);
  };

  const handleTicketUpdate = (updatedTicket: Ticket) => {
    setSelectedTicket(updatedTicket);
  };

  const toggleView = (view: 'tickets' | 'dashboard' | 'webhooks' | 'users' | 'diary') => {
    if (userData.role !== 'admin' && view !== 'tickets') {
      return;
    }
    
    setShowDashboard(view === 'dashboard');
    setShowWebhookConfig(view === 'webhooks');
    setShowUserManagement(view === 'users');

    if (view === 'diary') {
      navigate('/diary');
    } else {
      navigate('/');
    }
  };

  const clearFilters = () => {
    setSearchTerm('');
    setSelectedStatus('all');
    setSelectedPriority('all');
    setSelectedCategory('all');
  };

  const filteredTickets = tickets.filter(ticket => {
    const matchesSearch = ticket.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ticket.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = selectedStatus === 'all' || ticket.status === selectedStatus;
    const matchesPriority = selectedPriority === 'all' || ticket.priority === selectedPriority;
    const matchesCategory = selectedCategory === 'all' || ticket.category === selectedCategory;

    return matchesSearch && matchesStatus && matchesPriority && matchesCategory;
  });

  const TOAST_ID = "loading-tickets"; // ID único

if (loading && !toast.isActive(TOAST_ID)) {
  toast.info("Carregando tickets...", { toastId: TOAST_ID });
}

  if (error) {
    return <div>Erro: {error}</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="max-w-7xl mx-auto py-8 px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center mb-8">
          <div className="flex items-center space-x-4">
            <h1 className="text-2xl font-bold text-foreground">Sistema de Tickets TI</h1>
            <nav className="flex space-x-2">
              <button
                onClick={() => toggleView('tickets')}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  !showDashboard && !showWebhookConfig && !showUserManagement
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-secondary text-secondary-foreground hover:bg-accent'
                }`}
              >
                Tickets
              </button>
              
              {userData.role === 'admin' && (
                <>
                  <button
                    onClick={() => toggleView('dashboard')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      showDashboard
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    Dashboard
                  </button>
                  <button
                    onClick={() => toggleView('webhooks')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      showWebhookConfig
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    <Settings className="h-4 w-4 inline-block mr-1" />
                    Webhooks
                  </button>
                  <button
                    onClick={() => toggleView('users')}
                    className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                      showUserManagement
                        ? 'bg-primary text-primary-foreground'
                        : 'bg-secondary text-secondary-foreground hover:bg-accent'
                    }`}
                  >
                    <Users className="h-4 w-4 inline-block mr-1" />
                    Usuários
                  </button>
                  <button
                    onClick={() => toggleView('diary')}
                    className="px-4 py-2 text-sm font-medium rounded-md bg-secondary text-secondary-foreground hover:bg-accent transition-colors"
                  >
                    <Book className="h-4 w-4 inline-block mr-1" />
                    Diário
                  </button>
                </>
              )}
            </nav>
          </div>
          <div className="flex items-center space-x-4">
            <ThemeToggle />
            <Notifications
              notifications={notifications}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={() => markAllAsRead(user.uid)}
              onDeleteNotification={deleteNotification}
              onClearAll={() => clearAll(user.uid)}
            />
            {!showWebhookConfig && !showDashboard && !showUserManagement && (
              <button
                onClick={() => setIsCreating(!isCreating)}
                className="inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-primary-foreground bg-primary hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              >
                <Plus className="h-5 w-5 mr-2" />
                Novo Ticket
              </button>
            )}
            <UserMenu userName={userData.name} onSignOut={signOut} />
          </div>
        </div>

        <div className="animate-in fade-in slide-in">
          {showWebhookConfig && userData.role === 'admin' ? (
            <WebhookConfig />
          ) : showDashboard && userData.role === 'admin' ? (
            <Dashboard tickets={tickets} />
          ) : showUserManagement && userData.role === 'admin' ? (
            <UserManagement
              users={users}
              onCreateUser={createUser}
              onDeleteUser={deleteUser}
              onToggleUserStatus={toggleUserStatus}
            />
          ) : (
            <>
      {/* Modal de Criação de Ticket */}
      {isCreating && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-md shadow-lg w-1/3">
            <h2 className="text-xl font-semibold mb-4">Criar Novo Ticket</h2>
            <CreateTicketForm onSubmit={handleCreateTicket} />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setIsCreating(false)} // Fecha o modal
                className="px-4 py-2 text-white bg-gray-500 rounded-md"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Filtros e Lista de Tickets */}
      <div className="mb-6">
        <TicketFilters
          searchTerm={searchTerm}
          onSearchChange={setSearchTerm}
          selectedStatus={selectedStatus}
          onStatusChange={setSelectedStatus}
          selectedPriority={selectedPriority}
          onPriorityChange={setSelectedPriority}
          selectedCategory={selectedCategory}
          onCategoryChange={setSelectedCategory}
          onClearFilters={clearFilters}
        />
      </div>

      <TicketList
        tickets={filteredTickets}
        onTicketClick={handleTicketClick}
        onDeleteTicket={handleDeleteTicket}
        onStatusChange={handleStatusChange}
      />

      {selectedTicket && (
        <TicketDetailsModal
          ticket={selectedTicket}
          onClose={() => setSelectedTicket(null)}
          onStatusChange={handleStatusChange}
          onUpdate={handleTicketUpdate}
        />
      )}
    </>
          )}
        </div>
      </div>
    </div>
  );
}

function App() {
  const { user, userData } = useAuthStore();

  if (!user || !userData) {
    return <Auth />;
  }

  return (
    <>
      <ToastContainer />
      <Router>
        <Routes>
          <Route path="/comments/:ticketId" element={<CommentsPage />} />
          <Route path="/diary" element={<DiaryPage />} />
          <Route path="/" element={<MainContent />} />
        </Routes>
      </Router>
    </>
  );
}

export default App;