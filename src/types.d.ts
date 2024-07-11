export interface Draft {
    id: string,
    type: string,
}

export type TranslationDraft = Record<string, Translation> & Draft
export type Translation = Record<string, string>

export interface TranslationCheckResult {
    langCode: string,
    langDisplay: string,
    complete: boolean,
    missingKeys: string[],
    untranslatedKeys: string[],
    excessKeys: string[]
}