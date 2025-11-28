import React from "react";
import "./SummaryTable.css";

export default function SummaryTable({ summary, selectedSection, onSectionChange }) {
  if (!summary) return null;

  const sectionOrder = [
    { key: "rate", title: "Rate (Point)", rows: summary.resultSummary, headers: ["Type", "Count", "Rate (전체 %)"], keyName: "type" },
    { key: "unitRate", title: "Rate (Unit)", rows: summary.resultUnitSummary, headers: ["Type", "Count", "Rate (전체 %)"], keyName: "type" },
    { key: "defect", title: "Defect Top 10", rows: summary.defectTop10, headers: ["Defect", "Count", "Rate (전체 %)"], keyName: "value" },
    { key: "unkResult", title: "UNK Result Distribution", rows: summary.unkResultDistribution, headers: ["Result", "Count", "Rate (UNK %)"], keyName: "value" },
    { key: "unkDefect", title: "UNK Defect Top 10", rows: summary.unkDefectTop10, headers: ["Defect", "Count", "Rate (UNK %)"], keyName: "value" },
    { key: "ngDefect", title: "NG Defect Top 10", rows: summary.ngDefectTop10, headers: ["Defect", "Count", "Rate (NG %)"], keyName: "value" },
    { key: "gt", title: "GT Summary", rows: summary.gtSummary, headers: ["Type", "Count", "Rate/PPM"], keyName: "desc" },
  ];

  const sortedSections = [
    ...sectionOrder.filter((s) => s.key === selectedSection),
    ...sectionOrder.filter((s) => s.key !== selectedSection),
  ];

  return (
    <div className="summary-table-container">
      {sortedSections.map((sec) => (
        <div key={sec.key}>
          <h3
            className="summary-section-title"
            onClick={() => onSectionChange(sec.key)}   
            style={{ cursor: "pointer" }}
          >
            {sec.title}
          </h3>

          <SummaryTableBlock
            rows={sec.rows}
            headers={sec.headers}
            keyName={sec.keyName}
          />
        </div>
      ))}
    </div>
  );
}

function SummaryTableBlock({ title, rows, headers, keyName, onSectionChange, sectionKey }) {
  return (
    <div className="summary-block">
      
      <h3
        className="summary-section-title clickable"
        onClick={() => onSectionChange(sectionKey)}
      >
        {title}
      </h3>

      <table className="summary-table">
        <thead>
          <tr>
          <th className="col-name">{headers[0]}</th>
          <th className="col-count">{headers[1]}</th>
          <th className="col-rate">{headers[2]}</th>
        </tr>
        </thead>
        <tbody>
            {rows.map((row) => (
            <tr
              key={row[keyName]}
              className={row[keyName] === "TOTAL" ? "summary-total-row" : ""}
            >
                <td className="col-name">{row[keyName]}</td>
                <td className="col-count">{row.count}</td>
                <td className="col-rate">{row.rate}</td>
            </tr>
            ))}
      </tbody>
      </table>
    </div>
  );
}
