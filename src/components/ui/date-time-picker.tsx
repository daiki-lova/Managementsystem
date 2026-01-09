"use client";

import * as React from "react";
import { useState, useEffect } from "react";
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Clock } from "lucide-react";
import { format, setMonth, setYear, startOfToday } from "date-fns";
import { ja } from "date-fns/locale";
import { cn } from "./utils";
import { Button } from "./button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./select";

interface DateTimePickerProps {
  value?: Date;
  onChange?: (date: Date | undefined) => void;
  className?: string;
  showTimePresets?: boolean;
  minYear?: number;
  maxYear?: number;
}

const MONTHS = [
  "1月", "2月", "3月", "4月", "5月", "6月",
  "7月", "8月", "9月", "10月", "11月", "12月"
];

const TIME_PRESETS = [
  { label: "6:00", value: "06:00" },
  { label: "9:00", value: "09:00" },
  { label: "12:00", value: "12:00" },
  { label: "15:00", value: "15:00" },
  { label: "18:00", value: "18:00" },
  { label: "21:00", value: "21:00" },
];

export function DateTimePicker({
  value,
  onChange,
  className,
  showTimePresets = true,
  minYear = 2020,
  maxYear = 2030,
}: DateTimePickerProps) {
  const today = startOfToday();
  const [viewDate, setViewDate] = useState<Date>(value || today);
  const [selectedDate, setSelectedDate] = useState<Date | undefined>(value);
  const [time, setTime] = useState<string>(
    value ? format(value, "HH:mm") : "12:00"
  );

  // 年の選択肢を生成
  const years = React.useMemo(() => {
    const result = [];
    for (let y = minYear; y <= maxYear; y++) {
      result.push(y);
    }
    return result;
  }, [minYear, maxYear]);

  // 表示月のカレンダーデータを生成
  const calendarDays = React.useMemo(() => {
    const year = viewDate.getFullYear();
    const month = viewDate.getMonth();

    // 月の最初の日
    const firstDay = new Date(year, month, 1);
    // 月の最後の日
    const lastDay = new Date(year, month + 1, 0);

    // 週の開始を日曜日として調整
    const startOffset = firstDay.getDay();
    const daysInMonth = lastDay.getDate();

    const days: { date: Date; isCurrentMonth: boolean; isToday: boolean }[] = [];

    // 前月の日を追加
    for (let i = startOffset - 1; i >= 0; i--) {
      const date = new Date(year, month, -i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    // 当月の日を追加
    for (let d = 1; d <= daysInMonth; d++) {
      const date = new Date(year, month, d);
      days.push({
        date,
        isCurrentMonth: true,
        isToday:
          date.getDate() === today.getDate() &&
          date.getMonth() === today.getMonth() &&
          date.getFullYear() === today.getFullYear(),
      });
    }

    // 次月の日を追加（6週間分になるように）
    const remaining = 42 - days.length;
    for (let i = 1; i <= remaining; i++) {
      const date = new Date(year, month + 1, i);
      days.push({
        date,
        isCurrentMonth: false,
        isToday: false,
      });
    }

    return days;
  }, [viewDate, today]);

  // 日付が選択されたとき
  const handleDateSelect = (date: Date) => {
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(date);
    newDate.setHours(hours, minutes, 0, 0);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // 時間が変更されたとき
  const handleTimeChange = (newTime: string) => {
    setTime(newTime);
    if (selectedDate) {
      const [hours, minutes] = newTime.split(":").map(Number);
      const newDate = new Date(selectedDate);
      newDate.setHours(hours, minutes, 0, 0);
      setSelectedDate(newDate);
      onChange?.(newDate);
    }
  };

  // プリセット時間を選択
  const handlePresetClick = (preset: string) => {
    handleTimeChange(preset);
  };

  // 前月に移動
  const goToPreviousMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() - 1, 1));
  };

  // 次月に移動
  const goToNextMonth = () => {
    setViewDate(new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 1));
  };

  // 今日に移動
  const goToToday = () => {
    const [hours, minutes] = time.split(":").map(Number);
    const newDate = new Date(today);
    newDate.setHours(hours, minutes, 0, 0);
    setViewDate(today);
    setSelectedDate(newDate);
    onChange?.(newDate);
  };

  // 年を変更
  const handleYearChange = (yearStr: string) => {
    const newDate = setYear(viewDate, parseInt(yearStr));
    setViewDate(newDate);
  };

  // 月を変更
  const handleMonthChange = (monthStr: string) => {
    const newDate = setMonth(viewDate, parseInt(monthStr));
    setViewDate(newDate);
  };

  // 日付の選択状態を判定
  const isSelected = (date: Date) => {
    if (!selectedDate) return false;
    return (
      date.getDate() === selectedDate.getDate() &&
      date.getMonth() === selectedDate.getMonth() &&
      date.getFullYear() === selectedDate.getFullYear()
    );
  };

  // value propが変更されたら状態を更新
  useEffect(() => {
    if (value) {
      setSelectedDate(value);
      setViewDate(value);
      setTime(format(value, "HH:mm"));
    }
  }, [value]);

  const weekDays = ["日", "月", "火", "水", "木", "金", "土"];

  return (
    <div className={cn("w-full max-w-[320px]", className)}>
      {/* ヘッダー：年月セレクター */}
      <div className="flex items-center justify-between mb-4">
        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToPreviousMonth}
        >
          <ChevronLeft className="h-4 w-4" />
        </Button>

        <div className="flex items-center gap-1">
          <Select
            value={viewDate.getFullYear().toString()}
            onValueChange={handleYearChange}
          >
            <SelectTrigger className="w-[80px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {years.map((year) => (
                <SelectItem key={year} value={year.toString()}>
                  {year}年
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select
            value={viewDate.getMonth().toString()}
            onValueChange={handleMonthChange}
          >
            <SelectTrigger className="w-[70px] h-8 text-sm">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {MONTHS.map((month, index) => (
                <SelectItem key={index} value={index.toString()}>
                  {month}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <Button
          variant="ghost"
          size="icon"
          className="h-8 w-8"
          onClick={goToNextMonth}
        >
          <ChevronRight className="h-4 w-4" />
        </Button>
      </div>

      {/* 今日ボタン */}
      <div className="flex justify-center mb-3">
        <Button
          variant="outline"
          size="sm"
          className="text-xs h-7"
          onClick={goToToday}
        >
          <CalendarIcon className="h-3 w-3 mr-1" />
          今日
        </Button>
      </div>

      {/* カレンダーグリッド */}
      <div className="grid grid-cols-7 gap-1 mb-4">
        {/* 曜日ヘッダー */}
        {weekDays.map((day, index) => (
          <div
            key={day}
            className={cn(
              "text-center text-xs font-medium py-1",
              index === 0 && "text-red-500",
              index === 6 && "text-blue-500"
            )}
          >
            {day}
          </div>
        ))}

        {/* 日付 */}
        {calendarDays.map(({ date, isCurrentMonth, isToday }, index) => {
          const dayOfWeek = date.getDay();
          return (
            <button
              key={index}
              type="button"
              onClick={() => handleDateSelect(date)}
              className={cn(
                "h-9 w-full rounded-md text-sm transition-colors",
                "hover:bg-neutral-100 focus:outline-none focus:ring-2 focus:ring-neutral-400 focus:ring-offset-1",
                !isCurrentMonth && "text-neutral-300",
                isCurrentMonth && dayOfWeek === 0 && "text-red-500",
                isCurrentMonth && dayOfWeek === 6 && "text-blue-500",
                isToday && "bg-neutral-100 font-semibold",
                isSelected(date) && "bg-neutral-900 text-white hover:bg-neutral-800"
              )}
            >
              {date.getDate()}
            </button>
          );
        })}
      </div>

      {/* 時間選択セクション */}
      <div className="border-t pt-4 space-y-3">
        <div className="flex items-center gap-2">
          <Clock className="h-4 w-4 text-neutral-500" />
          <span className="text-sm text-neutral-600">時刻</span>
          <input
            type="time"
            value={time}
            onChange={(e) => handleTimeChange(e.target.value)}
            className={cn(
              "flex-1 h-9 px-3 rounded-md border border-neutral-200",
              "text-sm focus:outline-none focus:ring-2 focus:ring-neutral-400",
              "bg-white"
            )}
          />
        </div>

        {/* 時間プリセット */}
        {showTimePresets && (
          <div className="flex flex-wrap gap-1.5">
            {TIME_PRESETS.map((preset) => (
              <Button
                key={preset.value}
                type="button"
                variant={time === preset.value ? "default" : "outline"}
                size="sm"
                className="h-7 text-xs px-2.5"
                onClick={() => handlePresetClick(preset.value)}
              >
                {preset.label}
              </Button>
            ))}
          </div>
        )}
      </div>

      {/* 選択中の日時表示 */}
      {selectedDate && (
        <div className="mt-4 p-3 bg-neutral-50 rounded-md text-center">
          <span className="text-sm text-neutral-600">選択中: </span>
          <span className="text-sm font-medium">
            {format(selectedDate, "yyyy年M月d日(E) HH:mm", { locale: ja })}
          </span>
        </div>
      )}
    </div>
  );
}
