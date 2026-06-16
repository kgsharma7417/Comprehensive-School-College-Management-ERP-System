const isDev = import.meta.env.MODE !== "production";

export const error = (...args) => {
  // Simple wrapper — keep console output in dev, can be extended to remote logging
  if (isDev) console.error(...args);
};

export const warn = (...args) => {
  if (isDev) console.warn(...args);
};

export const info = (...args) => {
  if (isDev) console.info(...args);
};

export default { error, warn, info };
