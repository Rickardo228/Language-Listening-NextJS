import { useState, useEffect } from 'react';
import { API_BASE_URL } from './consts';
import { Phrase } from './types';
import { Dialog } from '@headlessui/react';

interface Voice {
    name: string;
    languageCode: string;
    gender: string;
}

interface VoiceSelectionModalProps {
    isOpen: boolean;
    onClose: () => void;
    inputLang: string;
    targetLang: string;
    onSave: (inputVoice: string, targetVoice: string) => void;
    phrases?: Phrase[];
}

export function VoiceSelectionModal({ isOpen, onClose, inputLang, targetLang, onSave, phrases }: VoiceSelectionModalProps) {
    const [inputVoices, setInputVoices] = useState<Voice[]>([]);
    const [targetVoices, setTargetVoices] = useState<Voice[]>([]);
    const [selectedInputVoice, setSelectedInputVoice] = useState<string>('');
    const [selectedTargetVoice, setSelectedTargetVoice] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    useEffect(() => {
        fetchVoices();
    }, [inputLang, targetLang]);

    const getDefaultVoice = (languageCode: string) => `${languageCode}-Standard-D`;

    const isValidVoiceForLanguage = (voice: Voice, languageCode: string) => {
        return voice.languageCode === languageCode;
    };

    const findValidVoice = (voices: Voice[], languageCode: string, preferredVoice?: string) => {
        // First try to find the preferred voice if it exists and is valid
        if (preferredVoice) {
            const preferred = voices.find(v => v.name === preferredVoice && isValidVoiceForLanguage(v, languageCode));
            if (preferred) return preferred.name;
        }

        // Then try to find any valid voice for the language
        const validVoice = voices.find(v => isValidVoiceForLanguage(v, languageCode));
        if (validVoice) return validVoice.name;

        // Fallback to default voice name
        return getDefaultVoice(languageCode);
    };

    const fetchVoices = async () => {
        setIsLoading(true);
        try {
            const response = await fetch(`${API_BASE_URL}/voices`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    inputLang,
                    targetLang,
                }),
            });
            const data = await response.json();
            setInputVoices(data.inputVoices);
            setTargetVoices(data.targetVoices);

            // Get existing voices from the first phrase if available
            const firstPhrase = phrases?.[0];
            const existingInputVoice = firstPhrase?.inputVoice;
            const existingTargetVoice = firstPhrase?.targetVoice;

            // Set default voices with validation
            if (data.inputVoices.length > 0) {
                const validInputVoice = findValidVoice(data.inputVoices, inputLang, existingInputVoice);
                setSelectedInputVoice(validInputVoice);
            }
            if (data.targetVoices.length > 0) {
                const validTargetVoice = findValidVoice(data.targetVoices, targetLang, existingTargetVoice);
                setSelectedTargetVoice(validTargetVoice);
            }
        } catch (error) {
            console.error('Error fetching voices:', error);
        }
        setIsLoading(false);
    };


    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50 font-sans">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="bg-background rounded-lg p-6 w-96">
                <h2 className="text-xl font-semibold mb-4">Select Voices</h2>

                {isLoading ? (
                    <div className="flex justify-center">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                    </div>
                ) : (
                    <>
                        <div className="mb-4">
                            <label className="block text-sm font-medium mb-2">
                                Input Language Voice ({inputLang})
                            </label>
                            <select
                                value={selectedInputVoice}
                                onChange={(e) => setSelectedInputVoice(e.target.value)}
                                className="w-full p-2 rounded border border-border bg-background"
                            >
                                {inputVoices.map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.gender})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="mb-6">
                            <label className="block text-sm font-medium mb-2">
                                Target Language Voice ({targetLang})
                            </label>
                            <select
                                value={selectedTargetVoice}
                                onChange={(e) => setSelectedTargetVoice(e.target.value)}
                                className="w-full p-2 rounded border border-border bg-background"
                            >
                                {targetVoices.map((voice) => (
                                    <option key={voice.name} value={voice.name}>
                                        {voice.name} ({voice.gender})
                                    </option>
                                ))}
                            </select>
                        </div>

                        <div className="flex justify-end gap-2">
                            <button
                                onClick={onClose}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm rounded hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={async () => {
                                    setIsSaving(true);
                                    try {
                                        await onSave(selectedInputVoice, selectedTargetVoice);
                                    } finally {
                                        setIsSaving(false);
                                    }
                                }}
                                disabled={isSaving}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                            >
                                {isSaving ? (
                                    <>
                                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary-foreground"></div>
                                        Saving...
                                    </>
                                ) : (
                                    'Save Changes'
                                )}
                            </button>
                        </div>
                    </>
                )}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
} 