import React from 'react';
import { Clock, AlertTriangle, CheckCircle2, Users, ArrowUp, ArrowDown } from 'lucide-react';
import type { DashboardMetrics as Metrics } from '../types';

interface DashboardMetricsProps {
  metrics: Metrics;
}

export function DashboardMetrics({ metrics }: DashboardMetricsProps) {
  const {
    totalTickets,
    openTickets,
    resolvedTickets,
    avgResolutionTime,
    ticketVariation
  } = metrics;

  return (
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
  );
}