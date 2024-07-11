import { info, debug, getInput, warning, setFailed, error as logError, summary as createSummary } from "@actions/core"
import { readdirSync, lstatSync, readFileSync } from "fs"
import { SummaryTableRow } from "@actions/core/lib/summary"

const IGNORED_KEYS = getInput('ignored-keys').split(' ')
interface Draft {
    id: string,
    type: string,
}
type TranslationDraft = Record<string, Translation> & Draft
type Translation = Record<string, string>;

// ALWAYS RUN NPM PACKAGE BEFORE PUSHING
// eslint-disable-next-line @typescript-eslint/no-floating-promises
Run()

async function Run() {
    const langName = new Intl.DisplayNames(['en'], {type: 'language'});

    // Collects all json files in the specified folder and subfolders
    function collectJsons(dir: string) {
        const jsonFiles: string[] = []
        const files = readdirSync(dir, 'utf-8')
        for (const file of files) {
            if (file.startsWith('.'))
                continue
            if (lstatSync(file).isDirectory())
                jsonFiles.push(...collectJsons(file))
            else if (file.endsWith('.json'))
                jsonFiles.push(file)
        }
        return jsonFiles
    }

    const jsonFiles = collectJsons('./')
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
                            const lang = langName.of(key)
                            if (lang !== undefined) {
                                translations[key] = translationDraft[key]
                                info('detected translation for ' + lang)
                            }
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

    const resultsTable: unknown = [
        [{ data: 'language', header: true }, { data: 'code', header: true }, { data: 'complete', header: true }, { data: 'Missing keys', header: true }, { data: 'Untranslated keys', header: true }, { data: 'Unused keys', header: true }]
    ]
    const incompleteDetails = []

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

            const success = (missingKeys.length == 0 && untranslatedKeys.length == 0) ? '✓🎉' : '✖'

            //@ts-expect-error dont have a type spec for resultstable yet
            // eslint-disable-next-line @typescript-eslint/no-unsafe-call
            resultsTable.push([
                langName.of(langCode),
                langCode,
                success,
                missingKeys.length.toString(),
                untranslatedKeys.length.toString(),
                excessKeys.length.toString()
            ])
            if (success === '✖') {
                incompleteDetails.push({
                    langCode: langCode,
                    missingKeys: missingKeys,
                    untranslatedKeys: untranslatedKeys,
                    excessKeys: excessKeys
                })
            }
            info('missing keys: ' + missingKeys.length.toString())
            info('untranslated keys: ' + untranslatedKeys.length.toString())
            info('excess keys: ' + excessKeys.length.toString())
        } catch (error) {
            //@ts-expect-error will fix later
            // eslint-disable-next-line @typescript-eslint/no-unsafe-argument
            logError(error.message);
        }
    }

    const summary = createSummary.addHeading('Translation completeness')
        .addTable(resultsTable as SummaryTableRow[])
        .addHeading('Incomplete languages')

    incompleteDetails.forEach(details => {
        summary.addBreak();
        // eslint-disable-next-line @typescript-eslint/restrict-plus-operands
        summary.addRaw('<h2>' + langName.of(details.langCode) + ' (' + details.langCode + ')</h2>');

        if (details.missingKeys.length > 0) {
            let missingKeysString = '<ul>';
            details.missingKeys.forEach(key => {
                missingKeysString += '<li>' + key + '</li>';
            });
            missingKeysString += '</ul>'
            summary.addDetails('Missing keys', missingKeysString);
        }

        if (details.untranslatedKeys.length > 0) {
            let untranslatedKeyString = '<ul>';
            details.untranslatedKeys.forEach(key => {
                untranslatedKeyString += '<li>' + key + '</li>';
            });
            untranslatedKeyString += '</ul>'
            summary.addDetails('Untranslated keys', untranslatedKeyString);
        }

        if (details.excessKeys.length > 0) {
            let excessKeyString = '<ul>'
            details.excessKeys.forEach(key => {
                excessKeyString += '<li>' + key + '</li>';
            });
            excessKeyString += '</ul>'
            summary.addDetails('Unused keys', excessKeyString);
        }
    });

    await summary.write()
}