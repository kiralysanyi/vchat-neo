export const isSafari = (): boolean => {
    const ua = navigator.userAgent.toLowerCase();
    return /safari/.test(ua) && !/chrome/.test(ua);
};