"use client";

import { useEffect, useState, type MouseEvent } from "react";
import DatePicker, {
  Calendar,
  type CalendarProps,
  type DatePickerProps,
} from "react-multi-date-picker";
import TimePicker from "react-multi-date-picker/plugins/time_picker";
import persian from "react-date-object/calendars/persian";
import persian_fa from "react-date-object/locales/persian_fa";
import gregorian from "react-date-object/calendars/gregorian";
import { X } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  convertISOToDateObject,
  toDateKey,
  toTimeValue,
} from "@/lib/persian-helper";
import { cn } from "@/lib/utils";

interface PersianDatePickerProps {
  value?: string;
  defaultValue?: string;
  value2?: string;
  name?: string;
  id?: string;
  placeholder?: string;
  onChange?: (date: string | string[]) => void;
  showCalendar?: boolean;
  mode?: "range" | "single";
  numberOfMonths?: number;
  onlyYearPicker?: boolean;
  onlyTimePicker?: boolean;
  withTime?: boolean;
  rounded?: boolean;
  size?: "default" | "sm";
  required?: boolean;
  minDate?: string;
  maxDate?: string;
  className?: string;
  datePickerProps?: Partial<DatePickerProps>;
  calendarProps?: Partial<CalendarProps>;
}

export default function PersianDatePicker({
  value,
  defaultValue = "",
  onChange,
  placeholder,
  value2 = "",
  name,
  id,
  showCalendar = false,
  mode = "single",
  numberOfMonths = 1,
  onlyYearPicker = false,
  onlyTimePicker = false,
  withTime = false,
  rounded = false,
  size = "sm",
  required = false,
  minDate,
  maxDate,
  className,
  datePickerProps,
  calendarProps,
}: PersianDatePickerProps) {
  const [mounted, setMounted] = useState(false);
  const [pickerKey, setPickerKey] = useState(0);
  const isControlled = value !== undefined;
  const [internal, setInternal] = useState(defaultValue);
  const current = isControlled ? (value ?? "") : internal;

  useEffect(() => {
    setMounted(true);
  }, []);

  const format = onlyYearPicker
    ? "YYYY"
    : onlyTimePicker
      ? "HH:mm"
      : withTime
        ? "YYYY/MM/DD HH:mm"
        : "YYYY/MM/DD";

  const inputSizeClass =
    size === "sm" ? "h-8 py-1 text-sm" : "h-12 py-3 text-sm";

  /** Empty `{}` is what react-multi-date-picker treats as a cleared value. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const pickerValue: any =
    mode == "range"
      ? [
          convertISOToDateObject(current) || {},
          convertISOToDateObject(value2) || {},
        ]
      : current
        ? convertISOToDateObject(current)
        : {};

  function emit(next: string | string[]) {
    if (!isControlled) {
      setInternal(typeof next === "string" ? next : (next[0] ?? ""));
    }
    onChange?.(next);
  }

  // Match digifair handleChange shape (any) for library compatibility.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const handleChange = (date: any) => {
    if (!date) {
      emit("");
      return;
    }

    if (mode == "range") {
      const first = onlyTimePicker
        ? toTimeValue(date[0])
        : withTime
          ? date[0].convert(gregorian).toDate().toISOString()
          : toDateKey(date[0]);
      emit([first]);

      if (date[1]) {
        const second = onlyTimePicker
          ? toTimeValue(date[1])
          : withTime
            ? date[1].convert(gregorian).toDate().toISOString()
            : toDateKey(date[1]);
        emit([first, second]);
      }
    } else if (onlyTimePicker) {
      emit(toTimeValue(date));
    } else if (withTime) {
      emit(date.convert(gregorian).toDate().toISOString());
    } else {
      emit(toDateKey(date));
    }
  };

  const handleClear = (event: MouseEvent) => {
    // Prevent the DatePicker from stealing focus / re-opening on the same click.
    event.preventDefault();
    event.stopPropagation();
    emit("");
    setPickerKey((key) => key + 1);
  };

  const timePlugin =
    withTime || onlyTimePicker ? (
      <TimePicker key="time" position="bottom" hideSeconds />
    ) : null;

  const inputClass = `${inputSizeClass} border border-input bg-background w-full pl-8 pr-2 ${rounded ? "rounded-full" : "rounded-md"} focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary ${current ? "" : "border-gray-300"}`;

  if (!mounted) {
    return (
      <div className={cn("relative w-full", className)}>
        {name ? (
          <input
            type="hidden"
            name={name}
            value={current}
            required={required}
          />
        ) : null}
        <input
          id={id}
          readOnly
          placeholder={placeholder}
          value={current}
          className={inputClass}
        />
      </div>
    );
  }

  return (
    <div className={cn("relative w-full", className)}>
      {name ? (
        <input type="hidden" name={name} value={current} required={required} />
      ) : null}

      {showCalendar ? (
        <Calendar
          key={pickerKey}
          calendar={persian}
          locale={persian_fa}
          format={format}
          className="w-full rounded-lg"
          value={pickerValue}
          onChange={handleChange}
          range={mode == "range"}
          rangeHover={true}
          onlyYearPicker={onlyYearPicker}
          numberOfMonths={numberOfMonths}
          disableDayPicker={onlyTimePicker}
          plugins={timePlugin ? [timePlugin] : undefined}
          minDate={
            minDate ? (convertISOToDateObject(minDate) ?? undefined) : undefined
          }
          maxDate={
            maxDate ? (convertISOToDateObject(maxDate) ?? undefined) : undefined
          }
          {...calendarProps}
        />
      ) : (
        <DatePicker
          key={pickerKey}
          id={id}
          calendar={persian}
          locale={persian_fa}
          format={format}
          onlyYearPicker={onlyYearPicker}
          placeholder={placeholder}
          className="w-full rounded-lg"
          containerClassName="w-full"
          value={pickerValue}
          onChange={handleChange}
          range={mode == "range"}
          rangeHover={true}
          numberOfMonths={numberOfMonths}
          disableDayPicker={onlyTimePicker}
          plugins={timePlugin ? [timePlugin] : undefined}
          minDate={
            minDate ? (convertISOToDateObject(minDate) ?? undefined) : undefined
          }
          maxDate={
            maxDate ? (convertISOToDateObject(maxDate) ?? undefined) : undefined
          }
          inputClass={inputClass}
          {...datePickerProps}
        />
      )}

      {current ? (
        <Button
          type="button"
          variant="ghost"
          size={size === "sm" ? "icon-sm" : "icon"}
          className="absolute top-1/2 left-1 z-10 size-6 -translate-y-1/2"
          onMouseDown={handleClear}
          tabIndex={-1}
          aria-label="پاک کردن"
        >
          <X className="size-3.5 text-muted-foreground hover:text-foreground" />
        </Button>
      ) : null}
    </div>
  );
}
