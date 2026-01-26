import React from 'react';
import { Card, CardContent } from "@/components/ui/card";

const colorClasses = {
  yellow: {
    bg: "bg-yellow-100",
    text: "text-yellow-800",
    iconBg: "bg-yellow-200"
  },
  green: {
    bg: "bg-green-100", 
    text: "text-green-800",
    iconBg: "bg-green-200"
  },
  blue: {
    bg: "bg-blue-100",
    text: "text-blue-800", 
    iconBg: "bg-blue-200"
  },
  purple: {
    bg: "bg-purple-100",
    text: "text-purple-800", 
    iconBg: "bg-purple-200"
  },
  red: {
    bg: "bg-red-100",
    text: "text-red-800",
    iconBg: "bg-red-200"
  }
};

export default function StatsCards({ title, value, icon: Icon, color }) {
  const colors = colorClasses[color] || colorClasses.blue;
  
  return (
    <Card className={`border-0 shadow-sm hover:shadow-md transition-shadow duration-200 ${colors.bg}`}>
      <CardContent className="p-5 flex items-center gap-4">
        <div className={`p-3 rounded-full ${colors.iconBg}`}>
          <Icon className={`w-6 h-6 ${colors.text}`} />
        </div>
        <div>
          <p className={`text-sm font-medium ${colors.text}`}>{title}</p>
          <h3 className="text-2xl font-bold text-gray-900">
            {value}
          </h3>
        </div>
      </CardContent>
    </Card>
  );
}