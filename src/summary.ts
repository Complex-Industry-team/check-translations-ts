import {summary as createSummary} from '@actions/core'
import { TranslationCheckResult } from './types'
import { SummaryTableRow } from '@actions/core/lib/summary'

export function getSummaryTable(results: TranslationCheckResult[]) {
    const resultsTable: SummaryTableRow[] = [
        [{ data: 'language', header: true }, { data: 'code', header: true }, { data: 'complete', header: true }, { data: 'Missing keys', header: true }, { data: 'Untranslated keys', header: true }, { data: 'Unused keys', header: true }]
    ]

    for (const result of results) {
        resultsTable.push([
            result.langDisplay,
            result.langCode,
            result.complete ? '✓🎉' : '✖',
            result.missingKeys.length.toString(),
            result.untranslatedKeys.length.toString(),
            result.excessKeys.length.toString()
        ])
    }

    const summary = createSummary.addHeading('Translation completeness')
    .addTable(resultsTable)
    return summary.stringify()
}

export function getSummaryDetails(results: TranslationCheckResult[]) {
    const summary = createSummary.addHeading('Incomplete languages')
    for (const result of results) {
        if (result.complete)
            continue
        summary.addBreak()
        summary.addRaw('<h2>' + result.langDisplay + ' (' + result.langCode + ')</h2>')
        
        if (result.missingKeys.length > 0) {
            let missingKeysString = '<ul>'
            result.missingKeys.forEach(key => {
                missingKeysString += '<li>' + key + '</li>'
            })
            missingKeysString += '</ul>'
            summary.addDetails('Missing keys', missingKeysString)
        }
        
        if (result.untranslatedKeys.length > 0) {
            let untranslatedKeyString = '<ul>'
            result.untranslatedKeys.forEach(key => {
                untranslatedKeyString += '<li>' + key + '</li>'
            })
            untranslatedKeyString += '</ul>'
            summary.addDetails('Untranslated keys', untranslatedKeyString)
        }
        
        if (result.excessKeys.length > 0) {
            let excessKeyString = '<ul>'
            result.excessKeys.forEach(key => {
                excessKeyString += '<li>' + key + '</li>'
            })
            excessKeyString += '</ul>'
            summary.addDetails('Unused keys', excessKeyString)
        }
    }

    return summary.stringify()
}