import api from "./axiosInstance";

export const fetchMachines = async () => {
  try {
    const res = await api.get("/api/pms/machines");
    return res.data;
  } catch (err) {
    console.error("fetchMachines error:", err);
    return [];
  }
};

export const fetchItems = async (machine) => {
  try {
    const res = await api.get("/api/pms/items", {
      params: { machine },
    });
    return res.data;
  } catch (err) {
    console.error("fetchItems error:", err);
    return [];
  }
};

export const fetchLots = async (item) => {
  try {
    const res = await api.get("/api/pms/lots", {
      params: { item },
    });
    return res.data;
  } catch (err) {
    console.error("fetchLots error:", err);
    return [];
  }
};

export const fetchSorter = async (lot) => {
  try {
    const res = await api.get("/api/pms/sorter", {
      params: { lot },
    });
    return res.data;
  } catch (err) {
    console.error("fetchSorter error:", err);
    return [];
  }
};

export const fetchPmsFilterSearch = async (params) => {
  try {
    const res = await api.get("/api/pms/search", {
      params: {
        machine: params.machine,
        item: params.item,
        lot: params.lot,
        trial: params.trial,
      },
    });
    return res.data;
  } catch (err) {
    console.error("fetchPmsFilterSearch error:", err);
    return [];
  }
};

export const fetchPmsPopupSearch = async ({ startDate, endDate, text }) => {
  try {
    const res = await api.get("/api/pms/search", {
      params: { startDate, endDate, text },
    });
    return res.data;
  } catch (err) {
    console.error("fetchPmsPopupSearch error:", err);
    return [];
  }
};

export async function fetchSummary(testId, sorters = []) {
  const qs = sorters.length > 0 ? `?sorters=${sorters.join(",")}` : "";
  const { data } = await api.get(`/api/pms/detail/${testId}/summary${qs}`);
  return data;
}

export const fetchDetailSorter = async (testId) => {
  try {
    const res = await api.get(`/api/pms/detail/${testId}/sorter`);
    return res.data;
  } catch (err) {
    console.error("fetchDetailSorter error:", err);
    return null;
  }
};

export const fetchSummaryMulti = async (testIds) => {
  try {
    const res = await api.post(`/api/pms/summary/multi`, testIds);
    return res.data;
  } catch (err) {
    console.error("fetchSummaryMulti error:", err);
    return null;
  }
};


export const fetchPmsDetailHeader = async (testId) => {
  const res = await api.get(`/api/pms/detail/${testId}`);
  return res.data;
};

export async function fetchPmsData(testId,
  {
    mode = "point",   
    page = 1,
    size = 100,
    sorters = [],
    filters = {},
    sortConfig = null
  }
) {
  const payload = { mode, page, size, sorters, filters };

  if (sortConfig?.field) {
    payload.sort = sortConfig;
  }

  const { data } = await api.post(`/api/pms/detail/${testId}/data`, payload);
  return data;
}

export async function fetchUniqueValues(testId, type = "point", sorters = []) {
  const qs = `?type=${type}` +
             (sorters.length > 0 ? `&sorters=${sorters.join(",")}` : "");
  const { data } = await api.get(`/api/pms/detail/${testId}/unique-values${qs}`);
  return data;
}



