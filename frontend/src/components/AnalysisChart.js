import React, { useRef, useEffect, useState } from "react";
import { Chart } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import ChartDataLabels from "chartjs-plugin-datalabels";
import { fetchSummaryMulti } from "../api/pmsApi";
import LoadingSpinner from "../components/common/LoadingSpinner";

ChartJS.register(
  LineElement,
  BarElement,
  PointElement,
  CategoryScale,
  LinearScale,
  Title,
  Tooltip,
  Legend,
  ChartDataLabels
);

const rateColor = {
  ok: "#7da87a",
  unk: "#d8a15c",
  ng: "#c76a6a",
};


const unitColor = {
  ok: "#a7c8a3",
  unk: "#e8c48f",
  ng: "#dfa3a3",
};

const overkillColor = "#9b9fa8";


const underkillColor = "#b59bc9";

const faded = (hex) => hex + "80";

export default function AnalysisChart({
  ids = [],
  analysisMode = "lot",
  analysisOptions,
  singleGraphType,
}) {
  const [dataList, setDataList] = useState([]);
  const chartRef = useRef(null);

  useEffect(() => {
    if (!ids || ids.length === 0) return;

    const fetchData = async () => {
      const res = await fetchSummaryMulti(ids);
      if (res) setDataList(Object.values(res));
    };
    fetchData();
  }, [ids]);

  if (!dataList.length) {
    return (
      <LoadingSpinner/>
    );
  }


  const keyFn = (x) => {
    switch (analysisMode) {
      case "version":
        return x.version;
      case "customer":
        return x.customer;
      case "itemcode":
        return x.itemcode;
      default:
        return x.lot;
    }
  };


  const pickRates = (x) => ({
    ok: x.ok_rate * 100,
    ng: x.ng_rate * 100,
    unk: x.unk_rate * 100,

    ok_unit: x.unit_ok_rate * 100,
    ng_unit: x.unit_ng_rate * 100,
    unk_unit: x.unit_unk_rate * 100,

    over: x.overk_rate * 100,
    under: x.underk_ppm,

    ok_cnt: x.ok_cnt,
    ng_cnt: x.ng_cnt,
    unk_cnt: x.unk_cnt,
    overk_cnt: x.overk_cnt,
    underk_cnt: x.underk_cnt,
  });

 
  const groups = {};
  dataList.forEach((x) => {
    const k = keyFn(x);
    if (!groups[k]) groups[k] = [];
    groups[k].push(pickRates(x));
  });

 
  const groupedData = Object.entries(groups).map(([key, arr]) => {
    const avg = (f) => arr.reduce((a, b) => a + (b[f] ?? 0), 0) / arr.length;
    const sum = (f) => arr.reduce((a, b) => a + (b[f] ?? 0), 0);

    return {
      key,
      ok: avg("ok"),
      ng: avg("ng"),
      unk: avg("unk"),
      ok_unit: avg("ok_unit"),
      ng_unit: avg("ng_unit"),
      unk_unit: avg("unk_unit"),
      over: avg("over"),
      under: avg("under"),

      ok_cnt: sum("ok_cnt"),
      ng_cnt: sum("ng_cnt"),
      unk_cnt: sum("unk_cnt"),
      overk_cnt: sum("overk_cnt"),
      underk_cnt: sum("underk_cnt"),
    };
  });


  const selected = Object.keys(analysisOptions).filter((k) => analysisOptions[k]);
  const isSingle = selected.length === 1;
  const isDual = selected.length === 2;

 
  const graphTypes = {};
  if (isDual) {
    graphTypes[selected[0]] = "bar";
    graphTypes[selected[1]] = "line";
  }

 
  const getType = (key) => {
    if (isSingle) return singleGraphType;
    if (isDual) return graphTypes[key];
    return "bar";
  };

 
  const hasRate = analysisOptions.rate || analysisOptions.rate_unit;
  const hasOver = analysisOptions.overkill;
  const hasUnder = analysisOptions.underkill;

  const scales = {};

  if (hasRate) {
    scales.percentage = {
      type: "linear",
      position: "left",
      min: 0,
      max: 100,
      title: { display: true, text: "% (Rate)" },
    };
  }

  if (hasOver) {
    scales.overkill = {
      type: "linear",
      position: !hasRate && hasUnder ? "left" : "right",
      grid: { drawOnChartArea: false },
      title: { display: true, text: "Overkill (%)" },
    };
  }

  if (hasUnder) {
    scales.ppm = {
      type: "linear",
      position: "right",
      grid: { drawOnChartArea: false },
      title: { display: true, text: "Underkill (ppm)" },
    };
  }

  const datasets = [];

  if (analysisOptions.rate) {
    const type = getType("rate");
    datasets.push(
      {
        label: "OK (%)",
        data: groupedData.map((g) => g.ok),
        backgroundColor: type === "bar" ? rateColor.ok : "transparent",
        borderColor: rateColor.ok,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      },
      {
        label: "UNK (%)",
        data: groupedData.map((g) => g.unk),
        backgroundColor: type === "bar" ? rateColor.unk : "transparent",
        borderColor: rateColor.unk,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      },
      {
        label: "NG (%)",
        data: groupedData.map((g) => g.ng),
        backgroundColor: type === "bar" ? rateColor.ng : "transparent",
        borderColor: rateColor.ng,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      }
    );
  }

  if (analysisOptions.rate_unit) {
    const type = getType("rate_unit");
    const fade = analysisOptions.rate;

    datasets.push(
      {
        label: "Unit OK (%)",
        data: groupedData.map((g) => g.ok_unit),
        backgroundColor: type === "bar" ? unitColor.ok : "transparent",
        borderColor:  unitColor.ok,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      },
      {
        label: "Unit UNK (%)",
        data: groupedData.map((g) => g.unk_unit),
        backgroundColor: type === "bar" ? unitColor.unk: "transparent",
        borderColor: unitColor.unk,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      },
      {
        label: "Unit NG (%)",
        data: groupedData.map((g) => g.ng_unit),
        backgroundColor: type === "bar" ? unitColor.ng : "transparent",
        borderColor: unitColor.ng,
        borderWidth: 2,
        maxBarThickness: 40,
        yAxisID: "percentage",
        type,
        order: type === "line" ? 0 : 1,
      }
    );
  }

  if (analysisOptions.overkill) {
    const type = getType("overkill");
    datasets.push({
      label: "OVERKILL (%)",
      data: groupedData.map((g) => g.over),
      backgroundColor: type === "bar" ? overkillColor : "transparent",
      borderColor: overkillColor,
      borderWidth: 2,
      maxBarThickness: 40,
      yAxisID: hasRate ? "overkill" : hasUnder ? "percentage" : "overkill",
      type,
      order: type === "line" ? 0 : 1,
    });
  }

  if (analysisOptions.underkill) {
    const type = getType("underkill");
    datasets.push({
      label: "UNDERKILL (ppm)",
      data: groupedData.map((g) => g.under),
      backgroundColor: type === "bar" ? underkillColor : "transparent",
      borderColor: underkillColor,
      borderWidth: 2,
      maxBarThickness: 40,
      yAxisID: "ppm",
      type,
      order: type === "line" ? 0 : 1,
    });
  }

  const tooltipCallback = (c) => {
    const item = groupedData[c.dataIndex];
    const val = c.parsed.y;
    const label = c.dataset.label;
    const comma = (n) => Number(n).toLocaleString();

    if (label.includes("OK (%)"))
      return `${label}: ${val.toFixed(1)}% | CNT: ${comma(item.ok_cnt)}`;
    if (label.includes("NG (%)"))
      return `${label}: ${val.toFixed(1)}% | CNT: ${comma(item.ng_cnt)}`;
    if (label.includes("UNK (%)"))
      return `${label}: ${val.toFixed(1)}% | CNT: ${comma(item.unk_cnt)}`;

    if (label.includes("Unit"))
      return `${label}: ${val.toFixed(1)}%`;

    if (label.includes("OVERKILL"))
      return `${val.toFixed(1)}% | CNT: ${comma(item.overk_cnt)}`;

    if (label.includes("UNDERKILL"))
      return `${comma(val)} ppm | CNT: ${comma(item.underk_cnt)}`;

    return val;
  };

  const chartOptions = {
    maintainAspectRatio: false,
    responsive: true,
    
    plugins: {
      legend: { position: "bottom" },
      tooltip: { callbacks: { label: tooltipCallback } },
      datalabels: {
        anchor: "end",
        align: "top",
        formatter: (v) => (v?.toFixed ? v.toFixed(1) : v),
      },
    },
    scales,
  };

  return (
    <div className="chart-container">
      <Chart ref={chartRef} type="bar" data={{ labels: groupedData.map((g) => g.key), datasets }} options={chartOptions} redraw={true} />
    </div>
  );
}
