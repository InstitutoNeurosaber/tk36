import React, { useState, useEffect } from 'react';
import { Clock, User, Link } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../lib/firebase';
import type { Ticket } from '../../../../types/ticket';

interface TicketInfoProps {
  ticket: Ticket;
}

export function TicketInfo({ ticket }: TicketInfoProps) {
  const [userData, setUserData] = useState<{ name: string; email: string } | null>(null);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', ticket.userId));
        if (userDoc.exists()) {
          const data = userDoc.data();
          setUserData({
            name: data.name,
            email: data.email
          });
        }
      } catch (error) {
        console.error('Erro ao buscar dados do usuário:', error);
      }
    };

    fetchUserData();
  }, [ticket.userId]);

  return (
    <div className="space-y-2">
      <div className="flex items-center space-x-2">
        <User className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-600">
          Criado por: {userData ? (
            <>
              <span className="font-medium">{userData.name}</span>
              <span className="text-gray-500"> ({userData.email})</span>
            </>
          ) : 'Carregando...'}
        </span>
      </div>
      <div className="flex items-center space-x-2">
        <Clock className="w-5 h-5 text-gray-500" />
        <span className="text-sm text-gray-600">
          Criado em: {new Date(ticket.createdAt).toLocaleString('pt-BR')}
        </span>
      </div>
      {ticket.taskId && (
        <div className="flex items-center space-x-2">
          <Link className="w-5 h-5 text-blue-500" />
          <span className="text-sm text-blue-600">
            ID da Tarefa: {ticket.taskId}
          </span>
        </div>
      )}
    </div>
  );
}