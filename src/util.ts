import { readdirSync, lstatSync } from "fs"

const langName = new Intl.DisplayNames(['en'], {type: 'language'})
export function getLangDisplayName(langCode: string) {
    return langName.of(langCode)! // this function will not return undefined in default configuration
}

// Collects all json files in the specified folder and subfolders
export function collectJsons(dir: string) {
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