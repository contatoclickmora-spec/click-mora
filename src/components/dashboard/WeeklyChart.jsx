import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, subDays, startOfDay } from 'date-fns';
import { ptBR } from 'date-fns/locale';

export default function WeeklyChart({ encomendas }) {
  // Gerar dados dos últimos 7 dias
  const generateWeeklyData = () => {
    const data = [];
    for (let i = 6; i >= 0; i--) {
      const date = startOfDay(subDays(new Date(), i));
      const dateStr = date.toDateString();
      
      const entradas = encomendas.filter(e => 
        new Date(e.data_entrada).toDateString() === dateStr
      ).length;
      
      const retiradas = encomendas.filter(e => 
        e.data_retirada && new Date(e.data_retirada).toDateString() === dateStr
      ).length;

      data.push({
        dia: format(date, 'EEE', { locale: ptBR }),
        entradas,
        retiradas,
        fullDate: format(date, 'dd/MM', { locale: ptBR })
      });
    }
    return data;
  };

  const weeklyData = generateWeeklyData();

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-white p-3 border border-gray-200 rounded-lg shadow-lg">
          <p className="font-medium text-gray-900">{`${label}`}</p>
          <p className="text-blue-600">
            Entradas: {payload[0]?.value || 0}
          </p>
          <p className="text-green-600">
            Retiradas: {payload[1]?.value || 0}
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <Card className="shadow-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-gray-900">
          Movimentação Semanal
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-80">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={weeklyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis 
                dataKey="dia" 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <YAxis 
                axisLine={false}
                tickLine={false}
                tick={{ fill: '#6b7280', fontSize: 12 }}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar 
                dataKey="entradas" 
                fill="#3b82f6" 
                radius={[2, 2, 0, 0]}
                name="Entradas"
              />
              <Bar 
                dataKey="retiradas" 
                fill="#10b981" 
                radius={[2, 2, 0, 0]}
                name="Retiradas"
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
        <div className="flex justify-center gap-6 mt-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-blue-500 rounded"></div>
            <span className="text-sm text-gray-600">Entradas</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-green-500 rounded"></div>
            <span className="text-sm text-gray-600">Retiradas</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}