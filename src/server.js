import { register } from "tsx/esm/api";

process.env.NODE_ENV = process.env.NODE_ENV || "production";
register();
await import("../server.ts");
