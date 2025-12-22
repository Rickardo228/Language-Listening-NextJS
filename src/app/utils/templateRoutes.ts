import { ROUTES } from '../routes';

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
  const base = `${ROUTES.TEMPLATE_PUBLIC}/${encodeURIComponent(groupId)}/${encodeURIComponent(inputLang)}/${encodeURIComponent(targetLang)}`;
  return autoplay ? `${base}?autoplay=1` : base;
};
