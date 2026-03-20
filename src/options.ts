import browser from "webextension-polyfill";

const KEY_OPTIONS = "options";
export type optionsTemplate = {
    lang: "pl" | "en",
    hideScores: boolean
}

const DEFAULT_OPTIONS: optionsTemplate = {
    lang: "pl",
    hideScores: false
};

export async function getOptions(): Promise<optionsTemplate> {
    const data = await browser.storage.local.get(KEY_OPTIONS);
    const options = data[KEY_OPTIONS] as Partial<optionsTemplate> | undefined;
    if (!options || Array.isArray(options) || typeof options !== "object") return { ...DEFAULT_OPTIONS };
    return { ...DEFAULT_OPTIONS, ...options } as optionsTemplate;
}

export async function saveOptions(newOptions: optionsTemplate): Promise<void> {
    await browser.storage.local.set({ [KEY_OPTIONS]: newOptions });
}