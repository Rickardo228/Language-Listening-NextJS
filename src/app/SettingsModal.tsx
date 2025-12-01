import { X } from 'lucide-react';
import { PresentationConfig } from './types';
import ConfigFields from './ConfigFields';
import { presentationConfigDefinition } from './configDefinitions';
import { Dialog } from '@headlessui/react';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    configName: string;
    setConfigName: (name: string) => void;
    onSaveConfig: () => void;
    presentationConfig: PresentationConfig;
    setPresentationConfig: (config: PresentationConfig) => void;
    handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
    inputLang?: string;
    targetLang?: string;
}

export function SettingsModal({
    isOpen,
    onClose,
    // configName,
    // setConfigName,
    // onSaveConfig,
    presentationConfig,
    setPresentationConfig,
    handleImageUpload,
    inputLang,
    targetLang,
}: SettingsModalProps) {
    return (
        <Dialog open={isOpen} onClose={onClose} className="relative z-50 font-sans">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="bg-background text-foreground p-4 rounded-lg shadow-lg w-96 max-h-[90vh] flex flex-col">
                    <div className="flex justify-between items-center mb-4">
                        <h2 className="text-xl font-bold">Settings</h2>
                        <button
                            onClick={onClose}
                            className="p-2 text-muted-foreground hover:text-foreground"
                            title="Close Settings"
                        >
                            <X className="h-6 w-6" />
                        </button>
                    </div>
                    <div className="overflow-y-auto flex-1 pr-2">
                        <ConfigFields
                            definition={presentationConfigDefinition}
                            config={presentationConfig}
                            setConfig={(newConfig) => setPresentationConfig({ ...presentationConfig, ...newConfig })}
                            handleImageUpload={handleImageUpload}
                            hasBackground={Boolean(presentationConfig.bgImage)}
                            inputLang={inputLang}
                            targetLang={targetLang}
                        />
                    </div>
                    {/* <div className="mt-4 border-t pt-4">
                    <input
                        type="text"
                        id="configName"
                        placeholder="Enter config name (optional)"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        className="w-full p-2 border rounded mb-2 bg-background text-foreground"
                    />
                    <button
                        onClick={onSaveConfig}
                        className="w-full px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
                    >
                        Save Config
                    </button>
                </div> */}
                    {/* <SavedConfigs onDeleteConfig={} onLoadConfig={}  /> */}
                </Dialog.Panel>
            </div>
        </Dialog>
    );
} 