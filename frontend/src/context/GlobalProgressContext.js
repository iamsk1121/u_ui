import { createContext, useContext, useState } from "react";

const GlobalProgressContext = createContext();

export function GlobalProgressProvider({ children }) {
  const [downloads, setDownloads] = useState([]);

  const start = (label) => {
    const id = Date.now();
    const controller = new AbortController();

    setDownloads((prev) => [
      ...prev,
      { id, label, progress: 0, controller }
    ]);

    return { id, controller };
  };


  const update = (id, value) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: value } : d
      )
    );
  };

  const finish = (id) => {
    setDownloads((prev) =>
      prev.map((d) =>
        d.id === id ? { ...d, progress: 100 } : d
      )
    );

    setTimeout(() => {
      setDownloads((prev) => prev.filter((d) => d.id !== id));
    }, 600);
  };

  const cancel = (id) => {
    const target = downloads.find((d) => d.id === id);

    if (target?.controller) {
      target.controller.abort(); 
    }

    setDownloads((prev) => prev.filter((d) => d.id !== id));
  };

  return (
    <GlobalProgressContext.Provider
      value={{ downloads, start, update, finish, cancel }}
    >
      {children}
    </GlobalProgressContext.Provider>
  );
}

export const useGlobalProgress = () => useContext(GlobalProgressContext);
