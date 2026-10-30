export const HONEST_LIMITS_MARKER: string;
export const LIMITS_PARAGRAPH_MARKER: string;
export const COUNT_WORDS: readonly string[];
export function hookHeader(source:string):string;
export function headerLimitNumbers(source:string):number[];
export function limitsParagraph(source:string):string;
export function declineCodesInSource(source:string):string[];
export function publishedLimitNumbers(source:string):number[];
export function limitsDrift(source:string,bullet:string):string[];
