import { Pause, Play, Maximize2, Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { PresentationConfig } from './types';
import { useState } from 'react';

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
                    onClick={(e) => {
                        e.stopPropagation();
                        setSettingsOpen(true);
                    }}
                    className="hidden md:flex p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Settings"
                >
                    <Settings className="h-6 w-6 text-gray-700 dark:text-gray-300" />
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
                isOpen={settingsOpen || false}
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