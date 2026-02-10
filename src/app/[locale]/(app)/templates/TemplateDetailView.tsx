'use client'

import { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Share2 } from 'lucide-react';
import { toast } from 'sonner';
import { collection, deleteDoc, doc, getDocs, getFirestore, query, Timestamp, updateDoc, where } from 'firebase/firestore';
import { CollectionHeader } from '@/app/CollectionHeader';
import { PhrasePlaybackView, PhrasePlaybackMethods } from '@/app/components/PhrasePlaybackView';
import { Select } from '@/app/components/ui';
import { presentationConfigDefinition } from '@/app/configDefinitions';
import { useUser } from '@/app/contexts/UserContext';
import { usePresentationConfig } from '@/app/hooks/usePresentationConfig';
import { Phrase, Template, languageOptions, PresentationConfig } from '@/app/types';
import { uploadBackgroundMedia, deleteBackgroundMedia } from '@/app/utils/backgroundUpload';
import { markCompleted } from '@/app/utils/progressService';
import { buildTemplateUrl } from '@/app/utils/templateRoutes';
import { createOrUpdateUserProfile } from '@/app/utils/userPreferences';
import { buildTemplatePhrases } from '@/app/utils/templatePhrases';

const firestore = getFirestore();

// Get all admin-only field keys from config definitions
const adminOnlyFields = presentationConfigDefinition
    .filter(field => field.adminOnly)
    .map(field => field.key);

// Template-level fields include admin-only fields plus background-related fields
const templateLevelFields: (keyof PresentationConfig)[] = [
    'bgImage',
    'backgroundOverlayOpacity',
    'textColor',
    ...adminOnlyFields as (keyof PresentationConfig)[]
];

type TemplateWithTimestamp = Template & { createdAt: Timestamp };

interface TemplateDetailViewProps {
    groupId: string | null;
    initialInputLang?: string;
    initialTargetLang?: string;
    readOnly?: boolean;
}

// Helper function to get language label from code using Intl.DisplayNames
const getLanguageLabel = (code: string): string => {
    try {
        // Extract the language code from BCP47 language tags (e.g., 'en-US' -> 'en')
        const langCode = code.split('-')[0];
        const displayNames = new Intl.DisplayNames(['en'], { type: 'language' });
        const languageName = displayNames.of(langCode);

        // If we got a display name, combine it with region info if present
        if (languageName && code.includes('-')) {
            const [, region] = code.split('-');
            if (region) {
                try {
                    const regionNames = new Intl.DisplayNames(['en'], { type: 'region' });
                    const regionName = regionNames.of(region);
                    return regionName ? `${languageName} (${regionName})` : languageName;
                } catch {
                    return languageName;
                }
            }
        }

        return languageName || code;
    } catch {
        // Fallback to the original approach if Intl.DisplayNames fails
        const option = languageOptions.find(opt => opt.code === code);
        return option ? option.label : code;
    }
};

