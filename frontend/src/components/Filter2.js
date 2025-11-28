import React, { useState, useRef, useEffect } from "react";
import Select from "react-select";
import { BiSearch, BiCalendar } from "react-icons/bi";
import { createPortal } from "react-dom";
import DateRangePicker from "./DateRangePicker";
import "./Filter2.css";

const getTodayLabel = () => {
  const today = new Date();
  const y = today.getFullYear();
  const m = String(today.getMonth() + 1).padStart(2, "0");
  const d = String(today.getDate()).padStart(2, "0");
  return `${y}-${m}-${d} ~ ${y}-${m}-${d}`;
};

const toOption = (item) => {
  if (typeof item === "string") return { value: item, label: item };
  if (typeof item === "object" && item !== null)
    return {
      value: item.value ?? item.label ?? String(item),
      label: item.label ?? item.value ?? String(item),
    };

  return { value: String(item), label: String(item) };
};

export default function Filter2({
  machineList = [],
  itemList = [],
  lotList = [],
  // trialList = [],

  onVendorChange,
  onMachineChange,
  onItemChange,
  onLotChange,
  // onTrialChange,

  onSearch,
}) {

  const [vendor, setVendor] = useState(null);
  const [machine, setMachine] = useState(null);
  const [item, setItem] = useState(null);
  const [lot, setLot] = useState(null);
  // const [trial, setTrial] = useState(null);

  const [lotSearch, setLotSearch] = useState("");
  const [showPop, setShowPop] = useState(false);

  const [dateLabel, setDateLabel] = useState(getTodayLabel());
  const [isCalOpen, setIsCalOpen] = useState(false);
  const [calendarPos, setCalendarPos] = useState({ top: 0, left: 0 });

  const dateBoxRef = useRef(null);
  const popRef = useRef(null);
  const calendarRef = useRef(null);

  const machineOptions = machineList.map(toOption);
  const itemOptions = itemList.map(toOption);
  const lotOptions = lotList.map(toOption);
  // const trialOptions = trialList.map(toOption);

  const handleOpenCalendar = () => {
    if (!dateBoxRef.current) return;
    const r = dateBoxRef.current.getBoundingClientRect();
    setCalendarPos({ top: r.bottom - 30, left: r.left - 15 });
    setIsCalOpen(true);
  };

  useEffect(() => {
    const handleOutside = (e) => {
      if (popRef.current?.contains(e.target)) return;
      if (calendarRef.current?.contains(e.target)) return;
      setShowPop(false);
      setIsCalOpen(false);
    };
    document.addEventListener("mousedown", handleOutside);
    return () => document.removeEventListener("mousedown", handleOutside);
  }, []);

  const handleVendor = (v) => {
    setVendor(v);

    setMachine(null);
    setItem(null);
    setLot(null);
    // setTrial(null);

    onVendorChange?.(v);
  };


  const handleMachineSelect = (val) => {
    setMachine(val);

    setItem(null);
    setLot(null);
    // setTrial(null);

    onMachineChange?.(val);
  };


  const handleItemSelect = (val) => {
    setItem(val);

    setLot(null);
    // setTrial(null);

    onItemChange?.(val);
  };


  const handleLotSelect = (val) => {
    setLot(val);
    onLotChange?.(val);  
  };


  // const handleTrialSelect = (val) => {
  //   setTrial(val);
  //   onTrialChange?.(val);
  // };

  return (
    <>
      <div className="filter-line">

        <fieldset className="vendor-box">
          <legend>Maker</legend>

          <div className="vendor-options">
            <label>
              <input
                type="radio"
                name="vendor"
                checked={vendor === "ATI"}
                onChange={() => handleVendor("ATI")}
              />
              ATI
            </label>

            <label>
              <input type="radio" name="vendor" disabled />
              PIXEL
            </label>
          </div>
        </fieldset>

        <Select
          placeholder="Machine"
          menuPortalTarget={document.body}
          value={machine}
          options={machineOptions}
          styles={glassSelect}
          isDisabled={!vendor}
          onChange={handleMachineSelect}
        />

        <Select
          placeholder="Item"
          menuPortalTarget={document.body}
          value={item}
          options={itemOptions}
          styles={glassSelect}
          isDisabled={!machine}
          onChange={handleItemSelect}
        />

        <Select
          placeholder="Lot"
          menuPortalTarget={document.body}
          value={lot}
          options={lotOptions}
          styles={glassSelect}
          isDisabled={!item}
          onChange={handleLotSelect}
        />


      
          {/* <Select
            placeholder="Sorter"
            menuPortalTarget={document.body}
            value={trial}
            options={trialOptions}
            styles={glassSelect}
            isDisabled={!lot}
            onChange={handleTrialSelect}
          /> */}


        <div className="search-pop-wrap">
          <BiSearch
            className={`main-search-icon ${vendor ? "enabled" : "disabled"}`}
            onClick={() => {
              if (!vendor) return;

              setItem(null);
              setLot(null);
              // setTrial(null);
              setLotSearch("");
              setDateLabel(getTodayLabel());

              setShowPop((p) => !p);
            }}
          />

          {showPop && (
            <div className="advanced-pop" ref={popRef}>
              <div className="date-box" ref={dateBoxRef} onClick={handleOpenCalendar}>
                <input type="text" readOnly value={dateLabel} />
                <BiCalendar />
              </div>

              <input
                className="lot-search-input"
                type="text"
                placeholder="Lot"
                value={lotSearch}
                onChange={(e) => setLotSearch(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    const [s, e] = dateLabel.split(" ~ ");
                    const startDate = new Date(s).toISOString().slice(0, 10)
                    const endDate = new Date(e).toISOString().slice(0, 10)
                    onSearch?.({ startDate, endDate, lotSearch });
                    
                  }

                }}
              />

              <button
                className="search-btn"
                disabled={!vendor}
                onClick={() => {
                  const [s, e] = dateLabel.split(" ~ ");
                  const startDate = new Date(s).toISOString().slice(0, 10)
                  const endDate = new Date(e).toISOString().slice(0, 10)
                  onSearch?.({ startDate, endDate, lotSearch});
                }}
              >
                <BiSearch />
              </button>
            </div>
          )}
        </div>
      </div>

      {isCalOpen &&
        createPortal(
          <div
            className="calendar-portal-wrap"
            ref={calendarRef}
            style={{ top: calendarPos.top, left: calendarPos.left }}
          >
            <DateRangePicker
              onClose={() => setIsCalOpen(false)}
              onChange={({ label }) => {
                setDateLabel(label);
              }}
            />
          </div>,
          document.body
        )}
    </>
  );
}


