import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";

// The DSM prototype's ProjectManager expects a `window.storage` API, which is
// provided by the Claude artifact sandbox. On a normal web page we polyfill it
// with localStorage so save/load/list/delete all work.
if (typeof window !== "undefined" && !window.storage) {
  window.storage = {
    list: async (prefix) => ({
      keys: Object.keys(localStorage).filter((k) => k.startsWith(prefix)),
    }),
    get: async (key) => ({ value: localStorage.getItem(key) }),
    set: async (key, value) => {
      localStorage.setItem(key, value);
    },
    delete: async (key) => {
      localStorage.removeItem(key);
    },
  };
}

createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
