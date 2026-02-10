import { ROUTES } from "../routes";

export type TemplateUrlOptions = {
  groupId: string;
  inputLang: string;
  targetLang: string;
};

export const buildTemplateUrl = ({
  groupId,
  inputLang,
  targetLang,
}: TemplateUrlOptions): string => {
  return `${ROUTES.TEMPLATE_PUBLIC}/${encodeURIComponent(
    groupId
  )}/${encodeURIComponent(inputLang)}/${encodeURIComponent(targetLang)}`;
};
