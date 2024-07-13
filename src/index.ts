import { info, debug, getInput, warning, setFailed, error as logError } from "@actions/core"
import { readFileSync } from "fs"
import { Translation, Draft, TranslationDraft, TranslationCheckResult } from "./types"
import { getJsonFileNames, getLangDisplayName } from "./util"
import { writeSummaryDetails, writeSummaryTable } from "./summary"
import { generateSvgSummary, uploadSvg } from "./svg"

const IGNORED_KEYS = getInput('ignored-keys').split(' ')
// ALWAYS RUN NPM PACKAGE BEFORE PUSHING
void Run()

async function Run() {
    const jsonFiles = getJsonFileNames('./')
    const translations: Record<string, Translation> = {}
    let defaultTranslation = null
    for (const jsonFile of jsonFiles) {
        try {
            const json: unknown = JSON.parse(readFileSync(jsonFile, 'utf-8'))
            if (!Array.isArray(json)) {
                info(jsonFile + ' does not contain an array.')
                continue
            }

            for (const draft of json as Draft[]) {
                const id = draft.id
                if (draft.type != 'translation')
                    info('Draft' + id + ' is not a translation draft.')
                else {
                    const translationDraft = draft as TranslationDraft
                    for (const key in translationDraft) {
                        if (key === 'type' || key === 'id')
                            continue
                        else if (key === '*')
                            defaultTranslation = translationDraft[key]
                        else {
                            translations[key] = translationDraft[key]
                            info('detected translation for ' + getLangDisplayName(key))
                        }
                    }
                }
            }
        }
        catch {
            warning('Unable to get translation content from ' + jsonFile)
        }
    }

    if (defaultTranslation === null) {
        setFailed('Unable to find a default translation!')
        return
    }

    const resultsTable: TranslationCheckResult[] = []
    for (const langCode in translations) {
        info('Checking ' + langCode)
        const missingKeys: string[] = []
        const untranslatedKeys: string[] = []
        const excessKeys: string[] = []
        try {
            const keys = translations[langCode]

            for (const defaultKey in defaultTranslation) {
                if (IGNORED_KEYS.includes(defaultKey))
                    continue
                if (!(defaultKey in keys)) {
                    missingKeys.push(defaultKey)
                    debug('missing key ' + defaultKey)
                }
                else if (defaultTranslation[defaultKey] === keys[defaultKey]) {
                    untranslatedKeys.push(defaultKey)
                    debug('missing translation for ' + defaultKey)
                }
            }

            for (const translatedKey in keys) {
                if (IGNORED_KEYS.includes(translatedKey))
                    continue
                if (!(translatedKey in defaultTranslation)) {
                    excessKeys.push(translatedKey)
                    debug('excess key ' + translatedKey)
                }
            }

            resultsTable.push({
                langDisplay: getLangDisplayName(langCode),
                langCode: langCode,
                complete: missingKeys.length == 0 && untranslatedKeys.length == 0 && excessKeys.length == 0,
                missingKeys: missingKeys,
                untranslatedKeys: untranslatedKeys,
                excessKeys: excessKeys
            })

            info('missing keys: ' + missingKeys.length.toString())
            info('untranslated keys: ' + untranslatedKeys.length.toString())
            info('excess keys: ' + excessKeys.length.toString())
        } catch (error) {
            //@ts-expect-error will fix later
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            logError(error.message)
        }
    }

    await writeSummaryTable(resultsTable)
    await writeSummaryDetails(resultsTable)

    const svgStr = generateSvgSummary(resultsTable)
    await uploadSvg(svgStr)
}