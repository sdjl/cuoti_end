import { APP_NAME, APP_TITLE } from "../config/constants.js";
export function isLocal() {
  return process.env.NODE_ENV !== "production";
}
export function appName() {
  return APP_NAME;
}
export function appTitle() {
  return APP_TITLE;
}
