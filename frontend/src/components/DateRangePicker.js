import { useState, useMemo } from "react";
import { DateRange } from "react-date-range";
import "react-date-range/dist/styles.css";
import "react-date-range/dist/theme/default.css";
import "./DateRangePicker.css";

export const formatDate = (date) => {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}.${m}.${d}`;
};
export const formatRangeLabel = (startDate, endDate) =>
  `${formatDate(startDate)} ~ ${formatDate(endDate)}`;


export default function DateRangePicker({
  value,
  defaultValue = [{ startDate: new Date(), endDate: new Date(), key: "selection" }],
  onChange,
  onClose,
  autoCloseOnSelect = true,
  minDate,
  maxDate = new Date(),

  dateDisplayFormat = "yyyy.MM.dd",
  rangeColors = ["#ff8000"],

  setFilters,
}) {
  const isControlled = Array.isArray(value);
  const [inner, setInner] = useState(defaultValue);
  const [isSelectingStart, setIsSelectingStart] = useState(true);
  const selection = isControlled ? value : inner;



  const handleRangeChange = (ranges) => {
    const sel = ranges.selection;
    const next = [{ ...sel, key: "selection" }];
    const label = formatRangeLabel(sel.startDate, sel.endDate);

    if (!isControlled) setInner(next);

    const toDateString = (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;

    const start = toDateString(sel.startDate);
    const end = toDateString(sel.endDate);
    onChange?.({
      startDate: start,
      endDate: end,
      raw: next,
      label,
    });

    if (typeof setFilters === "function") {
      setFilters((prev) => ({ ...prev, period: ["Select", label] }));
    }

    if (!isSelectingStart) {
      setTimeout(() => {
        if (onClose) onClose();
      }, 120);
    }

    setIsSelectingStart(!isSelectingStart);
  };

  return (
    <div className="calendar-box">
      <DateRange
        editableDateInputs
        onChange={handleRangeChange}
        moveRangeOnFirstSelection={false}
        ranges={selection}
        rangeColors={rangeColors}
        dateDisplayFormat={dateDisplayFormat}
        minDate={minDate}
        maxDate={maxDate}
      />
      <div className="calendar-footer">
        <button className="close-btn" onClick={onClose}>CLOSE</button>
      </div>
    </div>
  );
}
