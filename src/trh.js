// Sipmple general use functions
export function copyToClipboard(divID) {
    var r = document.createRange();
    r.selectNode(document.getElementById(divID));
    window.getSelection().removeAllRanges();
    window.getSelection().addRange(r);
    document.execCommand("copy");
    window.getSelection().removeAllRanges();
}
export function copyInputToClipboard(inputID) {
    document.getSelection().removeAllRanges();
    document.getElementById(inputID).select();
    document.execCommand("copy");
    document.getSelection().removeAllRanges();
}
export async function hash(text) {
    const msgUint8 = new TextEncoder().encode(text);
    const buffer = await crypto.subtle.digest('SHA-256', msgUint8);
    const hashArray = Array.from(new Uint8Array(buffer));
    const hex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hex;
}


