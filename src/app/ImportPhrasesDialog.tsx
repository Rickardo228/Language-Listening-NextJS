'use client'

import { useState, useRef, useEffect } from 'react'
import { languageOptions, CollectionType } from './types'
import { X, Plus, Lightbulb, Sparkles } from 'lucide-react'
import { API_BASE_URL } from './consts'
import { Dialog } from '@headlessui/react'
import { LanguageSelector } from './components/LanguageSelector'
import { trackGeneratePhrases } from '../lib/mixpanelClient'
import { Combobox, Input, Select } from './components/ui'
import { toast } from 'sonner'
import { AIGenerateInput } from './components/AIGenerateInput'
import { AnimatePresence, motion } from 'framer-motion'
import { useUser } from './contexts/UserContext'
import { buildSuggestedPrompt, getSuggestedTopics, SuggestedTopic } from './utils/suggestedTopics'

const motivationalPhrases = [
    "Every word brings you closer to fluency",
    "Building your language superpowers",
    "Your future self will thank you",
    "Great things take a little patience",
    "Unlocking a whole new world for you",
    "One phrase at a time, one step at a time",
    "Making these phrases sound perfect",
    "You're investing in yourself right now",
    "Language is the road map of a culture",
    "Almost there, hang tight!",
]

const CREATE_NEW_COLLECTION_VALUE = '__create_new__'

export interface ImportPhrasesDialogProps {
    isOpen: boolean
    onClose: () => void
    inputLang: string
    setInputLang: (lang: string) => void
    targetLang: string
    setTargetLang: (lang: string) => void
    phrasesInput: string
    setPhrasesInput: (input: string) => void
    loading: boolean
    processProgress?: { completed: number; total: number } | null
    collectionsLoading?: boolean
    onProcess?: (prompt?: string, inputLang?: string, targetLang?: string, collectionType?: CollectionType) => Promise<void>
    onAddToCollection?: (inputLang?: string, targetLang?: string, isSwapped?: boolean) => Promise<void>
    variant?: 'default' | 'like' | 'quickAdd'
    collectionOptions?: Array<{ value: string; label: string }>
    selectedCollectionId?: string
    setSelectedCollectionId?: (id: string) => void
    onCreateCollection?: (name: string) => Promise<void>
    autoFocusCollection?: boolean
    onCollectionSubmit?: () => void
    submitDisabled?: boolean
    defaultCollectionId?: string | null
    onSetDefaultCollection?: () => void
    showSuggestedTopicChips?: boolean
    showSuggestedTopicChipsForSelectedList?: boolean
}

