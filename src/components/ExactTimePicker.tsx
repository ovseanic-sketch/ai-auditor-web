import React from "react";

interface ExactTimePickerProps {
  label?: string;
  value: string; // "HH:mm"
  onChange: (value: string) => void;
  disabled?: boolean;
  required?: boolean;
  error?: string;
}

export const ExactTimePicker: React.FC<ExactTimePickerProps> = ({
  label,
  value,
  onChange,
  disabled = false,
  required = false,
  error,
}) => {
  // Parse value "HH:mm"
  let hour = "10";
  let minute = "00";
  if (value && value.includes(":")) {
    const parts = value.split(":");
    hour = parts[0].padStart(2, "0");
    minute = parts[1].padStart(2, "0");
  }

  const hoursList = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, "0"));
  const minutesList = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

  const handleHourChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newHour = e.target.value;
    onChange(`${newHour}:${minute}`);
  };

  const handleMinuteChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newMinute = e.target.value;
    onChange(`${hour}:${newMinute}`);
  };

  return (
    <div className="flex flex-col gap-1">
      {label && (
        <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
          {label} {required && <span className="text-red-500">*</span>}
        </label>
      )}
      <div className="flex items-center gap-1.5">
        <select
          value={hour}
          onChange={handleHourChange}
          disabled={disabled}
          className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {hoursList.map((h) => (
            <option key={h} value={h}>
              {h} ч
            </option>
          ))}
        </select>
        <span className="text-slate-500 font-bold">:</span>
        <select
          value={minute}
          onChange={handleMinuteChange}
          disabled={disabled}
          className="px-2 py-1.5 bg-white dark:bg-slate-800 border border-slate-300 dark:border-slate-700 rounded text-sm text-slate-800 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
        >
          {minutesList.map((m) => (
            <option key={m} value={m}>
              {m} мин
            </option>
          ))}
        </select>
      </div>
      {error && <span className="text-xs text-red-500">{error}</span>}
    </div>
  );
};
