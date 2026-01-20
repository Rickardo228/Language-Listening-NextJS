'use client'

import React, { createContext, useContext, useMemo, useState } from 'react';
import { Config, Phrase } from '../types';

interface CollectionsContextType {
  collections: Config[];
  setCollections: React.Dispatch<React.SetStateAction<Config[]>>;
  upsertCollection: (collection: Config) => void;
  appendPhraseToCollection: (collectionId: string, phrase: Phrase) => void;
  removeCollection: (collectionId: string) => void;
}

const CollectionsContext = createContext<CollectionsContextType | undefined>(undefined);

export const useCollections = () => {
  const context = useContext(CollectionsContext);
  if (!context) {
    throw new Error('useCollections must be used within a CollectionsProvider');
  }
  return context;
};

interface CollectionsProviderProps {
  children: React.ReactNode;
}

export const CollectionsProvider: React.FC<CollectionsProviderProps> = ({ children }) => {
  const [collections, setCollections] = useState<Config[]>([]);

  const upsertCollection = (collection: Config) => {
    setCollections((prev) => {
      const index = prev.findIndex((item) => item.id === collection.id);
      if (index === -1) {
        return [collection, ...prev];
      }
      const next = [...prev];
      next[index] = { ...prev[index], ...collection };
      return next;
    });
  };

  const appendPhraseToCollection = (collectionId: string, phrase: Phrase) => {
    setCollections((prev) =>
      prev.map((item) =>
        item.id === collectionId
          ? { ...item, phrases: [...item.phrases, phrase] }
          : item
      )
    );
  };

  const removeCollection = (collectionId: string) => {
    setCollections((prev) => prev.filter((item) => item.id !== collectionId));
  };

  const value = useMemo(
    () => ({
      collections,
      setCollections,
      upsertCollection,
      appendPhraseToCollection,
      removeCollection,
    }),
    [collections]
  );

  return (
    <CollectionsContext.Provider value={value}>
      {children}
    </CollectionsContext.Provider>
  );
};
