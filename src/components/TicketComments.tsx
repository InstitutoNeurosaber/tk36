import { CollaborativeComments } from './CollaborativeComments';
import type { Ticket } from '../types/ticket';

interface TicketCommentsProps {
  ticket: Ticket;
}

export function TicketComments({ ticket }: TicketCommentsProps) {
  return <CollaborativeComments ticket={ticket} />;
}