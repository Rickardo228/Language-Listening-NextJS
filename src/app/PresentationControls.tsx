import { Maximize2, Settings, Pause, Play, Repeat } from 'lucide-react';
import { SettingsModal } from './SettingsModal';
import { PresentationConfig } from './types';
import { useState } from 'react';
import { ConfigFieldDefinition } from './configDefinitions';

interface PresentationControlsProps {
    fullscreen: boolean;
    setFullscreen: (value: boolean) => void;
    recordScreen: boolean;
    setRecordScreen: (value: boolean) => void;
    stopScreenRecording: () => void;
    handleReplay: () => void;
    hasPhrasesLoaded: boolean;
    configName: string;
    setConfigName: (name: string) => void;
    onSaveConfig: () => void;
    presentationConfig: PresentationConfig;
    setPresentationConfig: (config: PresentationConfig) => void;
    presentationConfigDefinition: ConfigFieldDefinition[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
    paused: boolean;
    onPause: () => void;
    onPlay: () => void;
}

export function PresentationControls({
    fullscreen,
    setFullscreen,
    recordScreen,
    setRecordScreen,
    stopScreenRecording,
    handleReplay,
    hasPhrasesLoaded,
    configName,
    setConfigName,
    onSaveConfig,
    presentationConfig,
    setPresentationConfig,
    presentationConfigDefinition,
    handleImageUpload,
    paused,
    onPause,
    onPlay
}: PresentationControlsProps) {
    const [settingsOpen, setSettingsOpen] = useState(false);

    return (
        <>
            <div className="flex mb-2 items-center gap-2">
                <button
                    onClick={() => setFullscreen(!fullscreen)}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                    title={fullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
                >
                    <Maximize2 className="h-8 w-8 text-gray-700" />
                </button>
                <button
                    onClick={() => paused ? onPlay() : onPause()}
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                    title={paused ? "Resume" : "Pause"}
                >
                    {paused ?
                        <Play className="h-8 w-8 text-gray-700" /> :
                        <Pause className="h-8 w-8 text-gray-700" />
                    }
                </button>
                {hasPhrasesLoaded && (
                    <button
                        onClick={handleReplay}
                        className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                        title="Replay"
                    >
                        <Repeat className="h-8 w-8 text-gray-700" />
                    </button>
                )}
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
                    className="p-2 bg-gray-200 rounded hover:bg-gray-300"
                    title="Settings"
                >
                    <Settings className="h-8 w-8 text-gray-700" />
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
                presentationConfigDefinition={presentationConfigDefinition}
                handleImageUpload={handleImageUpload}
            />
        </>
    );
} 