/**
 * Next.js Middleware entry point.
 * Delegates all routing logic (locale prefix, tenant resolution) to proxy.ts.
 */
export { proxy as default, config } from "./proxy";
