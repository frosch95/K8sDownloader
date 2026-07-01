import { describe, it, expect, beforeEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useTheme } from "../hooks/useTheme";

beforeEach(() => {
  localStorage.clear();
  document.documentElement.classList.remove("dark", "light", "darcula");
});

describe("useTheme", () => {
  it("defaults to dark when no preference is stored", () => {
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("reads stored preference from localStorage", () => {
    localStorage.setItem("k8sdownloader-theme", "light");
    const { result } = renderHook(() => useTheme());
    expect(result.current.theme).toBe("light");
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles from dark to darcula", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("darcula");
    expect(localStorage.getItem("k8sdownloader-theme")).toBe("darcula");
    expect(document.documentElement.classList.contains("darcula")).toBe(true);
    expect(document.documentElement.classList.contains("dark")).toBe(false);
  });

  it("toggles from light to dark", () => {
    localStorage.setItem("k8sdownloader-theme", "light");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("k8sdownloader-theme")).toBe("dark");
    expect(document.documentElement.classList.contains("dark")).toBe(true);
  });

  it("toggles from darcula to light", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle()); // dark -> darcula
    act(() => result.current.toggle()); // darcula -> light
    expect(result.current.theme).toBe("light");
    expect(localStorage.getItem("k8sdownloader-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("toggles from darcula to light", () => {
    localStorage.setItem("k8sdownloader-theme", "darcula");
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle());
    expect(result.current.theme).toBe("light");
    expect(localStorage.getItem("k8sdownloader-theme")).toBe("light");
    expect(document.documentElement.classList.contains("light")).toBe(true);
  });

  it("persists preference across multiple toggles", () => {
    const { result } = renderHook(() => useTheme());
    act(() => result.current.toggle()); // dark -> darcula
    act(() => result.current.toggle()); // darcula -> light
    act(() => result.current.toggle()); // light -> dark
    expect(result.current.theme).toBe("dark");
    expect(localStorage.getItem("k8sdownloader-theme")).toBe("dark");
  });
});
