import { describe, it, expect } from "vitest";
import { resolveSafeNextPath } from "./route";

describe("resolveSafeNextPath", () => {
  it("acepta una ruta relativa normal", () => {
    expect(resolveSafeNextPath("/reset-password")).toBe("/reset-password");
    expect(resolveSafeNextPath("/accounts?tab=archived")).toBe("/accounts?tab=archived");
  });

  it("cae al fallback si es null o vacío", () => {
    expect(resolveSafeNextPath(null)).toBe("/dashboard");
    expect(resolveSafeNextPath("")).toBe("/dashboard");
  });

  it("rechaza protocol-relative (//host) — CWE-601", () => {
    expect(resolveSafeNextPath("//evil.com")).toBe("/dashboard");
    expect(resolveSafeNextPath("//evil.com/phish")).toBe("/dashboard");
  });

  it("rechaza URLs absolutas con esquema propio", () => {
    expect(resolveSafeNextPath("https://evil.com")).toBe("/dashboard");
    expect(resolveSafeNextPath("http://evil.com/phish")).toBe("/dashboard");
  });

  it("rechaza rutas que no empiezan con /", () => {
    expect(resolveSafeNextPath("evil.com")).toBe("/dashboard");
    expect(resolveSafeNextPath("javascript:alert(1)")).toBe("/dashboard");
  });
});
