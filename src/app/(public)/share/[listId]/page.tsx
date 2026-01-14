'use client'

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Config, Phrase, PresentationConfig } from '../../../types';
import { defaultPresentationConfig } from '../../../defaultConfig';
import { defaultAdvantages, SignInPage } from '../../../SignInPage';
import { getFirestore, doc, getDoc, collection as firestoreCollection, addDoc, query, where, getDocs } from 'firebase/firestore';
import { PhrasePlaybackView } from '../../../components/PhrasePlaybackView';
import { LanguageFlags } from '../../../components/LanguageFlags';
import { useUser } from '../../../contexts/UserContext';
import { markCompleted } from '../../../utils/progressService';
import { User } from 'firebase/auth';
import { X, Check } from 'lucide-react';
import { toast } from 'sonner';
import { ROUTES } from '../../../routes';

const firestore = getFirestore();

export default function SharedList() {
    const { listId } = useParams();
    const router = useRouter();
    const { user, isAuthLoading } = useUser();
    const [collection, setCollection] = useState<Config | null>(null);
    const [loading, setLoading] = useState(true);
    const [showSignIn, setShowSignIn] = useState(false);
    const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
    const [previousPhraseCount, setPreviousPhraseCount] = useState<number | null>(null);

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
        if (collection && previousPhraseCount !== null && collection.phrases.length < previousPhraseCount) {
            setShowSignIn(true);
        }
        if (collection) {
            setPreviousPhraseCount(collection.phrases.length);
        }
    }, [collection?.phrases.length]);

    const handleSaveList = async () => {
        if (!user) {
            setShowSignIn(true);
            return;
        }
        await saveListToUser(user);
    };

    const saveListToUser = async (user: User | null) => {
        if (!collection || !user) return;

        try {
            // Check for existing copies of this list
            const userCollectionsRef = firestoreCollection(firestore, 'users', user.uid, 'collections');
            const q = query(userCollectionsRef, where('originalId', '==', listId));
            const querySnapshot = await getDocs(q);

            if (!querySnapshot.empty) {
                const overwrite = window.confirm('You already have a copy of this list. Would you like to save it again?');
                if (!overwrite) {
                    router.push(ROUTES.HOME);
                    return;
                }
            }


            // Create a new collection object without the id
            // eslint-disable-next-line @typescript-eslint/no-unused-vars
            const { id, ...collectionWithoutId } = collection;
            const newCollection = {
                ...collectionWithoutId,
                name: `${collection.name} (Shared)`,
                created_at: new Date().toISOString(),
                originalId: listId,
                phrases: collection.phrases.map(phrase => ({
                    ...phrase,
                    created_at: new Date().toISOString()
                }))
            };

            const colRef = firestoreCollection(firestore, 'users', user.uid, 'collections');
            await addDoc(colRef, newCollection);
            toast.success('List saved successfully!');
            router.push(ROUTES.HOME);
        } catch (err) {
            console.error('Error saving list:', err);
            toast.error('Failed to save list: ' + err);
        }
    };

    if (isAuthLoading || loading) {
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

    if (showSignIn) {
        return (
            <div className="min-h-screen bg-background">
                <div className="max-w-md mx-auto p-6 relative">
                    <button
                        onClick={() => setShowSignIn(false)}
                        className="absolute top-2 right-2 p-2 text-muted-foreground hover:text-foreground transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6" />
                    </button>
                    <SignInPage
                        title="Save This List"
                        description={(isSignUp) => isSignUp ? (
                            <>
                                Create an account to save this list and start building your collection
                                <div className="mt-4 text-left">
                                    {/* <h3 className="text-sm font-medium mb-2">Create an account to:</h3> */}
                                    <ul className="space-y-2">
                                        {defaultAdvantages.map((advantage, index) => (
                                            <li key={index} className="flex items-center gap-2 text-sm text-muted-foreground">
                                                {advantage.icon ? (
                                                    <span className="text-primary">{advantage.icon}</span>
                                                ) : (
                                                    <Check className="w-4 h-4 text-primary" />
                                                )}
                                                {advantage.text}
                                            </li>
                                        ))}
                                    </ul>
                                </div>
                            </>
                        ) : (
                            "Sign in to save this list and continue building your collection"
                        )}
                        onAuthSuccess={saveListToUser}
                    />
                </div>
            </div>
        );
    }

    return (
        <div className="lg:h-[100vh] flex flex-col bg-background text-foreground">
            {/* Nav */}
            <div className="flex items-center justify-between shadow-md lg:mb-0 p-3 sticky top-0 bg-background border-b z-50">
                <div className="flex items-center gap-2">
                    <button
                        onClick={() => setShowSignIn(true)}
                        className="flex items-center gap-2 hover:opacity-80 transition-opacity"
                    >
                        <h1 className='truncate'>{collection.name}</h1>
                        {collection.phrases[0] && (
                            <LanguageFlags
                                inputLang={collection.phrases[0].inputLang}
                                targetLang={collection.phrases[0].targetLang}
                                size="lg"
                            />
                        )}
                    </button>
                </div>
                <div className="flex items-center gap-4">
                    {hasUnsavedChanges && (
                        <span className="hidden lg:inline text-primary-foreground text-sm">Unsaved changes</span>
                    )}
                    <button
                        onClick={handleSaveList}
                        className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg"
                    >
                        Save Copy
                    </button>
                </div>
            </div>
            <PhrasePlaybackView
                phrases={collection.phrases}
                presentationConfig={collection.presentationConfig || {
                    ...defaultPresentationConfig,
                    name: 'Default'
                }}
                collectionName={collection.name}
                setPhrases={async (phrases: Phrase[]) => {
                    if (collection) {
                        setCollection({
                            ...collection,
                            phrases: phrases
                        });
                        setHasUnsavedChanges(true);
                    }
                }}
                setPresentationConfig={async (config: Partial<PresentationConfig>) => {
                    if (collection) {
                        setCollection({
                            ...collection,
                            presentationConfig: {
                                ...collection.presentationConfig,
                                ...config,
                                name: config.name ?? collection.presentationConfig?.name ?? collection.name ?? 'Default',
                                bgImage: config.bgImage ?? collection.presentationConfig?.bgImage ?? null,
                                containerBg: config.containerBg ?? collection.presentationConfig?.containerBg ?? '#ffffff',
                                textBg: config.textBg ?? collection.presentationConfig?.textBg ?? '#ffffff',
                                enableSnow: config.enableSnow ?? collection.presentationConfig?.enableSnow ?? false,
                                enableCherryBlossom: config.enableCherryBlossom ?? collection.presentationConfig?.enableCherryBlossom ?? false,
                                enableLeaves: config.enableLeaves ?? collection.presentationConfig?.enableLeaves ?? false,
                                enableAutumnLeaves: config.enableAutumnLeaves ?? collection.presentationConfig?.enableAutumnLeaves ?? false,
                                enableOrtonEffect: config.enableOrtonEffect ?? collection.presentationConfig?.enableOrtonEffect ?? false,
                                enableParticles: config.enableParticles ?? collection.presentationConfig?.enableParticles ?? false,
                                enableSteam: config.enableSteam ?? collection.presentationConfig?.enableSteam ?? false,
                                enableOutputBeforeInput: config.enableOutputBeforeInput ?? collection.presentationConfig?.enableOutputBeforeInput ?? false,
                                postProcessDelay: config.postProcessDelay ?? collection.presentationConfig?.postProcessDelay ?? 0,
                                delayBetweenPhrases: config.delayBetweenPhrases ?? collection.presentationConfig?.delayBetweenPhrases ?? 0,
                                enableInputDurationDelay: config.enableInputDurationDelay ?? collection.presentationConfig?.enableInputDurationDelay ?? false,
                                enableOutputDurationDelay: config.enableOutputDurationDelay ?? collection.presentationConfig?.enableOutputDurationDelay ?? false,
                                enableLoop: config.enableLoop ?? collection.presentationConfig?.enableLoop ?? false,
                                enableInputPlayback: config.enableInputPlayback ?? collection.presentationConfig?.enableInputPlayback ?? true,
                                inputPlaybackSpeed: config.inputPlaybackSpeed ?? collection.presentationConfig?.inputPlaybackSpeed ?? 1.0,
                                outputPlaybackSpeed: config.outputPlaybackSpeed ?? collection.presentationConfig?.outputPlaybackSpeed ?? 1.0,
                                showAllPhrases: config.showAllPhrases ?? collection.presentationConfig?.showAllPhrases ?? false
                            }
                        });
                        setHasUnsavedChanges(true);
                    }
                }}
                onCompleted={(userId, collectionId, inputLang, targetLang) => {
                    if (inputLang && targetLang) {
                        markCompleted(userId, collectionId, inputLang, targetLang);
                    }
                }}
            />
        </div>
    );
} 
