
import React, { useState, useMemo } from 'react';
import { Quote, InstallationProgressStatus, ManualTransaction } from '../types';
import Button from './common/Button';

interface MiniCalendarProps {
  installations: Quote[]; 
  payables: ManualTransaction[]; // Added for manual expenses
  onDateSelect: (date: Date, quotesOnDate: Quote[], payablesOnDate: ManualTransaction[]) => void;
}

const MiniCalendar: React.FC<MiniCalendarProps> = ({ installations, payables, onDateSelect }) => {
  const [currentDisplayDate, setCurrentDisplayDate] = useState(new Date()); 
  const [selectedDay, setSelectedDay] = useState<number | null>(null);


  const installationsToDisplayByDate = useMemo(() => {
    const map = new Map<string, Quote[]>();
    installations
      .filter(inst => inst.installationProgress !== InstallationProgressStatus.COMPLETED && inst.installationProgress !== InstallationProgressStatus.CANCELED)
      .forEach(inst => {
      if (inst.installationDate) {
        const dateObj = new Date(inst.installationDate + 'T00:00:00'); 
        const localDateStr = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).toISOString().split('T')[0];
        
        if (!map.has(localDateStr)) {
          map.set(localDateStr, []);
        }
        map.get(localDateStr)!.push(inst);
      }
    });
    return map;
  }, [installations]);

  const payablesToDisplayByDate = useMemo(() => {
    const map = new Map<string, ManualTransaction[]>();
    payables.forEach(payable => {
        if (payable.date) { // Manual transactions have 'date' as YYYY-MM-DD
            const dateObj = new Date(payable.date + 'T00:00:00');
            const localDateStr = new Date(dateObj.getFullYear(), dateObj.getMonth(), dateObj.getDate()).toISOString().split('T')[0];
            if (!map.has(localDateStr)) {
                map.set(localDateStr, []);
            }
            map.get(localDateStr)!.push(payable);
        }
    });
    return map;
  }, [payables]);

  const year = currentDisplayDate.getFullYear();
  const month = currentDisplayDate.getMonth(); 

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayDate = new Date(year, month, 1);
  const firstDayOfMonth = new Date(firstDayDate.getFullYear(), firstDayDate.getMonth(), 1).getDay(); 


  const blanks = Array(firstDayOfMonth).fill(null);
  const monthDays = Array.from({ length: daysInMonth }, (_, i) => i + 1);

  const handleDayClick = (day: number) => {
    const clickedDate = new Date(year, month, day); 
    const dateStr = clickedDate.toISOString().split('T')[0];
    const quotesOnThisDate = installationsToDisplayByDate.get(dateStr) || [];
    const payablesOnThisDate = payablesToDisplayByDate.get(dateStr) || [];
    onDateSelect(clickedDate, quotesOnThisDate, payablesOnThisDate);
    setSelectedDay(day);
  };

  const changeMonth = (offset: number) => {
    setCurrentDisplayDate(prev => {
      const newDate = new Date(prev);
      newDate.setDate(1); 
      newDate.setMonth(prev.getMonth() + offset);
      return newDate;
    });
    setSelectedDay(null); 
    const firstDayOfNewMonth = new Date(year, month + offset, 1);
    const dateStr = firstDayOfNewMonth.toISOString().split('T')[0];
    onDateSelect(firstDayOfNewMonth, installationsToDisplayByDate.get(dateStr) || [], payablesToDisplayByDate.get(dateStr) || []); 
  };
  
  const today = new Date();
  const isToday = (day: number) => 
    year === today.getFullYear() && month === today.getMonth() && day === today.getDate();

  return (
    <div className="bg-white p-4 rounded-lg shadow border border-secondary-200">
      <div className="flex justify-between items-center mb-4">
        <Button onClick={() => changeMonth(-1)} size="sm" variant="ghost" aria-label="Mês anterior">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" /></svg>
        </Button>
        <h3 className="text-lg font-semibold text-secondary-700 capitalize">
          {new Date(year, month).toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' })}
        </h3>
        <Button onClick={() => changeMonth(1)} size="sm" variant="ghost" aria-label="Próximo mês">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-5 h-5"><path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" /></svg>
        </Button>
      </div>
      <div className="grid grid-cols-7 gap-1 text-center text-sm">
        {['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'].map(dayName => (
          <div key={dayName} className="font-medium text-secondary-600 py-1 text-xs">{dayName}</div>
        ))}
        {blanks.map((_, i) => <div key={`blank-${i}`} className="border rounded-md border-transparent p-1"></div>)}
        {monthDays.map(day => {
          const currentDateObj = new Date(year, month, day);
          const dateStr = currentDateObj.toISOString().split('T')[0];
          const hasInstallations = installationsToDisplayByDate.has(dateStr) && installationsToDisplayByDate.get(dateStr)!.length > 0;
          const hasPayables = payablesToDisplayByDate.has(dateStr) && payablesToDisplayByDate.get(dateStr)!.length > 0;
          
          let dayClasses = "p-1.5 md:p-2 border rounded-md cursor-pointer flex items-center justify-center aspect-square transition-colors duration-150 text-xs sm:text-sm relative ";
          
          if (hasInstallations || hasPayables) {
            dayClasses += "bg-primary-50 hover:bg-primary-100 text-primary-700 font-semibold border-primary-200 ";
          } else {
            dayClasses += "hover:bg-secondary-100 border-secondary-200 hover:border-secondary-300 ";
          }

          if (selectedDay === day) {
            dayClasses += "ring-2 ring-primary-500 bg-primary-100 border-primary-400 ";
          } else {
             dayClasses += "border-transparent "; 
          }
           if (isToday(day)) {
            dayClasses += selectedDay === day ? "ring-offset-1 " : "border-primary-500 "; 
            if (!hasInstallations && !hasPayables) dayClasses += "text-primary-600 ";
          }

          const installationCount = hasInstallations ? installationsToDisplayByDate.get(dateStr)!.length : 0;
          const payableCount = hasPayables ? payablesToDisplayByDate.get(dateStr)!.length : 0;
          let ariaLabelDetails = "";
          if (installationCount > 0) ariaLabelDetails += `${installationCount} instalações agendadas. `;
          if (payableCount > 0) ariaLabelDetails += `${payableCount} contas a pagar. `;
          if (!ariaLabelDetails) ariaLabelDetails = "sem atividades agendadas."


          return (
            <div key={day} onClick={() => handleDayClick(day)} className={dayClasses} role="button" tabIndex={0} 
                 aria-label={`Dia ${day}, ${ariaLabelDetails}`}>
              {day}
              <div className="absolute top-0.5 right-0.5 flex space-x-px">
                {hasInstallations && (
                  <span 
                      className="w-1.5 h-1.5 bg-red-500 rounded-full" 
                      title={`${installationCount} instalações`}
                      aria-hidden="true">
                  </span>
                )}
                {hasPayables && (
                  <span 
                      className="w-1.5 h-1.5 bg-blue-500 rounded-full" 
                      title={`${payableCount} contas a pagar`}
                      aria-hidden="true">
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default MiniCalendar;