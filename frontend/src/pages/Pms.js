import React, { useState, useEffect } from "react";
import Filter2 from "../components/Filter2";
import DataTable from "../components/DataTable";
import AnalysisChart from "../components/AnalysisChart";
import LoadingSpinner from "../components/common/LoadingSpinner";
import "./Pms.css";
import { useNavigate, useLocation } from "react-router-dom";
import { PiAlignBottomDuotone, PiMicrosoftExcelLogoFill, PiTrash } from "react-icons/pi";

import { useGlobalProgress } from "../context/GlobalProgressContext";
import { downloadZipStream } from "../api/fetchZip";
import {
  fetchPmsFilterSearch,
  fetchPmsPopupSearch,
  fetchMachines,
  fetchItems,
  fetchLots,
  
} from "../api/pmsApi";

export default function Pms() {
  const navigate = useNavigate();
  const location = useLocation();
  const isDetail = location.pathname.startsWith("/pms/detail");

  const [machineList, setMachineList] = useState([]);
  const [itemList, setItemList] = useState([]);
  const [lotList, setLotList] = useState([]);
  // const [trialList, setTrialList] = useState([]);

  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedMachine, setSelectedMachine] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedLot, setSelectedLot] = useState(null);
  // const [selectedTrial, setSelectedTrial] = useState(null);

  const [isLoading, setIsLoading] = useState(false);

  const [searched, setSearched] = useState(false);

  useEffect(() => {
    fetchMachines().then(setMachineList);
  }, []);

  useEffect(() => {
    if (!selectedLot) return;
    if (selectedVendor === "PIXEL") return;
    handleSearch();
  }, [selectedLot]);

  const [results, setResults] = useState([]);
  const [resultSelectedIds, setResultSelectedIds] = useState([]);
  const [myList, setMyList] = useState([]);
  const ids = myList.map((x) => x.id);

  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [activeTab, setActiveTab] = useState("lot");

  const [showAnalysisModal, setShowAnalysisModal] = useState(false);
  const [showExcelModal, setShowExcelModal] = useState(false);

  const [analysisOptions, setAnalysisOptions] = useState({
    rate: false,
    rate_unit: false,
    overkill: false,
    underkill: false,
  });

  const [excelOptions, setExcelOptions] = useState({
    rawdata: false,
    summary: false,
    overkill: false,
    underkill: false,
  });

  const toggleExcelOption = (key) => {
    setExcelOptions((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const { start, update, finish, cancel } = useGlobalProgress();

  const handleExcelDownload = async () => {
    setShowExcelModal(false);

    const testList = myList.map(x => ({
      id: x.id, lot: x.lot, version: x.version, itemcode: x.itemcode
    }));

    const { id, controller } = start(`Downloading ${testList.length} Lots...`);

    try {
      const blob = await downloadZipStream(testList, excelOptions, controller.signal, (v) => {
        update(id, v % 100);  
      });

      finish(id);
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `AI_RESULT_${new Date().toISOString().slice(0,10)}.zip`;
      a.click();
      URL.revokeObjectURL(url);

    } catch (err) {
      cancel(id);
    }
  };



  const [singleGraphType, setSingleGraphType] = useState("bar");

  const applySelectedIdsAfterSearch = (newResults) => {
    const preservedIds = myList
      .map((x) => x.id)
      .filter((id) => newResults.some((r) => r.id === id));

    setResultSelectedIds(preservedIds);
  };

  const handleSearchBar = ({ startDate, endDate, lotSearch }) => {
    setSearched(true);
    setIsLoading(true);
    fetchPmsPopupSearch({ startDate, endDate, text: lotSearch })
      .then((newResults) => {
        setResults(newResults);
        applySelectedIdsAfterSearch(newResults);
        setIsAnalyzing(false);
      })
      .finally(() => setIsLoading(false));
  };

  const handleSearch = () => {
    setSearched(true);
    const params = {
      machine: selectedMachine?.value,
      item: selectedItem?.value,
      lot: selectedLot?.value,
    };

    setIsLoading(true);
    fetchPmsFilterSearch(params)
      .then((newResults) => {
        setResults(newResults);
        applySelectedIdsAfterSearch(newResults);
        setIsAnalyzing(false);
      })
      .finally(() => setIsLoading(false));
  };


  const handleSelectChange = (selectedIds) => {
    
    const newlySelectedIds = selectedIds.filter(id => !myList.some(m => m.id === id));

    if (myList.length + newlySelectedIds.length > 20) {
      alert("You've reached the limit — up to 20 lots only.");
      setResultSelectedIds((prev) => [...prev]);
      return;
    }

    setResultSelectedIds(selectedIds);

    const selectedFromResults = results.filter((r) => selectedIds.includes(r.id));
    const preserved = myList.filter((item) => !results.some((r) => r.id === item.id));

    const merged = [...preserved, ...selectedFromResults].reduce((acc, cur) => {
      if (!acc.some((x) => x.id === cur.id)) acc.push(cur);
      return acc;
    }, []);

    setMyList(merged);
  };

  const handleRemoveLot = (id) => {
    setMyList((prev) => prev.filter((x) => x.id !== id));
    setResultSelectedIds((prev) => prev.filter((x) => x !== id));
  };

  const handleAnalyze = () => {
    const selectedOpts = Object.keys(analysisOptions).filter((k) => analysisOptions[k]);

    if (!selectedOpts.length) return alert("분석 옵션을 하나 이상 선택하세요.");
    if (selectedOpts.length > 2) return alert("최대 2개까지만 선택 가능합니다.");

    if (selectedOpts.length === 1) {
      setSingleGraphType("bar");
    }

    setShowAnalysisModal(false);
    setIsAnalyzing(true);
  };



  const tabs = [
    { key: "lot", label: "LOT별" },
    { key: "version", label: "Version별" },
    { key: "customer", label: "고객사별" },
    { key: "itemcode", label: "Itemcode별" },
  ];

  if (isDetail) return null;

  const selectedOpts = Object.keys(analysisOptions).filter((k) => analysisOptions[k]);
  const isSingle = selectedOpts.length === 1;

  return (
    <div className="search-analyze-page">
      {/* Filter */}
      <div className="pms-filter">
        <Filter2
          machineList={machineList}
          itemList={itemList}
          lotList={lotList}
          // trialList={trialList}
          onVendorChange={(v) => {
            setSelectedVendor(v);
            setSelectedMachine(null);
            setSelectedItem(null);
            setSelectedLot(null);
            // setSelectedTrial(null);
            setResults([]);
          }}
          onMachineChange={(m) => {
            setSelectedMachine(m);
            fetchItems(m.value).then(setItemList);
            setSelectedItem(null);
            setSelectedLot(null);
            // setSelectedTrial(null);
            setLotList([]);
            // setTrialList([]);
            setResults([]);
          }}
          onItemChange={(i) => {
            setSelectedItem(i);
            fetchLots(i.value).then(setLotList);
            setSelectedLot(null);
            // setSelectedTrial(null);
            // setTrialList([]);
            setResults([]);
          }}
          onLotChange={(l) => {
            setSelectedLot(l);

            // if (selectedVendor === "PIXEL") {
            //   fetchSorter(l.value).then(setTrialList);
            // } else {
            //   // setTrialList([]);
            //   // setSelectedTrial(null);
            // }
          }}
          // onTrialChange={(t) => {
          //   setSelectedTrial(t);
          //   handleSearch();
          // }}
          onSearch={handleSearchBar}
        />
      </div>

      <div className="main-box">
        
        {myList.length > 0 && (
          <>
            <div className="section-header">
              <h3>Selected Lots ({myList.length})</h3>
              <div className="header-buttons">
                <button onClick={() => setShowAnalysisModal(true)}>
                  <PiAlignBottomDuotone size={22} />
                </button>
                <button onClick={() => setShowExcelModal(true)}>
                  <PiMicrosoftExcelLogoFill size={22} />
                </button>
              </div>
            </div>

            <DataTable
              data={myList}
              columns={[
                {
                  header: () => (
                    <button
                      className="row-delete-btn delete-all"
                      onClick={(e) => {
                        e.stopPropagation();
                        if (window.confirm("모든 LOT을 삭제하시겠습니까?")) {
                          setMyList([]);
                          setResultSelectedIds([]);
                        }
                      }}
                    >
                      <PiTrash size={18} />
                    </button>
                  ),
                  id: "actions",
                  cell: ({ row }) => (
                    <button
                      className="row-delete-btn"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveLot(row.original.id);
                      }}
                    >
                      <PiTrash size={17} />
                    </button>
                  ),
                },
                { header: "LOT", 
                  accessorKey: "lot",
                  cell: ({ row, getValue }) => (
                    <span
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/pms/detail/${row.original.id}`);
                      }}
                      style={{
                        color: "inherit",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      {getValue()}
                    </span>
                  )
                 },
                { header: "Version", accessorKey: "version" },
                { header: "Itemcode", accessorKey: "itemcode" },
                { header: "Customer", accessorKey: "customer" },
                {
                  header: "Date",
                  accessorKey: "ai_dt",
                  cell: ({ getValue }) => {
                    const v = getValue();
                    return v ? v.slice(0, 10) : "";
                  },
                },
              ]}
              selectable={false}
              pagination={true}
              defaultPageSize={5}
            />

            <div className="divider" />
          </>
        )}

        {isAnalyzing && myList.length > 0 ? (
          <div className="analysis-result">
            <div className="section-header">
              <h3>Analysis Results</h3>
            </div>

            {isSingle && (

              <div className="graph-toggle">
                <label>Type:</label>
                <select
                  value={singleGraphType}
                  onChange={(e) => setSingleGraphType(e.target.value)}
                >
                  <option value="bar">Bar</option>
                  <option value="line">Line</option>
                </select>
              </div>
            
            )}

            <div className="chart-tabs">
              {tabs.map((tab) => (
                <button
                  key={tab.key}
                  className={`chart-tab ${activeTab === tab.key ? "active" : ""}`}
                  onClick={() => setActiveTab(tab.key)}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            <AnalysisChart
              ids={ids}
              analysisMode={activeTab}
              analysisOptions={analysisOptions}
              singleGraphType={singleGraphType}
            />
          </div>
        ) : isLoading ? (
        <LoadingSpinner text="Searching" />

        ) : results.length > 0 ? (
          <>
            <div className="section-header">
              <h3>Search Results</h3>
            </div>

            <DataTable
              data={results}
              columns={[
                { header: "LOT", 
                  accessorKey: "lot",
                  cell: ({ row, getValue }) => (
                    <span
                      onClick={(e) => {
                        e.stopPropagation(); 
                        navigate(`/pms/detail/${row.original.id}`);
                      }}
                      style={{
                        color: "inherit",
                        cursor: "pointer",
                        textDecoration: "none",
                      }}
                    >
                      {getValue()}
                    </span>
                  )
                 },
                { header: "Version", accessorKey: "version" },
                { header: "Itemcode", accessorKey: "itemcode" },
                { header: "Customer", accessorKey: "customer" },
                {
                  header: "Date",
                  accessorKey: "ai_dt",
                  cell: ({ getValue }) => {
                    const v = getValue();
                    return v ? v.slice(0, 10) : "";
                  },
                },
              ]}
              selectable={true}
              pagination={true}
              selectedIds={resultSelectedIds}
              onSelectChange={handleSelectChange}
            />
          </>
        ) : searched ? (
          <div className="empty-box">No Results</div>
        ) : (
          <div className="empty-box">PCB AI Inspection</div>
        )}
      </div>

      {showAnalysisModal && (
        <div className="modal-backdrop" onClick={() => setShowAnalysisModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Analysis Options</h3>

            <div className="modal-body">
              <div className="option-group">
                <h4>Analysis Type</h4>
                {Object.keys(analysisOptions).map((key) => (
                  <label key={key}>
                    <input
                      type="checkbox"
                      checked={analysisOptions[key]}
                      onChange={() =>
                        setAnalysisOptions((p) => {
                          const selected = Object.keys(p).filter((k) => p[k]);
                          const isSelected = p[key];


                          if (isSelected) {
                            return { ...p, [key]: false };
                          }

                          if (selected.length >= 2) {
                            alert("Up to 2 options.");
                            return p;
                          }

                          return { ...p, [key]: true };
                        })
                      }
                    />
                    {({
                      rate: "Point-based Rate",
                      rate_unit: "Unit-based Rate",
                      overkill: "Overkill(IVS)",
                      underkill: "Underkill(IVS)",
                    }[key])}
                  </label>
                ))}
              </div>

              <div className="option-group">
                <h4>Analysis Mode</h4>
                {tabs.map((tab) => (
                  <label key={tab.key}>
                    <input
                      type="radio"
                      name="analysisMode"
                      value={tab.key}
                      checked={activeTab === tab.key}
                      onChange={(e) => setActiveTab(e.target.value)}
                    />
                    {tab.label}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowAnalysisModal(false)}>Cancel</button>
              <button onClick={handleAnalyze}>Run</button>
            </div>
          </div>
        </div>
      )}

      {showExcelModal && (
        <div className="modal-backdrop" onClick={() => setShowExcelModal(false)}>
          <div className="modal-window" onClick={(e) => e.stopPropagation()}>
            <h3>Excel Export Options</h3>

            <div className="modal-body">
              <div className="option-group">

                {Object.keys(excelOptions).map((key) => (
                  <label key={key} style={{ display: "block", margin: "6px 0" }}>
                    <input
                      type="checkbox"
                      checked={excelOptions[key]}
                      onChange={() => toggleExcelOption(key)}
                      style={{ marginRight: "6px" }}
                    />
                    {{
                      rawdata: "Rawdata",
                      summary: "Summary",
                      overkill: "Overkill",
                      underkill: "Underkill",
                    }[key]}
                  </label>
                ))}
              </div>
            </div>

            <div className="modal-footer">
              <button onClick={() => setShowExcelModal(false)}>Cancle</button>
              <button onClick={handleExcelDownload}>Export</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
