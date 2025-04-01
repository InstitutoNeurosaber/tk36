import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, PieChart, Pie, Cell, ResponsiveContainer } from 'recharts';
import { Clock, AlertTriangle, CheckCircle2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import type { Ticket } from '../types/ticket';

interface DashboardProps {
  tickets: Ticket[];
}

const COLORS = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444'];

export function Dashboard({ tickets }: DashboardProps) {
  // Métricas
  const totalTickets = tickets.length;
  const openTickets = tickets.filter(t => t.status === 'open').length;
  const resolvedTickets = tickets.filter(t => t.status === 'resolved').length;
  const avgResolutionTime = tickets
    .filter(t => t.status === 'resolved')
    .reduce((acc, t) => {
      const diff = new Date(t.updatedAt).getTime() - new Date(t.createdAt).getTime();
      return acc + diff;
    }, 0) / (resolvedTickets || 1);

  // Calcular variação em relação ao período anterior (últimos 7 dias vs 7 dias anteriores)
  const now = new Date();
  const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const fourteenDaysAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000);

  const recentTickets = tickets.filter(t => new Date(t.createdAt) >= sevenDaysAgo).length;
  const previousTickets = tickets.filter(t => 
    new Date(t.createdAt) >= fourteenDaysAgo && 
    new Date(t.createdAt) < sevenDaysAgo
  ).length;

  const ticketVariation = previousTickets ? 
    ((recentTickets - previousTickets) / previousTickets) * 100 : 
    0;

  // Dados para gráficos
  const statusData = [
    { name: 'Abertos', value: openTickets },
    { name: 'Em Progresso', value: tickets.filter(t => t.status === 'in_progress').length },
    { name: 'Resolvidos', value: resolvedTickets },
    { name: 'Fechados', value: tickets.filter(t => t.status === 'closed').length }
  ];

  const categoryData = [
    { name: 'Software', count: tickets.filter(t => t.category === 'software').length },
    { name: 'Hardware', count: tickets.filter(t => t.category === 'hardware').length },
    { name: 'Rede', count: tickets.filter(t => t.category === 'network').length },
    { name: 'Outros', count: tickets.filter(t => t.category === 'other').length }
  ];

  return (
    <div className="space-y-8">
      {/* Cards de Métricas */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Total de Tickets</p>
              <div className="flex items-center mt-2">
                <p className="text-2xl font-bold text-gray-900">{totalTickets}</p>
                <span className={`ml-2 text-sm font-medium flex items-center ${
                  ticketVariation >= 0 ? 'text-green-600' : 'text-red-600'
                }`}>
                  {ticketVariation >= 0 ? (
                    <ArrowUp className="h-4 w-4 mr-1" />
                  ) : (
                    <ArrowDown className="h-4 w-4 mr-1" />
                  )}
                  {Math.abs(ticketVariation).toFixed(1)}%
                </span>
              </div>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <Users className="h-6 w-6 text-blue-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            vs período anterior
          </p>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tickets Abertos</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{openTickets}</p>
            </div>
            <div className="p-3 bg-yellow-50 rounded-lg">
              <AlertTriangle className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-400 h-2 rounded-full" 
                style={{ width: `${(openTickets / totalTickets) * 100}%` }}
              />
            </div>
            <span className="ml-2 text-gray-500">
              {((openTickets / totalTickets) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Resolvidos</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">{resolvedTickets}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <CheckCircle2 className="h-6 w-6 text-green-600" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-sm">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-400 h-2 rounded-full" 
                style={{ width: `${(resolvedTickets / totalTickets) * 100}%` }}
              />
            </div>
            <span className="ml-2 text-gray-500">
              {((resolvedTickets / totalTickets) * 100).toFixed(0)}%
            </span>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-500">Tempo Médio Resolução</p>
              <p className="mt-2 text-2xl font-bold text-gray-900">
                {Math.round(avgResolutionTime / (1000 * 60 * 60))}h
              </p>
            </div>
            <div className="p-3 bg-purple-50 rounded-lg">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
          <p className="mt-4 text-sm text-gray-500">
            Média dos tickets resolvidos
          </p>
        </div>
      </div>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Status dos Tickets</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <h3 className="text-lg font-medium text-gray-900 mb-6">Tickets por Categoria</h3>
          <div className="h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={categoryData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="count" fill="#3B82F6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}