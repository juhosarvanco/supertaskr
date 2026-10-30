// Shared pure contract readers extracted from lane-fence.spec.ts.
export const HONEST_LIMITS_MARKER = "── THE HONEST LIMITS";
export const LIMITS_PARAGRAPH_MARKER = "**THE LIMITS —";
export const COUNT_WORDS = [
    "zero",
    "one",
    "two",
    "three",
    "four",
    "five",
    "six",
    "seven",
    "eight",
    "nine",
    "ten",
    "eleven",
    "twelve",
];
export function hookHeader(hookSource) {
    const end = hookSource.indexOf("\n */");
    return end === -1 ? "" : hookSource.slice(0, end);
}
export function headerLimitNumbers(hookSource) {
    const header = hookHeader(hookSource);
    const from = header.indexOf(HONEST_LIMITS_MARKER);
    if (from === -1)
        return [];
    return [...header.slice(from).matchAll(/^ \* (\d+)\. /gm)].map((m) => Number(m[1]));
}
export function limitsParagraph(bullet) {
    const from = bullet.indexOf(LIMITS_PARAGRAPH_MARKER);
    return from === -1 ? "" : bullet.slice(from);
}
export function declineCodesInSource(hookSource) {
    const block = /export const DECLINE_CODES = Object\.freeze\(\[([\s\S]*?)\]\)/.exec(hookSource);
    if (block === null)
        return [];
    return [...String(block[1]).matchAll(/"([^"]+)"/g)].map((m) => String(m[1]));
}
export function publishedLimitNumbers(bullet) {
    return [...limitsParagraph(bullet).matchAll(/\((\d+)\)/g)].map((m) => Number(m[1]));
}
export function limitsDrift(hookSource, bullet) {
    const complaints = [];
    const declared = headerLimitNumbers(hookSource);
    const published = publishedLimitNumbers(bullet);
    if (declared.length === 0) {
        complaints.push(`the hook declares no numbered limits under ${HONEST_LIMITS_MARKER}`);
    }
    if (published.length === 0) {
        complaints.push(`the lane bullet has no limits paragraph opening ${LIMITS_PARAGRAPH_MARKER}`);
    }
    if (declared.join("/") !== published.join("/")) {
        complaints.push(`the header numbers its limits ${declared.join("/")} and the lane bullet publishes ` +
            `${published.join("/")}`);
    }
    const word = /— (\w+), numbered in/.exec(limitsParagraph(bullet))?.[1];
    if (word === undefined) {
        complaints.push("the limits paragraph no longer opens with its count in words");
    }
    else if (word !== COUNT_WORDS[declared.length]) {
        complaints.push(`the paragraph counts them "${word}" and the header numbers ${declared.length}`);
    }
    // THE BULLET ARRIVES WHITESPACE-COLLAPSED, so a code the document
    // wrapped across two lines reads as two words here and matches
    // nothing. That is the failure this loop is likeliest to meet, so the
    // complaint says so rather than leaving the next reader to find it.
    for (const code of declineCodesInSource(hookSource)) {
        if (!bullet.includes(`\`${code}\``)) {
            complaints.push(`the declining code \`${code}\` is not published in the lane bullet — and a code the ` +
                "document wrapped across two lines does not survive the collapse");
        }
    }
    return complaints;
}
