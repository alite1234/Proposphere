export type { ActionState } from "./action-state";

export type ActionState<T = any, E = Error> = {
  status: "pending" | "success" | "error";
  data: T;
  error: E | null;
};