export default function TemplateDetailView({
    groupId,
    initialInputLang = 'en-GB',
    initialTargetLang = 'it-IT',
    readOnly = false,
}: TemplateDetailViewProps) {
    const router = useRouter();
    const { user, isAuthLoading, isAdmin } = useUser();
    const methodsRef = useRef<PhrasePlaybackMethods | null>(null);
    const [phrases, setPhrases] = useState<Phrase[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedInputLang, setSelectedInputLang] = useState<string>(initialInputLang);
    const [selectedTargetLang, setSelectedTargetLang] = useState<string>(initialTargetLang);
    const [availableLanguages, setAvailableLanguages] = useState<string[]>([]);
    const [templateData, setTemplateData] = useState<TemplateWithTimestamp | null>(null);
    const [templatePresentationConfig, setTemplatePresentationConfig] = useState<PresentationConfig | null>(null);
    const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
    const [currentPathId, setCurrentPathId] = useState<string | undefined>(undefined);
    const [currentPathIndex, setCurrentPathIndex] = useState<number | undefined>(undefined);

    // Derive the merged presentation config from source states
    const { presentationConfig: basePresentationConfig, setPresentationConfig: setBasePresentationConfig, isReady } = usePresentationConfig({
        user,
        itemPresentationConfig: templatePresentationConfig,
        isItemReady: true,
    });

    // Override name with template name if available
    const presentationConfig: PresentationConfig = {
        ...basePresentationConfig,
        name: templateData?.name || `Template ${groupId}`,
    };

    // Debounced save function for real-time user default persistence
    // Note: This should only receive user-level config (template-level fields already excluded)
    const debouncedSaveConfig = useCallback((config: PresentationConfig) => {
        if (!user || !isReady) return;

        if (saveTimeoutRef.current) {
            clearTimeout(saveTimeoutRef.current);
        }

        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await createOrUpdateUserProfile(user.uid, {
                    defaultPresentationConfig: config,
                });
            } catch (error) {
                console.error('Error saving presentation config:', error);
            }
        }, 300);
    }, [user, isReady]);

    // Cleanup timeout on unmount
    useEffect(() => {
        return () => {
            if (saveTimeoutRef.current) {
                clearTimeout(saveTimeoutRef.current);
            }
        };
    }, []);

    useEffect(() => {
        const fetchTemplates = async () => {
            if (!groupId) {
                setLoading(false);
                return;
            }

            try {
                const templatesRef = collection(firestore, 'templates');

                // Query for input language template
                const inputQuery = query(
                    templatesRef,
                    where('groupId', '==', groupId),
                    where('lang', '==', selectedInputLang)
                );

                // Query for target language template
                const targetQuery = query(
                    templatesRef,
                    where('groupId', '==', groupId),
                    where('lang', '==', selectedTargetLang)
                );

                // Execute both queries
                const [inputSnapshot, targetSnapshot] = await Promise.all([
                    getDocs(inputQuery),
                    getDocs(targetQuery)
                ]);

                // Get input template
                let inputTemplateData: TemplateWithTimestamp | null = null;
                if (!inputSnapshot.empty) {
                    const doc = inputSnapshot.docs[0];
                    inputTemplateData = {
                        id: doc.id,
                        ...doc.data()
                    } as TemplateWithTimestamp;
                }

                // Get target template
                let targetTemplateData: TemplateWithTimestamp | null = null;
                if (!targetSnapshot.empty) {
                    const doc = targetSnapshot.docs[0];
                    targetTemplateData = {
                        id: doc.id,
                        ...doc.data()
                    } as TemplateWithTimestamp;
                }

                // Convert templates to phrases and store in state
                if (inputTemplateData && targetTemplateData) {
                    setPhrases(buildTemplatePhrases(inputTemplateData, targetTemplateData));

                    // Store template data for name extraction
                    setTemplateData(inputTemplateData);

                    // Capture path information if this template is part of a learning path
                    setCurrentPathId(inputTemplateData.pathId);
                    setCurrentPathIndex(inputTemplateData.pathIndex);

                    // Capture template-level presentation config (admin-set)
                    if (inputTemplateData.presentationConfig) {
                        setTemplatePresentationConfig(inputTemplateData.presentationConfig);
                    }
                } else {
                    setPhrases([]);
                }

                // Get all available languages for this group
                const allTemplatesQuery = query(templatesRef, where('groupId', '==', groupId));
                const allTemplatesSnapshot = await getDocs(allTemplatesQuery);
                const languages = allTemplatesSnapshot.docs.map(doc => doc.data().lang);
                setAvailableLanguages(languages);

            } catch (err) {
                console.error('Error fetching templates:', err);
                setPhrases([]);
            } finally {
                setLoading(false);
            }
        };

        fetchTemplates();
    }, [groupId, selectedInputLang, selectedTargetLang]);


    // Admin-only template deletion function
    const handleDeleteTemplate = async (templateGroupId: string) => {
        if (!isAdmin) {
            toast.error('Only administrators can delete templates.');
            return;
        }

        if (!window.confirm(`Are you sure you want to delete the template group "${templateGroupId}"? This action cannot be undone and will delete ALL language variants of this template.`)) {
            return;
        }

        try {
            // Query all templates in this group
            const templatesRef = collection(firestore, 'templates');
            const groupQuery = query(templatesRef, where('groupId', '==', templateGroupId));
            const groupSnapshot = await getDocs(groupQuery);

            // Delete all templates in the group
            const deletePromises = groupSnapshot.docs.map(docSnapshot =>
                deleteDoc(doc(firestore, 'templates', docSnapshot.id))
            );

            await Promise.all(deletePromises);

            toast.success(`Template group "${templateGroupId}" has been successfully deleted.`);

            // Redirect back to templates list or home
            window.location.href = '/templates';

        } catch (error) {
            console.error('Error deleting template:', error);
            toast.error('Failed to delete template. Please try again.');
        }
    };

    // Admin-only template background upload function
    const handleTemplateBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file || !user || !groupId || !isAdmin) {
            return;
        }

        try {
            // Delete old background if it exists and is a Firebase Storage URL
            const oldBgImage = presentationConfig?.bgImage;
            if (oldBgImage && oldBgImage.includes('storage.googleapis.com')) {
                try {
                    await deleteBackgroundMedia(user.uid, groupId as string, oldBgImage);
                } catch (deleteError) {
                    console.error('Error deleting old template background:', deleteError);
                    // Continue with upload even if deletion fails
                }
            }

            // Upload new background (template upload uses shared path)
            const { downloadUrl } = await uploadBackgroundMedia(file, user.uid, groupId as string, true);

            // Update template presentation config state (derived config will automatically update)
            setTemplatePresentationConfig(prev => prev ? { ...prev, bgImage: downloadUrl } : prev);

            // Persist background to all template docs in this group so it applies across languages
            try {
                const templatesRef = collection(firestore, 'templates');
                const groupQuery = query(templatesRef, where('groupId', '==', groupId));
                const groupSnapshot = await getDocs(groupQuery);

                const updatePromises = groupSnapshot.docs.map(docSnapshot =>
                    updateDoc(doc(firestore, 'templates', docSnapshot.id), {
                        presentationConfig: {
                            ...(docSnapshot.data().presentationConfig || {}),
                            bgImage: downloadUrl,
                        },
                    })
                );

                await Promise.all(updatePromises);
            } catch (persistError) {
                console.error('Error saving template background to Firestore:', persistError);
                toast.error('Background image applied locally but failed to save for this template. Please try again.');
            }
        } catch (error) {
            console.error('Error uploading template background:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to upload background. Please try again.');
        } finally {
            // Reset file input
            e.target.value = '';
        }
    };


    // Navigate to next template in the learning path
    const handleNavigateToNextInPath = useCallback(async () => {
        if (!currentPathId || currentPathIndex === undefined) {
            console.log('No path information available');
            return;
        }

        try {
            // Query for the next template in the path
            const templatesRef = collection(firestore, 'templates');
            const nextTemplateQuery = query(
                templatesRef,
                where('pathId', '==', currentPathId),
                where('pathIndex', '==', currentPathIndex + 1)
            );

            const nextTemplateSnapshot = await getDocs(nextTemplateQuery);

            if (!nextTemplateSnapshot.empty) {
                // Get the first matching template (there should only be one per pathIndex)
                const nextTemplateDoc = nextTemplateSnapshot.docs[0];
                const nextTemplateData = nextTemplateDoc.data() as Template;

                // Navigate to the next template, preserving language preferences
                router.push(buildTemplateUrl({
                    groupId: nextTemplateData.groupId,
                    inputLang: selectedInputLang,
                    targetLang: selectedTargetLang,
                }));
            } else {
                // End of path - no next template found
                console.log('Reached end of learning path');
                // Optionally show a message or redirect to path overview
            }
        } catch (error) {
            console.error('Error navigating to next template in path:', error);
        }
    }, [currentPathId, currentPathIndex, selectedInputLang, selectedTargetLang, router]);

    const handleCopyShareLink = async () => {
        if (!groupId) return;

        const shareUrl = `${window.location.origin}${buildTemplateUrl({
            groupId,
            inputLang: selectedInputLang,
            targetLang: selectedTargetLang,
        })}`;
        try {
            await navigator.clipboard.writeText(shareUrl);
            toast.success('Share link copied to clipboard!');
        } catch (error) {
            console.error('Error copying share link:', error);
            toast.error('Failed to copy share link');
        }
    };

    if (isAuthLoading || loading) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (availableLanguages.length === 0) {
        return (
            <div className="flex items-center justify-center min-h-screen bg-background">
                <div className="text-center">
                    <h1 className="text-2xl font-bold mb-4">Template not found</h1>
                    <p>The template you&apos;re looking for doesn&apos;t exist or has been removed.</p>
                </div>
            </div>
        );
    }

    // Create a proper collection config for the template
    const templateAsCollection = {
        id: groupId as string,
        name: templateData?.name || groupId as string, // Use template name if available, fall back to groupId
        phrases: phrases,
        created_at: new Date().toISOString(),
        collectionType: 'phrases' as const,
        presentationConfig: presentationConfig
    };

    // Create the collection header content
    const collectionHeaderContent = (
        <div className="w-full flex items-center gap-2 p-2">
            <CollectionHeader
                collectionId={groupId as string}
                savedCollections={[templateAsCollection]}
                inputLang={selectedInputLang}
                targetLang={selectedTargetLang}
                className="flex"
                titleClassName="max-w-[250px]"
                onDelete={isAdmin ? handleDeleteTemplate : undefined}
            />
            <button
                type="button"
                onClick={handleCopyShareLink}
                className="ml-auto inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-sm transition-colors hover:bg-secondary"
            >
                <Share2 className="h-4 w-4" strokeWidth={1.5} />
                Share
            </button>
        </div>
    );

    // Detect mobile device
    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    return (
        <div className="h-full">
            {phrases.length > 0 ? (
                <PhrasePlaybackView
                    phrases={phrases}
                    presentationConfig={presentationConfig}
                    collectionName={`${templateData?.name || groupId} (${selectedInputLang} → ${selectedTargetLang})`}
                    setPhrases={async (phrases: Phrase[]) => setPhrases(phrases)}
                    initialFullscreen={isMobile}
                    readOnly={readOnly}
                    setPresentationConfig={async (config: Partial<PresentationConfig>) => {
                        const newConfig = { ...presentationConfig, ...config };
                        setBasePresentationConfig(newConfig);

                        // Handle template-level fields if admin
                        if (isAdmin && groupId && user) {
                            const templateLevelUpdates: Partial<PresentationConfig> = {};

                            // Handle background removal (bgImage set to null)
                            if ('bgImage' in config && config.bgImage === null && presentationConfig.bgImage) {
                                const oldBgImage = presentationConfig.bgImage;
                                // Delete from storage if Firebase URL
                                if (oldBgImage.includes('storage.googleapis.com')) {
                                    try {
                                        await deleteBackgroundMedia(user.uid, groupId as string, oldBgImage);
                                    } catch (deleteError) {
                                        console.error('Error deleting template background:', deleteError);
                                        // Continue even if deletion fails
                                    }
                                }
                                templateLevelUpdates.bgImage = null;
                            }

                            // Dynamically handle all template-level fields
                            templateLevelFields.forEach(field => {
                                if (field in config && config[field] !== undefined) {
                                    (templateLevelUpdates as any)[field] = config[field];
                                }
                            });

                            // Persist template-level fields to Firestore
                            if (Object.keys(templateLevelUpdates).length > 0) {
                                try {
                                    const templatesRef = collection(firestore, 'templates');
                                    const groupQuery = query(templatesRef, where('groupId', '==', groupId));
                                    const groupSnapshot = await getDocs(groupQuery);

                                    const updatePromises = groupSnapshot.docs.map(docSnapshot =>
                                        updateDoc(doc(firestore, 'templates', docSnapshot.id), {
                                            presentationConfig: {
                                                ...(docSnapshot.data().presentationConfig || {}),
                                                ...templateLevelUpdates,
                                            },
                                        })
                                    );

                                    await Promise.all(updatePromises);

                                    // Update template presentation config state
                                    setTemplatePresentationConfig(prev => prev ? { ...prev, ...templateLevelUpdates } : prev);
                                } catch (persistError) {
                                    console.error('Error saving template-level config to Firestore:', persistError);
                                    toast.error('Config applied locally but failed to save for this template. Please try again.');
                                }
                            }
                        }

                        // Save user-level config (exclude template-level fields)
                        const userConfig = Object.keys(newConfig).reduce((acc, key) => {
                            if (!templateLevelFields.includes(key as keyof PresentationConfig)) {
                                (acc as any)[key] = (newConfig as any)[key];
                            }
                            return acc;
                        }, {} as Partial<PresentationConfig>);

                        // Update local user config via hook setter and debounced save
                        setBasePresentationConfig(userConfig);
                        debouncedSaveConfig(userConfig as PresentationConfig);
                    }}
                    methodsRef={methodsRef}
                    handleImageUpload={isAdmin ? handleTemplateBackgroundUpload : undefined}
                    collectionId={groupId as string}
                    stickyHeaderContent={collectionHeaderContent}
                    showImportPhrases={true}
                    itemType="template"
                    pathId={currentPathId}
                    pathIndex={currentPathIndex}
                    onNavigateToNextInPath={currentPathId && currentPathIndex !== undefined ? handleNavigateToNextInPath : undefined}
                    onCompleted={(userId, collectionId, inputLang, targetLang) => {
                        if (inputLang && targetLang) {
                            markCompleted(userId, collectionId, inputLang, targetLang);
                        }
                    }}
                />
            ) : (
                <div className="flex items-center justify-center h-full">
                    <div className="text-center">
                        <h2 className="text-xl font-semibold mb-2">No phrases found</h2>
                        <p className="text-muted-foreground">
                            No phrases available for {getLanguageLabel(selectedInputLang)} to {getLanguageLabel(selectedTargetLang)} translation.
                        </p>
                        {availableLanguages.length > 1 && (
                            <div className="flex items-center gap-4 mt-4 justify-center">
                                <Select
                                    value={selectedInputLang}
                                    onChange={(e) => setSelectedInputLang(e.target.value)}
                                    options={availableLanguages.map(lang => ({
                                        value: lang,
                                        label: getLanguageLabel(lang)
                                    }))}
                                    className="min-w-[200px]"
                                />
                                <span className="text-sm">→</span>
                                <Select
                                    value={selectedTargetLang}
                                    onChange={(e) => setSelectedTargetLang(e.target.value)}
                                    options={availableLanguages.map(lang => ({
                                        value: lang,
                                        label: getLanguageLabel(lang)
                                    }))}
                                    className="min-w-[200px]"
                                />
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
