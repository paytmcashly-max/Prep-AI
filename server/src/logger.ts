type LogMetadata = Record<string, boolean | number | string | null | undefined>;

const writeLog = (level: "error" | "info" | "warn", message: string, metadata?: LogMetadata) => {
  const entry = {
    level,
    message,
    timestamp: new Date().toISOString(),
    ...(metadata ? { metadata } : {})
  };

  const serializedEntry = JSON.stringify(entry);

  if (level === "error") {
    console.error(serializedEntry);
    return;
  }

  if (level === "warn") {
    console.warn(serializedEntry);
    return;
  }

  console.log(serializedEntry);
};

export const logger = {
  error: (message: string, metadata?: LogMetadata) => writeLog("error", message, metadata),
  info: (message: string, metadata?: LogMetadata) => writeLog("info", message, metadata),
  warn: (message: string, metadata?: LogMetadata) => writeLog("warn", message, metadata)
};
