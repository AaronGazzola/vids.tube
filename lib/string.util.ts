export const parseParam = (param: string | string[] | undefined): string => {
  if (!param) throw new Error("Parameter is required");
  return Array.isArray(param) ? param[0] : param;
};
