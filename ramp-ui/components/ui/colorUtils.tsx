/**
 * Generates a hue value based on the module code.
 * @param code - The module code (e.g., "IE_500").
 * @returns A number between 0 and 360 representing the hue.
 */
export const getHueFromModuleCode = (code: string): number => {
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
        hash = code.charCodeAt(i) + ((hash << 5) - hash);
    }
    return Math.abs(hash) % 360;
};