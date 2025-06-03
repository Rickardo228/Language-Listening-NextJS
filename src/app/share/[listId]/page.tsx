'use client'

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import { Config, Phrase } from '../../types';
import { SignInPage } from '../../SignInPage';
import { auth } from '../../firebase';
import { getFirestore, doc, getDoc, collection as firestoreCollection, addDoc } from 'firebase/firestore';
import { PhrasePlaybackView } from '../../components/PhrasePlaybackView';

const firestore = getFirestore();

export default function SharedList() {
    const { listId } = useParams();
    const [collection, setCollection] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [user, setUser] = useState(null);

    useEffect(() => {
        const fetchCollection = async () => {
            try {
                const docRef = doc(firestore, 'published_collections', listId as string);
                const docSnap = await getDoc(docRef);
                if (docSnap.exists()) {
                    setCollection(docSnap.data() as Config);
                }
            } catch (err) {
                console.error('Error fetching collection:', err);
            } finally {
                setLoading(false);
            }
        };

        fetchCollection();
    }, [listId]);

    useEffect(() => {
        const unsubscribe = auth.onAuthStateChanged((user) => {
            setUser(user);
        });
        return () => unsubscribe();
    }, []);

    const handleSaveList = async () => {
        if (!user || !collection) return;

        try {
            const newCollection = {
                ...collection,
                name: `${collection.name} (Shared)`,
                created_at: new Date().toISOString(),
                phrases: collection.phrases.map(phrase => ({
                    ...phrase,
                    created_at: new Date().toISOString()
                }))
            };

            const colRef = firestoreCollection(firestore, 'users', user.uid, 'collections');
            await addDoc(colRef, newCollection);
            alert('List saved successfully!');
        } catch (err) {
            console.error('Error saving list:', err);
            alert('Failed to save list: ' + err);
        }
    };

    if (loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!collection) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">List not found</h1>
                    <p>The list you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </div>
        );
    }

    if (!user) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-md mx-auto p-6">
                    <h1 className="text-2xl font-bold mb-4">{collection.name}</h1>
                    <p className="mb-6">Sign in to save this list and create your own collections.</p>
                    <SignInPage />
                </div>
            </div>
        );
    }

    return (
        <div className="font-sans lg:h-[100vh] flex flex-col bg-background text-foreground">
            {/* Nav */}
            <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
                <h1 className="text-2xl font-bold">{collection.name}</h1>
                <button
                    onClick={handleSaveList}
                    className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
                >
                    Save List
                </button>
            </div>

            <PhrasePlaybackView
                phrases={collection.phrases}
                presentationConfig={collection.presentationConfig}
                collectionName={collection.name}
                readOnly={true}
                setPhrases={async (phrases: Phrase[], collectionId?: string | undefined) => {
                    if (collection) {
                        setCollection({
                            ...collection,
                            phrases: phrases
                        });
                    }
                }}
            />
        </div>
    );
} 