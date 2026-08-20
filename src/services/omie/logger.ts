import "server-only";

export type OmieLogEntry = {
  event: "request" | "retry" | "success" | "failure";
  endpoint: string;
  call: string;
  attempt: number;
  durationMs?: number;
  status?: number;
  errorCode?: string;
};

export type OmieLogger = {
  log: (entry: OmieLogEntry) => void;
};

export const consoleOmieLogger: OmieLogger = {
  log(entry) {
    console.info(JSON.stringify({ scope: "omie", ...entry }));
  },
};
