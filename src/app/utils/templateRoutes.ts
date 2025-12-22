import { ROUTES } from "../routes";

export type TemplateUrlOptions = {
  groupId: string;
  inputLang: string;
  targetLang: string;
  autoplay?: boolean;
};

export const buildTemplateUrl = ({
  groupId,
  inputLang,
  targetLang,
  autoplay = false,
}: TemplateUrlOptions): string => {
  const base = `${ROUTES.TEMPLATE_PUBLIC}/${encodeURIComponent(
    groupId
  )}/${encodeURIComponent(inputLang)}/${encodeURIComponent(targetLang)}`;
  const params = new URLSearchParams();
  if (autoplay) params.set("autoplay", "1");
  const query = params.toString();
  return query ? `${base}?${query}` : base;
};
