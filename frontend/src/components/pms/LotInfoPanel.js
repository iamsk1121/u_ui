import React from "react";
import Select, { components } from "react-select";

export default function LotInfoPanel({
  lotInfo,
  sorterOptions,
  selectedSorters,
  handleSorterChange,
}) {

  const sorterSelectStyle = {
    control: (base) => ({
      ...base,
      background: "var(--card-light)",
      backdropFilter: "blur(8px)",
      borderRadius: "8px",
      minHeight: "36px",
      border: "none",
      fontSize: "0.95rem",
      boxShadow: "none",
      cursor: "pointer",
      "&:hover": { border: "none" },
      padding: 0,
      margin: 0
    }),
    valueContainer: (base) => ({ ...base, padding: 0 }),
    multiValueLabel: (base) => ({
      ...base,
      fontSize: "0.95rem",
      fontWeight: 700,
      background: "tranparent",
      padding: 0,
      margin: 0,
    }),
    menu: (base) => ({
      ...base,
      zIndex: 9999,
      maxHeight: "300px",
      overflowY: "auto",
      fontSize: "0.85rem",
    }),
    menuList: (base) => ({ ...base, overflowY: "auto" }),
  };

  const CustomMenuList = (props) => (
    <components.MenuList {...props} onWheel={(e) => e.stopPropagation()}>
      {props.children}
    </components.MenuList>
  );

  const CustomMultiValue = (props) => {
    const values = props.selectProps.value;
    const hasAll = values.some((v) => v.value === "ALL");

    if (hasAll) {
      if (props.data.value !== "ALL") return null;
      return <components.MultiValue {...props} />;
    }

    if (values.length === 1) return <components.MultiValue {...props} />;

    const index = values.findIndex((v) => v.value === props.data.value);
    if (index === 0) {
      return (
        <components.MultiValue {...props}>
          <span>{values.length} selected</span>
        </components.MultiValue>
      );
    }
    return null;
  };

  const CheckboxOption = (props) => {
    if (props.data.type === "divider") return <div className="sorter-divider" />;
    return (
      <components.Option {...props}>
        <label className="checkbox-option">
          <input type="checkbox" checked={props.isSelected} readOnly />
          <span>{props.label}</span>
        </label>
      </components.Option>
    );
  };

  return (
    <div className="lot-info-wrap">
      <h3 className="lot-info-title">LOT Information</h3>

      <div className="lot-horizontal-group">
        <fieldset className="lot-fieldset">
          <legend>Maker</legend>
          <span className="lot-value">{lotInfo.vendor || "ATI"}</span>
        </fieldset>

        <fieldset className="lot-fieldset">
          <legend>Machine</legend>
          <span className="lot-value">{lotInfo.machine}</span>
        </fieldset>
      </div>

      <div className="lot-horizontal-group">
        <fieldset className="lot-fieldset">
          <legend>Customer</legend>
          <span className="lot-value">{lotInfo.customer}</span>
        </fieldset>

        <fieldset className="lot-fieldset">
          <legend>Version</legend>
          <span className="lot-value">{lotInfo.version}</span>
        </fieldset>
      </div>

      <fieldset className="lot-fieldset">
        <legend>Item</legend>
        <span className="lot-value">{lotInfo.itemcode}</span>
      </fieldset>

      <fieldset className="lot-fieldset">
        <legend>Lot No</legend>
        <span className="lot-value">{lotInfo.lot}</span>
      </fieldset>

      <fieldset className="lot-fieldset">
        <legend>Date</legend>
        <span className="lot-value">{lotInfo.ai_date_time}</span>
      </fieldset>

      <fieldset className="lot-fieldset sorter-fieldset">
        <legend>Sorter</legend>
        <Select
          menuPlacement="auto"
          menuPosition="fixed"
          options={sorterOptions}
          isMulti
          value={selectedSorters}
          onChange={handleSorterChange}
          components={{
            Option: CheckboxOption,
            MultiValue: CustomMultiValue,
            MultiValueRemove: () => null,
            MenuList: CustomMenuList,
          }}
          menuPortalTarget={document.body}
          closeMenuOnSelect={false}
          hideSelectedOptions={false}
          styles={sorterSelectStyle}
        />
      </fieldset>
    </div>
  );
}
