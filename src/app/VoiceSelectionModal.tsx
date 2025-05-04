import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { API_BASE_URL } from './consts';

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
}

export function VoiceSelectionModal({ isOpen, onClose, inputLang, targetLang, onSave }: VoiceSelectionModalProps) {
    const [inputVoices, setInputVoices] = useState<Voice[]>([]);
    const [targetVoices, setTargetVoices] = useState<Voice[]>([]);
    const [selectedInputVoice, setSelectedInputVoice] = useState<string>('');
    const [selectedTargetVoice, setSelectedTargetVoice] = useState<string>('');
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            fetchVoices();
        }
    }, [isOpen, inputLang, targetLang]);

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

            // Set default voices if available
            if (data.inputVoices.length > 0) {
                setSelectedInputVoice(data.inputVoices[0].name);
            }
            if (data.targetVoices.length > 0) {
                setSelectedTargetVoice(data.targetVoices[0].name);
            }
        } catch (error) {
            console.error('Error fetching voices:', error);
        }
        setIsLoading(false);
    };

    if (!isOpen) return null;

    return createPortal(
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 font-sans">
            <div className="bg-background rounded-lg p-6 w-96">
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
                                className="px-4 py-2 text-sm rounded hover:bg-secondary"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => onSave(selectedInputVoice, selectedTargetVoice)}
                                className="px-4 py-2 text-sm bg-primary text-primary-foreground rounded hover:bg-primary/90"
                            >
                                Save Changes
                            </button>
                        </div>
                    </>
                )}
            </div>
        </div>,
        document.body
    );
} 