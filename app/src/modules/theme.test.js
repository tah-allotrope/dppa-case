// @vitest-environment jsdom
import { beforeEach, describe, expect, it } from "vitest";
import { applyTheme, resolveTheme } from "./theme";

describe("theme", () => {
  beforeEach(() => localStorage.clear());
  it("gives URL flags precedence", () => {
    localStorage.setItem("dppa-theme", "default");
    expect(resolveTheme("?present=1", localStorage)).toBe("present");
    expect(resolveTheme("?teach=1", localStorage)).toBe("present");
  });
  it("persists manual choices and updates the root", () => {
    applyTheme("present", { persist: true });
    expect(document.documentElement.dataset.theme).toBe("present");
    expect(localStorage.getItem("dppa-theme")).toBe("present");
  });
});