export function ImportPhrasesDialog({
    isOpen,
    onClose,
    inputLang,
    setInputLang,
    targetLang,
    setTargetLang,
    phrasesInput,
    setPhrasesInput,
    loading,
    processProgress,
    collectionsLoading = false,
    onProcess,
    onAddToCollection,
    variant = 'default',
    collectionOptions = [],
    selectedCollectionId,
    setSelectedCollectionId,
    onCreateCollection,
    autoFocusCollection = false,
    onCollectionSubmit,
    submitDisabled = false,
    defaultCollectionId,
    onSetDefaultCollection,
    showSuggestedTopicChips = true,
    showSuggestedTopicChipsForSelectedList = true,
}: ImportPhrasesDialogProps) {
    const [prompt, setPrompt] = useState('')
    const [generatingPhrases, setGeneratingPhrases] = useState(false)
    const [collectionType, setCollectionType] = useState<CollectionType>('phrases')
    const [isSwapped, setIsSwapped] = useState(false)
    const [isFetchingUrl, setIsFetchingUrl] = useState(false)
    const [isMobile, setIsMobile] = useState(false)
    const [isMac, setIsMac] = useState(false)
    const [motivationalIndex, setMotivationalIndex] = useState(() => Math.floor(Math.random() * motivationalPhrases.length))
    const [isMagicOpen, setIsMagicOpen] = useState(false)
    const [activeTopic, setActiveTopic] = useState<string | null>(null)
    const [suggestedTopics, setSuggestedTopics] = useState<SuggestedTopic[]>([])
    const textareaRef = useRef<HTMLTextAreaElement>(null)
    const proxyInputRef = useRef<HTMLInputElement>(null)
    const { userProfile } = useUser()

    // On mobile, browsers block async .focus() calls. To keep the keyboard open,
    // we synchronously focus a tiny proxy input during the tap, then transfer
    // focus to the real target after it renders.
    const claimFocusForMobile = (targetRef: React.RefObject<HTMLElement | null>) => {
        proxyInputRef.current?.focus()
        requestAnimationFrame(() => {
            targetRef.current?.focus()
        })
    }

    useEffect(() => {
        const checkMobile = () => {
            setIsMobile(window.innerWidth < 768 || 'ontouchstart' in window)
        }
        checkMobile()
        setIsMac(navigator.platform.toUpperCase().includes('MAC'))
        window.addEventListener('resize', checkMobile)
        return () => window.removeEventListener('resize', checkMobile)
    }, [])
    useEffect(() => {
        if (!isOpen) return;
        setSuggestedTopics(getSuggestedTopics({
            contentPreferences: userProfile?.contentPreferences,
            abilityLevel: userProfile?.abilityLevel,
            count: 2,
        }));
    }, [isOpen, userProfile?.contentPreferences, userProfile?.abilityLevel]);

    // On mobile, HeadlessUI's initialFocus fires async and gets blocked.
    // Use the proxy input to claim focus synchronously.
    useEffect(() => {
        if (!isOpen || !isMobile) return
        claimFocusForMobile(textareaRef)
    }, [isOpen, isMobile])

    const isProcessing = !!processProgress
    useEffect(() => {
        if (!isProcessing) return
        setMotivationalIndex(Math.floor(Math.random() * motivationalPhrases.length))
        const interval = setInterval(() => {
            setMotivationalIndex(i => (i + 1) % motivationalPhrases.length)
        }, 10000)
        return () => clearInterval(interval)
    }, [isProcessing])
    const inputLangLabel = (languageOptions.find(lang => lang.code === (isSwapped ? targetLang : inputLang))?.label || inputLang).split(' (')[0];
    const isLikeVariant = variant === 'like';
    const isQuickAddVariant = variant === 'quickAdd';
    const showCollectionPicker = isLikeVariant || isQuickAddVariant;
    const showSuggestedTopics = showSuggestedTopicChips
        && !phrasesInput.trim()
        && (showSuggestedTopicChipsForSelectedList || !selectedCollectionId || selectedCollectionId === CREATE_NEW_COLLECTION_VALUE);
    const addToCollectionDisabled = loading
        || submitDisabled
        || !phrasesInput.trim()
        || (showCollectionPicker && collectionOptions.length > 0 && !selectedCollectionId);

    const generatePhrases = async (promptValue: string, allowEmpty = false) => {
        const normalizedPrompt = promptValue.trim();
        if (!allowEmpty && !normalizedPrompt) return;
        const effectivePrompt = normalizedPrompt || 'Generate useful phrases';

        // Detect if prompt is a URL
        const urlRegex = /^https?:\/\/.+/i;
        const isUrl = urlRegex.test(effectivePrompt);

        setGeneratingPhrases(true);
        setIsFetchingUrl(isUrl);

        try {
            // If languages are swapped, we need to swap them for generation
            const processInputLang = isSwapped ? targetLang : inputLang;
            const processTargetLang = isSwapped ? inputLang : targetLang;

            // Choose endpoint based on whether it's a URL
            const endpoint = isUrl ? '/fetch-url-content' : '/generate-phrases';
            const bodyData = isUrl ? {
                url: effectivePrompt,
                inputLang: isSwapped ? targetLang : inputLang,
                targetLang: isSwapped ? inputLang : targetLang,
                type: collectionType
            } : {
                prompt: effectivePrompt,
                inputLang: isSwapped ? targetLang : inputLang,
                targetLang: isSwapped ? inputLang : targetLang,
                type: collectionType
            };

            const response = await fetch(`${API_BASE_URL}${endpoint}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData),
            });

            const data = await response.json();

            if (!response.ok) {
                // Handle error response
                throw new Error(data.error || 'Failed to fetch content');
            }

            if (data.phrases) {
                setPhrasesInput(data.phrases);

                // Track phrase generation event
                const phraseCount = data.phrases.split('\n').filter((line: string) => line.trim()).length;
                trackGeneratePhrases(
                    isUrl ? `URL: ${effectivePrompt}` : effectivePrompt,
                    processInputLang,
                    processTargetLang,
                    collectionType,
                    phraseCount
                );
            }
        } catch (error) {
            console.error('Error generating phrases:', error);
            // Show error to user
            toast.error(error instanceof Error ? error.message : 'Failed to generate phrases. Please try again.');

        } finally {
            setGeneratingPhrases(false);
            setIsFetchingUrl(false);
        }
    };

    const handleGeneratePhrases = async () => {
        await generatePhrases(prompt, false);
    };

    const handleMagicGenerate = async (
        promptValue: string,
        topic?: string
    ) => {
        if (topic) setActiveTopic(topic);
        await generatePhrases(promptValue, true);
        setActiveTopic(null);
        setIsMagicOpen(false);
    };

    const handleSubmit = async () => {
        if (onAddToCollection) {
            if (addToCollectionDisabled) return;
            await onAddToCollection(inputLang, targetLang, isSwapped);
            onClose();
        } else if (onProcess) {
            if (loading || !phrasesInput.trim()) return;
            await onProcess(prompt, inputLang, targetLang, collectionType);
            onClose();
        }
    };

    const handleTextareaKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
        if (e.key === 'Enter') {
            if (isMobile) {
                // On mobile, Enter adds new line (default behavior)
                return;
            }
            // On desktop: Cmd/Ctrl+Enter adds new line, plain Enter submits
            if (e.ctrlKey || e.metaKey) {
                // Manually insert newline at cursor position
                e.preventDefault();
                const textarea = e.currentTarget;
                const start = textarea.selectionStart;
                const end = textarea.selectionEnd;
                const newValue = phrasesInput.slice(0, start) + '\n' + phrasesInput.slice(end);
                setPhrasesInput(newValue);
                // Move cursor after the newline
                setTimeout(() => {
                    textarea.selectionStart = textarea.selectionEnd = start + 1;
                }, 0);
                return;
            }
            e.preventDefault();
            handleSubmit();
        }
    };

    return (<>
        {/* Invisible proxy input to claim keyboard focus on mobile */}
        <input
            ref={proxyInputRef}
            aria-hidden="true"
            readOnly
            className="fixed opacity-0 -z-10"
            style={{ position: 'fixed', top: '-9999px', left: '-9999px', width: '20px', height: '20px' }}
        />
        <Dialog open={isOpen} onClose={onClose} className="relative z-[400]" initialFocus={textareaRef}>
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className={`bg-background text-foreground p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw] ${showCollectionPicker ? 'overflow-visible' : 'overflow-auto max-h-[90vh]'} border`}>
                    {processProgress ? (
                        <div className="flex flex-col items-center py-8 px-4 gap-4">
                            <div className="h-6 relative w-full">
                                <AnimatePresence mode="wait">
                                    <motion.p
                                        key={motivationalIndex}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        exit={{ opacity: 0, y: -8 }}
                                        transition={{ duration: 0.3 }}
                                        className="text-sm text-muted-foreground italic text-center absolute inset-0"
                                    >
                                        {motivationalPhrases[motivationalIndex]}
                                    </motion.p>
                                </AnimatePresence>
                            </div>
                            <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                            <div className="text-center">
                                <p className="text-lg font-semibold">Translating phrases</p>
                                <p className="text-sm text-muted-foreground mt-1">
                                    {processProgress.completed} of {processProgress.total} phrases
                                </p>
                            </div>
                            <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                                <div
                                    className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                                    style={{ width: `${Math.round((processProgress.completed / processProgress.total) * 100)}%` }}
                                />
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {Math.round((processProgress.completed / processProgress.total) * 100)}%
                            </p>
                        </div>
                    ) : (<>
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-bold">
                                {isLikeVariant ? 'Add to List' : isQuickAddVariant ? 'Add Phrases' : (onAddToCollection ? 'Add Phrases' : 'Create New List')}
                            </h2>
                            <button
                                onClick={onClose}
                                className="p-2 text-muted-foreground hover:text-foreground"
                                title="Close"
                            >
                                <X className="h-6 w-6" />
                            </button>
                        </div>

                        <div className="space-y-4">
                            <div className="flex flex-col gap-4">
                                {!onAddToCollection && !isLikeVariant && !isQuickAddVariant && (
                                    <Input
                                        label="List Name"
                                        type="text"
                                        value={prompt}
                                        onChange={(e) => setPrompt(e.target.value)}
                                        placeholder="Enter a name or paste a URL (YouTube/website)..."
                                        disabled={loading}
                                    />
                                )}
                                {!isLikeVariant && (
                                    <LanguageSelector
                                        inputLang={inputLang}
                                        setInputLang={setInputLang}
                                        targetLang={targetLang}
                                        setTargetLang={setTargetLang}
                                        direction="row"
                                        mode={isQuickAddVariant ? 'editable' : (onAddToCollection ? 'locked' : 'editable')}
                                        disabled={loading}
                                        isSwapped={onAddToCollection && !isQuickAddVariant ? isSwapped : undefined}
                                        onSwap={onAddToCollection && !isQuickAddVariant
                                            ? () => setIsSwapped(!isSwapped)
                                            : () => {
                                                const temp = inputLang;
                                                setInputLang(targetLang);
                                                setTargetLang(temp);
                                            }}
                                    />
                                )}
                                {showCollectionPicker && (
                                    <div className="space-y-2">
                                        {collectionsLoading ? (
                                            <div>
                                                <div className="h-4 w-16 bg-secondary/40 rounded animate-pulse mb-2" />
                                                <div className="h-10 w-full bg-secondary/40 rounded animate-pulse" />
                                            </div>
                                        ) : collectionOptions.length > 0 || onCreateCollection ? (
                                            <Combobox
                                                label="List"
                                                value={selectedCollectionId || ''}
                                                onChange={(value) => setSelectedCollectionId?.(value)}
                                                disabled={loading}
                                                options={collectionOptions}
                                                placeholder="Select or create a list"
                                                portalled={true}
                                                creatable={Boolean(onCreateCollection)}
                                                onCreateOption={onCreateCollection}
                                                createLabel="Create list"
                                                autoFocus={autoFocusCollection}
                                                onSubmit={onCollectionSubmit}
                                            />
                                        ) : (
                                            <div>
                                                <label className="block text-sm font-medium mb-1">Collection</label>
                                                <div className="text-sm text-muted-foreground">Liked Phrases</div>
                                            </div>
                                        )}
                                        {onSetDefaultCollection && selectedCollectionId && selectedCollectionId !== defaultCollectionId && (
                                            <button
                                                type="button"
                                                onClick={onSetDefaultCollection}
                                                className="text-xs text-primary hover:underline"
                                            >
                                                Set as default
                                            </button>
                                        )}
                                    </div>
                                )}
                                {prompt.trim() && onProcess && (
                                    <button
                                        onClick={handleGeneratePhrases}
                                        disabled={generatingPhrases || !prompt.trim()}
                                        className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:bg-secondary/90 disabled:bg-gray-400 whitespace-nowrap"
                                    >
                                        {generatingPhrases ? (
                                            <div className="flex items-center gap-2">
                                                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                                                <span>{isFetchingUrl ? 'Fetching from URL...' : 'Generating...'}</span>
                                            </div>
                                        ) : (
                                            <div className="flex items-center gap-1">
                                                <Lightbulb className="w-5 h-5" />
                                                Generate with AI
                                            </div>
                                        )}
                                    </button>
                                )}
                                {!isLikeVariant && (
                                    <div>
                                        <label className="block text-sm font-medium mb-1">Phrases</label>
                                        <div className="relative">
                                            <textarea
                                                ref={textareaRef}
                                                value={phrasesInput}
                                                onChange={(e) => setPhrasesInput(e.target.value)}
                                                onKeyDown={handleTextareaKeyDown}
                                                className="w-full h-32 p-2 pr-20 pb-12 rounded-md border bg-background resize-none"
                                                placeholder={`Enter phrases or paste text in ${inputLangLabel} here...`}
                                                disabled={loading}
                                                autoFocus
                                            />
                                            <div className="absolute bottom-2 right-2 flex items-center gap-2 justify-end">
                                                {showSuggestedTopics && (
                                                    <div className="flex items-center gap-2">
                                                        {suggestedTopics.map(topic => (
                                                            <button
                                                                key={topic.id}
                                                                type="button"
                                                                onClick={() => {
                                                                    const promptText = buildSuggestedPrompt(topic, userProfile?.abilityLevel);
                                                                    setPrompt(topic.label);
                                                                    handleMagicGenerate(promptText, topic.id);
                                                                }}
                                                                className="px-2.5 py-1 text-xs rounded-full bg-secondary/80 text-secondary-foreground hover:bg-secondary disabled:opacity-60"
                                                                disabled={generatingPhrases}
                                                            >
                                                                {generatingPhrases && activeTopic === topic.id ? 'Generating...' : topic.label}
                                                            </button>
                                                        ))}
                                                    </div>
                                                )}
                                                <button
                                                    type="button"
                                                    onClick={() => setIsMagicOpen(true)}
                                                    className="h-8 w-8 rounded-full bg-secondary text-secondary-foreground hover:bg-secondary/90 flex items-center justify-center shadow"
                                                    title="Generate with AI"
                                                >
                                                    <Sparkles className="h-4 w-4" />
                                                </button>
                                            </div>
                                        </div>
                                        {!isMobile && (
                                            <p className="text-xs text-muted-foreground mt-1">
                                                {isMac ? '⌘' : 'Ctrl'}+Enter for new line
                                            </p>
                                        )}
                                    </div>
                                )}

                                <div className="flex gap-2">
                                    {onAddToCollection ? (
                                        <button
                                            onClick={async () => {
                                                await onAddToCollection?.(inputLang, targetLang, isSwapped)
                                                onClose()
                                            }}
                                            disabled={addToCollectionDisabled}
                                            className="flex-1 px-4 h-[50px] bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-md"
                                        >
                                            <div className="flex items-center gap-2 justify-center">
                                                <Plus className="h-5 w-5" />
                                                <span className="text-sm font-semibold">
                                                    {isLikeVariant ? (loading ? 'Adding...' : 'Add Phrase') : (loading ? 'Adding...' : 'Add Phrases')}
                                                </span>
                                            </div>
                                        </button>
                                    ) : (
                                        <button
                                            onClick={async () => {
                                                await onProcess?.(prompt, inputLang, targetLang, collectionType)
                                                onClose()
                                            }}
                                            disabled={loading || !phrasesInput.trim()}
                                            className="flex-1 bg-primary text-primary-foreground px-4 py-2 rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed"
                                        >
                                            {loading ? 'Processing...' : 'Create List'}
                                        </button>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>)}
                </Dialog.Panel>
            </div>
            <Dialog open={isMagicOpen} onClose={() => setIsMagicOpen(false)} className="relative z-[500]">
                <div className="fixed inset-0 bg-black/50" />
                <div className="fixed inset-0 flex items-center justify-center">
                    <Dialog.Panel className="bg-background text-foreground p-4 rounded-lg shadow-lg w-[420px] max-w-[90vw] border">
                        <div className="flex justify-between items-center mb-3">
                            <h3 className="text-lg font-semibold">Generate with AI</h3>
                            <button
                                type="button"
                                onClick={() => setIsMagicOpen(false)}
                                className="p-1 text-muted-foreground hover:text-foreground"
                                title="Close"
                            >
                                <X className="h-5 w-5" />
                            </button>
                        </div>
                        <div className="[&_input]:pr-28">
                            <AIGenerateInput
                                inputLang={isSwapped ? targetLang : inputLang}
                                targetLang={isSwapped ? inputLang : targetLang}
                                collectionType={collectionType}
                                onGenerate={(phrases) => {
                                    setPhrasesInput(phrases);
                                    setIsMagicOpen(false);
                                }}
                                disabled={loading}
                                placeholder="e.g. ordering coffee..."
                            />
                        </div>
                    </Dialog.Panel>
                </div>
            </Dialog>
        </Dialog>
    </>)
}
