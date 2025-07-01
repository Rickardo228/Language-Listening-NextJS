import { Maximize2, Pause, Play, Repeat, ArrowLeft, ArrowRight, Settings } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { PresentationConfig } from './types';
import { useState } from 'react';
import { getFlagEmoji } from './utils/languageUtils';
import { playbackSpeedOptions } from './configDefinitions';

interface PresentationControlsProps {
    fullscreen: boolean;
    setFullscreen: (value: boolean) => void;
    recordScreen: boolean;
    stopScreenRecording: () => void;
    handleReplay: () => void;
    hasPhrasesLoaded: boolean;
    configName: string;
    setConfigName: (name: string) => void;
    onSaveConfig: () => void;
    presentationConfig: PresentationConfig;
    setPresentationConfig: (config: PresentationConfig) => void;
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paused: boolean;
    onPause: () => void;
    onPlay: () => void;
    onPrevious: () => void;
    onNext: () => void;
    canGoBack: boolean;
    canGoForward: boolean;
    inputLang?: string;
    targetLang?: string;
}

export function PresentationControls({
    fullscreen,
    setFullscreen,
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
    targetLang
}: PresentationControlsProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);

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

    return (
        <>
            <div className="flex mb-2 items-center gap-2">
                <button
                    onClick={() => setFullscreen(!fullscreen)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    title={fullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
                >
                    <Maximize2 className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={() => paused ? onPlay() : onPause()}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    title={paused ? "Resume" : "Pause"}
                >
                    {paused ?
                        <Play className="h-8 w-8 text-gray-700 dark:text-gray-300" /> :
                        <Pause className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                    }
                </button>
                {hasPhrasesLoaded && (
                    <button
                        onClick={handleReplay}
                        className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                        title="Replay"
                    >
                        <Repeat className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                    </button>
                )}
                <button
                    onClick={() => handleSpeedToggle('input')}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 h-12"
                    title={`Input Language Speed: ${getSpeedLabel(presentationConfig.inputPlaybackSpeed || 1.0)}`}
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
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 flex items-center gap-1 h-12"
                    title={`Output Language Speed: ${getSpeedLabel(presentationConfig.outputPlaybackSpeed || 1.0)}`}
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
                    onClick={() => setSettingsOpen(true)}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600"
                    title="Settings"
                >
                    <Settings className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={onPrevious}
                    disabled={!canGoBack}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Previous Phrase"
                >
                    <ArrowLeft className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
                <button
                    onClick={onNext}
                    disabled={!canGoForward}
                    className="p-2 bg-gray-200 dark:bg-gray-700 rounded hover:bg-gray-300 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
                    title="Next Phrase"
                >
                    <ArrowRight className="h-8 w-8 text-gray-700 dark:text-gray-300" />
                </button>
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
            />
        </>
    );
} 