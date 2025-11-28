import React, { useState, useEffect, useMemo } from "react";
import { Bar, Doughnut } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement, 
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import "./SummaryChart.css";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend, ChartDataLabels, ArcElement);

export default function SummaryChart({ summary, selectedSection, onSectionChange}) {
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [detailList, setDetailList] = useState([]);

  useEffect(() => {
    setSelectedCategory(null);
    setDetailList([]);
  }, [selectedSection]);

  function handleCategoryClick(label) {
    setSelectedCategory(label);
    setDetailList(summary.unkDetailMap?.[label] ?? []);
  }




  const selected = selectedSection;

  const chartDataMap = {
    rate: summary.resultSummary,
    unitRate: summary.resultUnitSummary,
    defect: summary.defectTop10,
    unkResult: summary.unkResultDistribution,
    unkDefect: summary.unkDefectTop10,
    ngDefect: summary.ngDefectTop10,
    gt: summary.gtSummary,
  };

  const raw = (chartDataMap[selected] ?? []).filter(d =>d.type !== "TOTAL" && d.value !== "TOTAL" && d.desc !== "TOTAL");

  const palette = ["#7da87a", "#d8a15c", "#c76a6a", "#8aa1b1", "#b59bc9", "#a7c4d6", "#b7a29b ","#c5b18a","#b88f8f","#c8cccf"];

  const resultColors = {
    OK: "#7da87a",
    UNK: "#d8a15c",
    NG: "#c76a6a",
  };


  const labels = (() => {
    if (selected === "rate") return raw.map((d) => d.type);
    if (selected === "unitRate") return raw.map((d) => d.type);
    if (selected === "gt") return raw.map((d) => d.desc); 
    return raw.map((d) => d.value);
    })();


  const count = raw.map((d) => d.count);
  const rateText = raw.map((d) => d.rate);

  const rateValue = raw.map((d) =>
    parseFloat(String(d.rate).replace("%", ""))
  );

  const barColors =
    selected === "rate"
      ? raw.map((d) => resultColors[d.type] || palette[0])
      : raw.map((_, i) => palette[i % palette.length]);

  const data = useMemo(() => ({
    labels,
    datasets: [
      {
        label: "Rate (%)",
        data: rateValue,
        backgroundColor: barColors,
        borderRadius: 2,
        datalabels: {
          anchor: "end",
          align: "end",
          color: "#333",
          formatter: (_, ctx) => rateText[ctx.dataIndex],
          font: { size: 12, weight: "bold" },
          offset: -4,
        },
      },
    ],
  }), [labels, rateValue, barColors, rateText]);

  const options = useMemo(() => ({
    responsive: true,
    maintainAspectRatio: false,

    layout: {
      padding: {
        top: 25,
        bottom: 0,
        left: 0,
        right: 0,
      },
    },

    onClick: (evt, elements) => {
      if (!elements.length) return;

      const index = elements[0].index;
      const label = labels[index];

      if (selected === "unkResult") {
        handleCategoryClick(label);
      }
    },

    plugins: {
      legend: { display: false },

      tooltip: {
        callbacks: {
          label: (ctx) => {
            const c = count[ctx.dataIndex]
              .toString()
              .replace(/\B(?=(\d{3})+(?!\d))/g, ",");

            return `Count: ${c} | Rate: ${rateText[ctx.dataIndex]}`;
          },
        },
      },

      datalabels: {
        clamp: true,
        clip: false,
      },
    },

    barThickness: "flex",
    maxBarThickness: 50,
    categoryPercentage: 0.55,
    barPercentage: 0.65,

    scales: {
      y: {
        beginAtZero: true,
        ticks: {
          font: { size: 12 },
          callback: (value) => `${value}%`,
        },
      },
      x: {
        grid: { display: false },
      },
    },
  }),
  [labels, count, rateText, selected] 
);


  return (
    <>
      <div className="summary-chart-fixed">

        <div className="summary-chart-select-wrapper">
          <select
            className="summary-chart-select"
            value={selected}
            onChange={(e) => onSectionChange(e.target.value)}
          >
            <option value="rate">Rate (Point)</option>
            <option value="unitRate">Rate (Unit)</option>
            <option value="defect">Defect Top 10</option>
            <option value="unkResult">UNK Result Distribution</option>
            <option value="unkDefect">UNK Defect Top 10</option>
            <option value="ngDefect">NG Defect Top 10</option>
            <option value="gt">GT Summary</option>
          </select>
        </div>

        <div
          style={{
            height: "70%",
            width: "85%",
            marginTop: 50,
            marginLeft: "auto",
            marginRight: "auto",
          }}
        >
          <Bar data={data} options={options} />
        </div>
      </div>

      {selected === "unkResult" && selectedCategory && (
        <div className="detail-chart-container">
          <div className="detail-chart-title">
              {selectedCategory} – Defect Distribution
          </div>
          <div className="dougnut">

            <Doughnut
              data={{
                labels: detailList.map((d, i) => d.label || d.value || d.defect || `ITEM_${i}`),
                datasets: [
                  {
                    data: detailList.map((d) => d.count),
                    backgroundColor: detailList.map((_, i) =>
                      withAlpha(palette[i % palette.length], 0.5)
                    ),
                    borderWidth: 1,
                  },
                ],
              }}
              options={{
                maintainAspectRatio: false,
                events: ["mousemove", "mouseout"],
                plugins: {
                  legend: {
                    display: true,
                    position: "right",
                    align:"start",
                    labels: {
                      padding: 12,
                      boxWidth: 14,
                      boxHeight: 14,
                    },
                  },
                  tooltip: {
                    callbacks: {
                      label: (ctx) => {
                        const item = detailList[ctx.dataIndex];
                        return `${item.count}개 (${item.rate})`;
                      },
                    },
                  },
                  
                  datalabels: {
                    color: "#333",
                    formatter: (_, ctx) => detailList[ctx.dataIndex].rate,
                    font: { size: 12, weight: "bold" },
                  },
                },
              }}
            />
          </div>
          
        </div>
      )}
    </>
  );

}

function withAlpha(hex, alpha = 0.5) {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = (num >> 16) & 255;
  const g = (num >> 8) & 255;
  const b = num & 255;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}