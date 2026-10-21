export const toBool = ({ value }: { value: unknown }) =>
  value === true || value === "true" || value === "1" || value === 1;
