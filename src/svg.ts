import simpleGit from "simple-git"
import { TranslationCheckResult } from "./types"
import { mkdirSync, writeFileSync } from "fs"

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

export async function uploadSvg(svgStr: string) {
    mkdirSync('/complex-pages')
    const client = simpleGit('/complex-pages/')
    await client.clone('https://github.com/Complex-Industry-team/Complex-Industry-team.github.io.git', '.')
    writeFileSync('/complex-pages/translation-status.svg', svgStr)
    await client.add('translation-status.svg')
    await client.commit('update translation-status svg')
    await client.push()
}