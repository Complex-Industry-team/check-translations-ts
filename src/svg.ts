import { TranslationCheckResult } from "./types"

function getCell(val: string) {
    return '<td>' + val + '</td>'
}

export function generateSvgSummary(results: TranslationCheckResult[]) {
    const headers = [
        'Language',
        'Code',
        'Complete',
        'Missing keys',
        'Untranslated keys',
        'Excess keys'
    ]
    const tableHeaderStr = `<tr><th>${headers.join('</th><th>')}</th></tr>`
    let tableBodyStr = ''
    for (const result of results) {
        tableBodyStr += '<tr>'
        tableBodyStr += getCell(result.langDisplay)
        tableBodyStr += getCell(result.langCode)
        tableBodyStr += getCell(result.complete ? '✓🎉' : '✖')
        tableBodyStr += getCell(result.missingKeys.length.toString())
        tableBodyStr += getCell(result.untranslatedKeys.length.toString())
        tableBodyStr += getCell(result.excessKeys.length.toString())
        tableBodyStr += '</tr>'
    }
    const tableStr = `<table>${tableHeaderStr}${tableBodyStr}</table>`
    const svg = `<svg xmlns="http://www.w3.org/2000/svg"><foreignObject>${tableStr}</foreignobject></svg>`
    return svg
}