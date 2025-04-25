import { ImportPhrasesProps } from "../ImportPhrases";

export function useImportPhrasesVisibility(props: ImportPhrasesProps) {
  const hasValidActions = Boolean(
    (props.hasSelectedCollection && props.onAddToCollection) || props.onProcess
  );

  return {
    shouldRender: hasValidActions,
    hasAddToCollection: Boolean(
      props.hasSelectedCollection && props.onAddToCollection
    ),
    hasCreateNew: Boolean(props.onProcess),
  };
}