const glassSelect = {
  menuPortal: (base) => ({ ...base, zIndex: 100001 }),

  control: (base, state) => ({
    ...base,
    backgroundColor: state.isDisabled
      ? "rgba(210,210,210,0.45)"
      : "rgba(240,240,240,0.75)",

    borderColor: state.isFocused
      ? "rgba(120,120,120,0.9)"
      : "rgba(185,185,185,0.7)",

    display: "flex",
    alignItems: "center",
    color: "var(--text-dark)",
    backdropFilter: "blur(8px)",
    borderRadius: "12px",
    minWidth: "150px",
    height: "40px",
    marginTop: "10px",
    minHeight: "33px",
    fontSize: "0.9rem",
    padding: "0 2px",
    boxShadow: "none",
    transition: "all 0.2s ease",
    opacity: state.isDisabled ? 0.6 : 1,
    cursor: state.isDisabled ? "not-allowed" : "pointer",
  }),

  menu: (base) => ({
    ...base,
    backgroundColor: "var(--white)",
    border: "1px solid rgba(0,0,0,0.08)",
    color: "var(--text-dark)",
    fontSize: "0.8rem",
  }),

  option: (base, state) => ({
    ...base,
    backgroundColor: state.isFocused
      ? "rgba(220,220,220,0.9)"
      : "transparent",
    color: "var(--text-dark)",
    cursor: "pointer",
    padding: "4px 8px",
  }),

  singleValue: (base) => ({
    ...base,
    color: "var(--text-dark)",
    fontWeight: 400,
  }),

  input: (base) => ({
    ...base,
    color: "var(--text-dark)",
  }),

  placeholder: (base) => ({
    ...base,
    color: "rgba(0,0,0,0.55)",
  }),

  dropdownIndicator: (base, state) => ({
    ...base,
    color: state.isDisabled ? "rgba(120,120,120,0.5)" : "var(--primary)",
  }),
};
