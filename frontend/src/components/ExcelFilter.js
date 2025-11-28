import React, { useState, useRef, useEffect } from "react";
import { BiSolidFilterAlt } from "react-icons/bi";
import { createPortal } from "react-dom";

export default function ExcelFilter({ column, table }) {

  


  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");

  const buttonRef = useRef(null);
  const dropdownRef = useRef(null);

  const { uniqueValues, filtersState, setFiltersState } = table.options.meta;
  const colId = column.id;

  const allValues = uniqueValues[colId] ?? [];
  const selectedValues = filtersState[colId] ?? allValues;

  const cleanedSelected = selectedValues.filter((v) => allValues.includes(v));

  useEffect(() => {
    if (cleanedSelected.length !== selectedValues.length) {
      setFiltersState((prev) => ({
        ...prev,
        [colId]: cleanedSelected.length === allValues.length ? undefined : cleanedSelected,
      }));
    }
  }, [uniqueValues[colId]]);

  const searchFiltered = allValues.filter((v) =>
    v.toLowerCase().includes(search.toLowerCase())
  );

  const isAllSelected =
    cleanedSelected.length > 0 &&
    searchFiltered.every((v) => cleanedSelected.includes(v));

  const toggleValue = (val) => {
    let next;
    if (cleanedSelected.includes(val)) {
      next = cleanedSelected.filter((x) => x !== val);
    } else {
      next = [...cleanedSelected, val];
    }

    setFiltersState((prev) => ({
      ...prev,
      [colId]: next.length === allValues.length ? undefined : next,
    }));
  };

  const toggleAll = () => {
    setFiltersState((prev) => ({
      ...prev,
      [colId]: isAllSelected ? [] : allValues,
    }));
  };

  const isFiltered =
    cleanedSelected.length > 0 && cleanedSelected.length < allValues.length;

  const [pos, setPos] = useState({ top: 0, left: 0 });

  const updatePosition = () => {
    if (!buttonRef.current || !open) return;

    const btnRect = buttonRef.current.getBoundingClientRect();
    const dropdownWidth = dropdownRef.current?.offsetWidth ?? 160;
    const dropdownHeight = dropdownRef.current?.offsetHeight ?? 200;

    const wrapper = document.querySelector(".excel-wrapper");
    const wrapRect = wrapper.getBoundingClientRect();

    let left = btnRect.left + window.scrollX - dropdownWidth + 20;
    let top = btnRect.bottom + window.scrollY + 4;

    if (left + dropdownWidth > wrapRect.right + window.scrollX)
      left = wrapRect.right + window.scrollX - dropdownWidth - 8;

    if (left < wrapRect.left + window.scrollX)
      left = btnRect.left + window.scrollX - 85;

    if (top + dropdownHeight > wrapRect.bottom + window.scrollY)
      top = btnRect.top + window.scrollY - dropdownHeight - 4;

    if (top < wrapRect.top + window.scrollY)
      top = btnRect.bottom + window.scrollY + 4;

    setPos({ top, left });
  };

  useEffect(updatePosition, [open]);

  useEffect(() => {
    window.addEventListener("scroll", updatePosition, true);
    window.addEventListener("resize", updatePosition);
    return () => {
      window.removeEventListener("scroll", updatePosition, true);
      window.removeEventListener("resize", updatePosition);
    };
  }, []);

  useEffect(() => {
    const handler = (e) => {
      if (
        dropdownRef.current?.contains(e.target) ||
        buttonRef.current?.contains(e.target)
      )
        return;
      setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  const dropdownDOM = open ? (
    <div
      ref={dropdownRef}
      style={{
        position: "absolute",
        top: pos.top,
        left: pos.left,
        background: "white",
        border: "1px solid #ccc",
        minWidth: "170px",
        padding: "8px",
        borderRadius: "6px",
        boxShadow: "0 3px 8px rgba(0,0,0,0.15)",
        zIndex: 99999999,
      }}
    >
      <input
        className="excel-filter-search"
        placeholder="Search..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        style={{
          width: "100%",
          marginBottom: "6px",
          padding: "4px 6px",
          border: "1px solid #ddd",
          borderRadius: "4px",
        }}
      />

      <label style={{ display: "flex", gap: "8px", margin: "4px 0" }}>
        <input type="checkbox" checked={isAllSelected} onChange={toggleAll} />
        <b>Select All</b>
      </label>

      <div style={{ borderBottom: "1px solid #eee", margin: "6px 0" }} />

      <div style={{ maxHeight: "180px", overflowY: "auto" }}>
        {searchFiltered.map((v) => (
          <label
            key={v}
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              padding: "4px 0",
              cursor: "pointer",
            }}
          >
            <input
              type="checkbox"
              checked={cleanedSelected.includes(v)}
              onChange={() => toggleValue(v)}
            />
            {v}
          </label>
        ))}
      </div>
    </div>
  ) : null;

  return (
    <>
      <span
        ref={buttonRef}
        className={`excel-filter-icon ${isFiltered ? "filtered" : ""}`}
        onClick={() => setOpen(!open)}
        style={{ cursor: "pointer" }}
      >
        <BiSolidFilterAlt />
      </span>
      {createPortal(dropdownDOM, document.body)}
    </>
  );
}
