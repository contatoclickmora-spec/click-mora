import React from 'react';
import { Link } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { Button } from '@/components/ui/button';
import { PackageCheck, QrCode, ClipboardList, Truck, Package, MessageSquare } from 'lucide-react';

const actions = [
  {
    title: 'Retirar Encomenda',
    href: createPageUrl('RetirarEncomenda'),
    icon: PackageCheck,
    color: 'bg-blue-600 hover:bg-blue-700'
  },
  {
    title: 'Registrar Encomenda',
    href: createPageUrl('RegistrarEncomenda'),
    icon: QrCode,
    color: 'bg-green-600 hover:bg-green-700'
  },
  {
    title: 'Gerenciar Encomendas',
    href: createPageUrl('GerenciamentoEncomendas'),
    icon: Package,
    color: 'bg-purple-600 hover:bg-purple-700'
  },
  {
    title: 'Visitantes',
    href: createPageUrl('VisitantesPortaria'),
    icon: ClipboardList,
    color: 'bg-gray-800 hover:bg-gray-900'
  },
  {
    title: 'Chamados',
    href: createPageUrl('ChamadosPortaria'),
    icon: MessageSquare,
    color: 'bg-red-600 hover:bg-red-700'
  },
  {
    title: 'Entregadores',
    href: createPageUrl('Entregadores'),
    icon: Truck,
    color: 'bg-orange-600 hover:bg-orange-700'
  }
];

export default function QuickActions() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3 md:gap-4">
      {actions.map((action) => (
        <Link to={action.href} key={action.title} className="block">
          <Button
            className={`w-full h-20 md:h-24 text-sm md:text-base font-semibold flex flex-col items-center justify-center gap-2 transition-transform transform hover:scale-105 ${action.color}`}
          >
            <action.icon className="w-5 h-5 md:w-6 md:h-6" />
            <span className="text-xs md:text-sm leading-tight text-center">{action.title}</span>
          </Button>
        </Link>
      ))}
    </div>
  );
}