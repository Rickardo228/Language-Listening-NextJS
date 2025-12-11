import { useState, useEffect } from 'react';
import { API_BASE_URL } from './consts';
import { Phrase } from './types';
import { Modal, Select, Button } from './components/ui';

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Select Voices"
            size="sm"
        >
            {isLoading ? (
                <div className="flex justify-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                </div>
            ) : (
                <>
                    <div className="space-y-4">
                        <Select
                            label={`Input Language Voice (${inputLang})`}
                            value={selectedInputVoice}
                            onChange={(e) => setSelectedInputVoice(e.target.value)}
                            options={inputVoices.map(voice => ({
                                value: voice.name,
                                label: `${voice.name} (${voice.gender})`
                            }))}
                        />

                        <Select
                            label={`Target Language Voice (${targetLang})`}
                            value={selectedTargetVoice}
                            onChange={(e) => setSelectedTargetVoice(e.target.value)}
                            options={targetVoices.map(voice => ({
                                value: voice.name,
                                label: `${voice.name} (${voice.gender})`
                            }))}
                        />
                    </div>

                    <div className="flex justify-end gap-2 mt-6">
                        <Button
                            variant="secondary"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </Button>
                        <Button
                            variant="primary"
                            onClick={async () => {
                                setIsSaving(true);
                                try {
                                    await onSave(selectedInputVoice, selectedTargetVoice);
                                } finally {
                                    setIsSaving(false);
                                }
                            }}
                            isLoading={isSaving}
                            loadingText="Saving..."
                        >
                            Save Changes
                        </Button>
                    </div>
                </>
            )}
        </Modal>
    );
} 