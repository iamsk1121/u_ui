import React, { useState, useRef, useEffect} from "react";
import { useParams } from "react-router-dom";
import { BiImage, BiGridHorizontal, BiListUl, BiRefresh } from "react-icons/bi";

import Pagination from "../components/common/Pagination";

import { fetchPmsDetailHeader, fetchSummary, fetchDetailSorter, fetchPmsData, fetchUniqueValues } from "../api/pmsApi";

import LotInfoPanel from "../components/pms/LotInfoPanel";
// import FloatingHeatmap from "../components/pms/FloatingHeatmap";

import LoadingSpinner from "../components/common/LoadingSpinner";
import ImageGallery from "../components/ImageGallery";
import AnalysisChart from "../components/AnalysisChart";
import SummaryTable from "../components/SummaryTable";
import SummaryChart from "../components/SummaryChart";
import ImageModal from "../components/ImageModal";

import ExcelTable from "../components/ExcelTable";

import "./PmsDetail.css";

export default function PmsDetail() {
  const { testId } = useParams();

  const [loading, setLoading] = useState(true);

  const [summarySelected, setSummarySelected] = useState("rate");
  const [selectedRow, setSelectedRow] = useState(null);

  const [activeIcon, setActiveIcon] = useState("table");
  const [activeView, setActiveView] = useState("table");

  const [showHeatmap, setShowHeatmap] = useState(false);
  const heatmapIconRef = useRef(null);

  const [lotInfo, setLotInfo] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  
  const [rows, setRows] = useState([]);
  const [totalCount, setTotalCount] = useState(0);

  const [sorterOptions, setSorterOptions] = useState([]);
  const [selectedSorters, setSelectedSorters] = useState([]);

  const [filtersState, setFiltersState] = useState({});
  const [uniqueValues, setUniqueValues] = useState({});

  const [selectedViewOption, setSelectedViewOption] = useState("summary");
  const [showListFilter, setShowListFilter] = useState(true);
  const [showImageFilter, setShowImageFilter] = useState(false);

  const [sortConfig, setSortConfig] = useState({
    field: null,     
    direction: null,  
  });
  
  

  const sorterValues = selectedSorters.map(s => s.value).filter(v => v !== "ALL");

  const debounceRef = useRef(null);


  const [page, setPage] = useState(1);
  const pageSize = 100;

  const handleRowClick = (row) => setSelectedRow(row);

  const sortable_columns = ["afvi_ai_gv", "afvi_ai_longest"];

  const columnsToShow = [
    "strip_id",
    "defect_code",
    "afvi_ai_keyin",
    "afvi_ai_defect",
    'afvi_false_defect',
    'afvi_clf_defect',
    'afvi_ai_longest',
    'afvi_ai_gv',
    "ivs_keyin1",
    "image_path",

  ];

  const filterableColumns = [
    "strip_id",
    "afvi_ai_keyin",
    'afvi_false_defect',
    "afvi_ai_defect",
    "defect_code",
    "ivs_keyin1",
    'afvi_clf_defect',
  ];

  const mapViewToMode = (view) => {
    switch (view) {
      case "raw_unit": return "unit";
      case "underkill": return "underkill";
      case "overkill": return "overkill";
      default: return "point";
    }
  };

  async function fetchPageData(p) {
    if (selectedViewOption === "summary") return;

    setLoading(true);  

    try {
      const mode = mapViewToMode(selectedViewOption);

      const res = await fetchPmsData(testId, {
        mode,
        page: p,
        size: pageSize,
        sorters: sorterValues,
        filters: filtersState,
        ...(sortConfig.field && { sortConfig })
      });

      setRows(res.rows ?? []);
      setTotalCount(res.total ?? 0);
      setPage(p);

    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (selectedViewOption === "summary") return;

    if (debounceRef.current) clearTimeout(debounceRef.current);

    debounceRef.current = setTimeout(async () => {
      setPage(1);
      await fetchPageData(1);
    }, 300);

    return () => clearTimeout(debounceRef.current);

  }, [filtersState, sorterValues.join(","), selectedViewOption]);

  

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);

      const header = await fetchPmsDetailHeader(testId);
      const summary = await fetchSummary(testId, []);
      const sorterList = await fetchDetailSorter(testId);

      setLotInfo(header);
      setSummaryData(summary);

      setSorterOptions([{ value: "ALL", label: "All" }, { type: "divider" }, ...sorterList]);
      setSelectedSorters([{ value: "ALL", label: "All" }, ...sorterList]);

      setLoading(false);
    }
    loadDetail();
  }, []);

  useEffect(() => {
 
    async function refreshSummary() {
      const summary = await fetchSummary(testId, sorterValues);
      setSummaryData(summary);
    }
    refreshSummary();
  }, [selectedSorters]);

  const applySorterFilter = async (values) => {
    setFiltersState({});
    setSortConfig({ field: null, direction: null });
    setPage(1);

    const uv = await fetchUniqueValues(testId, mapViewToMode(selectedViewOption), values);
    setUniqueValues(uv);
  };

  const firstLoadRef = useRef(true);
  
  useEffect(() => {
    if (firstLoadRef.current) {
      firstLoadRef.current = false;
      return;
    }

    if (selectedViewOption === "summary") return;
    if (selectedSorters.length === 0) return;
    applySorterFilter(sorterValues);
  }, [sorterValues.join(","), selectedViewOption]);

  useEffect(() => {
    if (activeView === "image") {
      setActiveView("table");
    }
  }, [selectedViewOption]);

  useEffect(() => {
    if (selectedViewOption === "summary") return;

    if (page !== 1) setPage(1);
    else fetchPageData(1);
  }, [sortConfig]);


  const handleSorterChange = (vals) => {
    console.log(vals)
    if (!vals || vals.length === 0) {
      setSelectedSorters([]);
      return;
    }

    const prevHasALL = selectedSorters.some((v) => v.value === "ALL");
    const nowHasALL = vals.some((v) => v.value === "ALL");

    const realSorters = sorterOptions.filter(o => o.value && o.value !== "ALL");

    if (prevHasALL && !nowHasALL) {
      setSelectedSorters([]);
      return;
    }

    if (nowHasALL && !prevHasALL) {
      setSelectedSorters([{ value: "ALL", label: "All" }, ...realSorters]);
      return;
    }

    const onlyReal = vals.filter(v => v.value !== "ALL");

    if (onlyReal.length === realSorters.length) {
      setSelectedSorters([{ value: "ALL", label: "All" }, ...realSorters]);
      return;
    }

    setSelectedSorters(onlyReal);
  };


  const openGallery = () => {
    setActiveView("image");
  };

  const returnTable = () => {
    setActiveIcon("table");
    setActiveView("table");
  };

  const refreshTable = async () => {  
    setFiltersState({});
    setSortConfig({ field: null, direction: null });
    setPage(1);
    await fetchPageData(1);
  };

  const handleSortToggle = (field) => {
      setSortConfig(prev => {
        if (prev.field !== field) return { field, direction: "asc" };
  
        if (prev.direction === "asc") return { field, direction: "desc" };
  
        return { field: null, direction: null }; 
      });
    };

  if (!lotInfo || !summaryData) {
    return <LoadingSpinner text="Loading" />;
  }

  return (
    <div className="pms-detail-layout">
      
      <div className="pms-left-panel">
        <LotInfoPanel
          lotInfo={lotInfo}
          sorterOptions={sorterOptions}
          selectedSorters={selectedSorters}
          handleSorterChange={handleSorterChange}
        />

        <div ref={heatmapIconRef} className="view-icon-row">
          <div className={`view-icon ${activeIcon === "table" ? "active" : ""}`}  onClick={returnTable}>
            <BiListUl size={27} />
          </div>

          <div className="view-icon disabled" >
            <BiImage size={27} />
          </div>

          <div className="view-icon disabled" >
            <BiGridHorizontal size={27} />
          </div>
        </div>

        {showListFilter && (
          <div className="inline-filter-box">
            <label><input type="checkbox" checked={selectedViewOption === "summary"} onChange={() => setSelectedViewOption("summary")} /> Summary</label>
            <label><input type="checkbox" checked={selectedViewOption === "raw_point"} onChange={() => setSelectedViewOption("raw_point")} /> Rawdata (Point)</label>
            <label><input type="checkbox" checked={selectedViewOption === "raw_unit"} onChange={() => setSelectedViewOption("raw_unit")} /> Rawdata (Unit)</label>
            <label><input type="checkbox" checked={selectedViewOption === "underkill"} onChange={() => setSelectedViewOption("underkill")} /> Underkill (Unit)</label>
            <label><input type="checkbox" checked={selectedViewOption === "overkill"} onChange={() => setSelectedViewOption("overkill")} /> Overkill (Unit)</label>
          </div>
        )}

        {/* {showHeatmap && (
          <FloatingHeatmap heatmapIconRef={heatmapIconRef} />
        )} */}
      </div>

      <div className="pms-right-panel">

        {activeView === "table" && (
          <>
            {selectedViewOption === "summary" && (
              <div className="summary-split-layout">
                <div className="summary-left-box">
                  <SummaryTable summary={summaryData} selectedSection={summarySelected} onSectionChange={setSummarySelected} />
                </div>
                <div className="summary-right-box">
                <SummaryChart summary={summaryData} selectedSection={summarySelected} onSectionChange={setSummarySelected} />
                </div>
              </div>
            )}

            {selectedViewOption !== "summary" && (
              <>
                <div className="table-topbar">
                  <div className="row-count">Rows: {totalCount.toLocaleString()}</div>

                  <div className="topbar-icons">
                    <BiRefresh size={23} className="icon-btn" onClick={refreshTable} />
                    <BiImage size={23} className="icon-btn" onClick={openGallery} />
                  </div>
                </div>
                <div className="excel-scroll-container">
                  <ExcelTable
                    tableData={rows}
                    columnsToShow={columnsToShow}
                    filterableColumns={filterableColumns}
                    onRowClick={handleRowClick}
                    loading={loading}
                    uniqueValues={uniqueValues}
                    filtersState={filtersState}
                    setFiltersState={setFiltersState}
                    sortConfig={sortConfig}
                    setSortConfig={setSortConfig}
                    sortable_columns ={sortable_columns}
                    sortToggle = {handleSortToggle}
                  />
                  <Pagination
                  page={page}
                  totalCount={totalCount}
                  pageSize={100}
                  onChange={(p) => {
                    setPage(p);
                    fetchPageData(p);
                  }}
                />
                </div>

                {selectedRow && <ImageModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
              </>
            )}
          </>
        )}

        {activeView === "image" && (
          <>
            <div className="table-topbar">
              <div className="row-count">Rows: {totalCount.toLocaleString()}</div>
              <div className="topbar-icons">
                <BiListUl size={23} className="icon-btn" onClick={returnTable} />
              </div>
            </div>
            <div className="excel-scroll-container">
              <ImageGallery
                rows={rows}
                onClick={(row) => setSelectedRow(row)}
              />

              <Pagination
                page={page}
                totalCount={totalCount}
                pageSize={100}
                onChange={(p) => {
                  setPage(p);
                  fetchPageData(p);
                }}
              />
            </div>

            {selectedRow && <ImageModal row={selectedRow} onClose={() => setSelectedRow(null)} />}
          </>
        )}

        {activeView === "chart" && <AnalysisChart />}
      </div>
    </div>
  );
}
