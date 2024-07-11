import { LANGUAGES_LIST } from './iso639-data.js';

export function getLanguages(codes = []) {
  return codes.map(code => ({
    code,
    name: getName(code),
    nativeName: getNativeName(code),
  }));
}

export function getName(code: string) {
  return validate(code) ? LANGUAGES_LIST[code].name : '';
}

export function getAllNames() {
  return Object.values(LANGUAGES_LIST).map(l => l.name);
}

export function getNativeName(code: string) {
  return validate(code) ? LANGUAGES_LIST[code].nativeName : '';
}

export function getAllNativeNames() {
  return Object.values(LANGUAGES_LIST).map(l => l.nativeName);
}

export function getCode(name: string) {
  const code = Object.keys(LANGUAGES_LIST).find(code => {
    const language = LANGUAGES_LIST[code];

    return (
      language.name.toLowerCase() === name.toLowerCase() ||
      language.nativeName.toLowerCase() === name.toLowerCase()
    );
  });
  return code ?? '';
}

export function getAllCodes() {
  return Object.keys(LANGUAGES_LIST);
}

export function validate(code: string) {
  return Object.hasOwn(LANGUAGES_LIST, code)
}
