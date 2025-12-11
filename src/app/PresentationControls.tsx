import { Pause, Play, ArrowLeft, ArrowRight, Maximize2 } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { PresentationConfig } from './types';
import { useState } from 'react';
import { getFlagEmoji } from './utils/languageUtils';
import { playbackSpeedOptions } from './configDefinitions';
import { track } from '../lib/mixpanelClient';

interface PresentationControlsProps {
    recordScreen: boolean;
    stopScreenRecording: () => void;
    handleReplay: () => void;
    hasPhrasesLoaded: boolean;
    configName: string;
    setConfigName: (name: string) => void;
    onSaveConfig: () => void;
    presentationConfig: PresentationConfig;
    setPresentationConfig: (config: PresentationConfig) => void;
    handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paused: boolean;
    onPause: () => void;
    onPlay: () => void;
    onPrevious: () => void;
    onNext: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    inputLang?: string;
    targetLang?: string;
    setFullscreen?: (fullscreen: boolean) => void;
    settingsOpen?: boolean;
    setSettingsOpen?: (open: boolean) => void;
}

export function PresentationControls({
    recordScreen,
    stopScreenRecording,
    handleReplay,
    hasPhrasesLoaded,
    configName,
    setConfigName,
    onSaveConfig,
    presentationConfig,
    setPresentationConfig,
    handleImageUpload,
    paused,
    onPause,
    onPlay,
    onPrevious,
    onNext,
    canGoBack,
    canGoForward,
    inputLang,
    targetLang,
    setFullscreen,
    settingsOpen: externalSettingsOpen,
    setSettingsOpen: externalSetSettingsOpen,
}: PresentationControlsProps) {
    const [internalSettingsOpen, setInternalSettingsOpen] = useState(false);

    // Use external state if provided, otherwise use internal state
    const settingsOpen = externalSetSettingsOpen ? externalSettingsOpen : internalSettingsOpen;
    const setSettingsOpen = externalSetSettingsOpen || setInternalSettingsOpen;

    // Function to get language names from language codes
    const getLanguageName = (langCode: string): string => {
        const languageMap: Record<string, string> = {
            'en-GB': 'English (UK)',
            'en-US': 'English (US)',
            'en-AU': 'English (Australia)',
            'es-ES': 'Spanish',
            'fr-FR': 'French',
            'de-DE': 'German',
            'it-IT': 'Italian',
            'ja-JP': 'Japanese',
            'cmn-CN': 'Chinese',
            'pt-BR': 'Portuguese (Brazil)',
            'pt-PT': 'Portuguese (Portugal)',
            'el-GR': 'Greek',
            'pl-PL': 'Polish',
            'sv-SE': 'Swedish',
            'ru-RU': 'Russian',
            'hi-IN': 'Hindi',
            'ar-XA': 'Arabic',
            'bn-IN': 'Bengali',
            'id-ID': 'Indonesian',
            'ko-KR': 'Korean',
            'tr-TR': 'Turkish',
            'vi-VN': 'Vietnamese',
            'th-TH': 'Thai',
            'uk-UA': 'Ukrainian',
            'fr-CA': 'French (Canada)',
            'nl-NL': 'Dutch',
            'yue-HK': 'Cantonese',
            'ta-IN': 'Tamil'
        };
        return languageMap[langCode] || langCode;
    };

    const handleSpeedToggle = (speedType: 'input' | 'output') => {
        const currentSpeed = speedType === 'input'
            ? (presentationConfig.inputPlaybackSpeed || 1.0)
            : (presentationConfig.outputPlaybackSpeed || 1.0);

        const currentIndex = playbackSpeedOptions.findIndex(option => option.value === currentSpeed);
        const nextIndex = (currentIndex + 1) % playbackSpeedOptions.length;
        const newSpeed = playbackSpeedOptions[nextIndex].value;

        setPresentationConfig({
            ...presentationConfig,
            [speedType === 'input' ? 'inputPlaybackSpeed' : 'outputPlaybackSpeed']: newSpeed
        });
    };

    const getSpeedLabel = (speed: number) => {
        return playbackSpeedOptions.find(option => option.value === speed)?.label || '1.0x';
    };

    const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

    const handleControlsClick = () => {
        if (isMobile && setFullscreen) {
            setFullscreen(true);
        }
    };

    return (
        <>
            <div
                className="flex mb-2 mt-2 md:mt-0 items-center gap-2"
                onClick={handleControlsClick}
            >
                <button
                    onClick={() => paused ? onPlay() : onPause()}
                    className="px-4 h-[50px] mx-1 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white font-medium rounded-lg transition-all duration-200 shadow-md hover:shadow-lg transform hover:scale-105"
                    title={paused ? "Start Presentation" : "Complete Current Phrase"}
                >
                    <div className="flex items-center gap-2">
                        {paused ?
                            <Play className="h-5 w-5" /> :
                            <Pause className="h-5 w-5" />
                        }
                        <span className="text-sm font-semibold">
                            {paused ? "Play" : "Pause"}
                        </span>
                    </div>
                </button>
                <button
                    onClick={() => handleSpeedToggle('input')}
                    className="hidden md:flex p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 items-center gap-1 h-12"
                    title={`${inputLang ? getLanguageName(inputLang) : 'Input Language'} Speed: ${getSpeedLabel(presentationConfig.inputPlaybackSpeed || 1.0)}`}
                >
                    {/* <Zap className="h-4 w-4 text-gray-700 dark:text-gray-300" /> */}
                    {inputLang && (
                        <span className="text-sm">{getFlagEmoji(inputLang)}</span>
                    )}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {getSpeedLabel(presentationConfig.inputPlaybackSpeed || 1.0)}
                    </span>
                </button>
                <button
                    onClick={() => handleSpeedToggle('output')}
                    className="hidden md:flex p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 items-center gap-1 h-12"
                    title={`${targetLang ? getLanguageName(targetLang) : 'Output Language'} Speed: ${getSpeedLabel(presentationConfig.outputPlaybackSpeed || 1.0)}`}
                >
                    {/* <Zap className="h-4 w-4 text-gray-700 dark:text-gray-300" /> */}
                    {targetLang && (
                        <span className="text-sm">{getFlagEmoji(targetLang)}</span>
                    )}
                    <span className="text-xs font-medium text-gray-700 dark:text-gray-300">
                        {getSpeedLabel(presentationConfig.outputPlaybackSpeed || 1.0)}
                    </span>
                </button>
                {/* <label className="flex items-center gap-1">
                    <input
                        type="checkbox"
                        checked={recordScreen}
                        onChange={(e) => setRecordScreen(e.target.checked)}
                    />
                    Record Screen
                </label> */}
                {recordScreen &&
                    <button onClick={stopScreenRecording}>
                        Stop Recording
                    </button>
                }
                <button
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className="hidden md:flex p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Phrase"
                >
                    <ArrowLeft className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={onNext}
                    disabled={!canGoForward}
                    className="hidden md:flex p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Phrase"
                >
                    <ArrowRight className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
                {setFullscreen && (
                    <button
                        onClick={() => setFullscreen(true)}
                        className="ml-auto p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Enter Fullscreen"
                    >
                        <Maximize2 className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                    </button>
                )}
            </div>

            <SettingsModal
                isOpen={settingsOpen}
                onClose={() => setSettingsOpen(false)}
                configName={configName}
                setConfigName={setConfigName}
                onSaveConfig={onSaveConfig}
                presentationConfig={presentationConfig}
                setPresentationConfig={setPresentationConfig}
                handleImageUpload={handleImageUpload}
                inputLang={inputLang}
                targetLang={targetLang}
            />
        </>
    );
} 