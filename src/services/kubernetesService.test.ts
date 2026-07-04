import { describe, expect, it } from "vitest";
import { getElectronApi } from "./kubernetesService";

describe("getElectronApi", () => {
  it("returns a fallback bridge when Electron is not available", async () => {
    const api = getElectronApi();

    expect(api).not.toBeNull();
    expect(await api?.getContexts()).toEqual([]);
    expect(await api?.getNamespaces("default")).toEqual([]);
    expect(await api?.getPods("ctx", "default")).toEqual([]);
    expect(await api?.listFiles("ctx", "default", "pod", null, "/")).toEqual([]);
    expect(await api?.showSaveDialog("file.txt")).toBeNull();
  });
});
