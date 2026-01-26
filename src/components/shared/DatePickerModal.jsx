import React, { useState, useEffect } from 'react';
import { X, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";

export default function DatePickerModal({ open, onClose, title, onConfirm, initialDate, minDate }) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return isNaN(d.getTime()) ? new Date() : d;
  });
  const [viewMonth, setViewMonth] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return isNaN(d.getTime()) ? new Date().getMonth() : d.getMonth();
  });
  const [viewYear, setViewYear] = useState(() => {
    const d = initialDate ? new Date(initialDate) : new Date();
    return isNaN(d.getTime()) ? new Date().getFullYear() : d.getFullYear();
  });

  useEffect(() => {
    if (initialDate) {
      const date = new Date(initialDate);
      if (!isNaN(date.getTime())) {
        setSelectedDate(date);
        setViewMonth(date.getMonth());
        setViewYear(date.getFullYear());
      }
    }
  }, [initialDate]);

  const monthNames = [
    'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
    'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
  ];

  const daysOfWeek = ['D', 'S', 'T', 'Q', 'Q', 'S', 'S'];

  const getDaysInMonth = (month, year) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (month, year) => {
    return new Date(year, month, 1).getDay();
  };

  const generateCalendarDays = () => {
    const daysInMonth = getDaysInMonth(viewMonth, viewYear);
    const firstDay = getFirstDayOfMonth(viewMonth, viewYear);
    const days = [];

    // Dias do mês anterior
    const prevMonthDays = getDaysInMonth(
      viewMonth === 0 ? 11 : viewMonth - 1,
      viewMonth === 0 ? viewYear - 1 : viewYear
    );
    for (let i = firstDay - 1; i >= 0; i--) {
      days.push({
        day: prevMonthDays - i,
        isCurrentMonth: false,
        date: new Date(
          viewMonth === 0 ? viewYear - 1 : viewYear,
          viewMonth === 0 ? 11 : viewMonth - 1,
          prevMonthDays - i
        )
      });
    }

    // Dias do mês atual
    for (let i = 1; i <= daysInMonth; i++) {
      days.push({
        day: i,
        isCurrentMonth: true,
        date: new Date(viewYear, viewMonth, i)
      });
    }

    // Dias do próximo mês
    const remainingDays = 42 - days.length; // 6 semanas x 7 dias
    for (let i = 1; i <= remainingDays; i++) {
      days.push({
        day: i,
        isCurrentMonth: false,
        date: new Date(
          viewMonth === 11 ? viewYear + 1 : viewYear,
          viewMonth === 11 ? 0 : viewMonth + 1,
          i
        )
      });
    }

    return days;
  };

  const isDateDisabled = (date) => {
    if (!minDate) return false;
    const min = new Date(minDate);
    min.setHours(0, 0, 0, 0);
    const checkDate = new Date(date);
    checkDate.setHours(0, 0, 0, 0);
    return checkDate < min;
  };

  const isSelectedDate = (date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  const handlePrevYear = () => {
    setViewYear(viewYear - 1);
  };

  const handlePrevMonth = () => {
    if (viewMonth === 0) {
      setViewMonth(11);
      setViewYear(viewYear - 1);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };

  const handleNextMonth = () => {
    if (viewMonth === 11) {
      setViewMonth(0);
      setViewYear(viewYear + 1);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleNextYear = () => {
    setViewYear(viewYear + 1);
  };

  const handleDayClick = (date) => {
    if (!isDateDisabled(date)) {
      setSelectedDate(date);
    }
  };

  const handleConfirm = () => {
    if (selectedDate) {
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      onConfirm(`${year}-${month}-${day}`);
      onClose();
    }
  };

  const calendarDays = generateCalendarDays();

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px] p-0">
        <DialogHeader className="p-6 pb-4">
          <div className="flex items-center justify-between">
            <DialogTitle className="text-[#3b5998] text-2xl">{title}</DialogTitle>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <X className="w-6 h-6" />
            </button>
          </div>
        </DialogHeader>

        <div className="px-6 pb-6">
          {/* Calendário */}
          <div className="bg-gray-50 rounded-xl p-4">
            {/* Navegação do mês */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={handlePrevYear}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronsLeft className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handlePrevMonth}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronLeft className="w-5 h-5 text-gray-600" />
              </button>
              <div className="text-lg font-semibold text-gray-900">
                {monthNames[viewMonth]} {viewYear}
              </div>
              <button
                onClick={handleNextMonth}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronRight className="w-5 h-5 text-gray-600" />
              </button>
              <button
                onClick={handleNextYear}
                className="p-2 hover:bg-gray-200 rounded-full transition-colors"
              >
                <ChevronsRight className="w-5 h-5 text-gray-600" />
              </button>
            </div>

            {/* Dias da semana */}
            <div className="grid grid-cols-7 gap-2 mb-2">
              {daysOfWeek.map((day, idx) => (
                <div
                  key={idx}
                  className="text-center text-sm font-semibold text-gray-600 py-2"
                >
                  {day}
                </div>
              ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 gap-2">
              {calendarDays.map((dayInfo, idx) => {
                const disabled = isDateDisabled(dayInfo.date);
                const selected = isSelectedDate(dayInfo.date);

                return (
                  <button
                    key={idx}
                    onClick={() => handleDayClick(dayInfo.date)}
                    disabled={disabled}
                    className={`
                      aspect-square rounded-full flex items-center justify-center text-base
                      transition-all duration-200
                      ${!dayInfo.isCurrentMonth ? 'text-gray-400' : 'text-gray-900'}
                      ${disabled ? 'opacity-30 cursor-not-allowed' : 'hover:bg-gray-200'}
                      ${selected ? 'bg-gray-900 text-white hover:bg-gray-800' : ''}
                    `}
                  >
                    {dayInfo.day}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Botões */}
          <div className="flex gap-3 mt-6">
            <Button
              onClick={onClose}
              variant="outline"
              className="flex-1 h-12 text-base font-medium border-2"
            >
              Cancelar
            </Button>
            <Button
              onClick={handleConfirm}
              className="flex-1 h-12 text-base font-medium bg-gray-900 hover:bg-gray-800 text-white"
            >
              Confirmar
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}