import { PresentationConfig } from './types';
import ConfigFields from './ConfigFields';
import { presentationConfigDefinition } from './configDefinitions';
import { Modal } from './components/ui';

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
        <Modal
            isOpen={isOpen}
            onClose={onClose}
            title="Settings"
            size="sm"
            panelClassName="w-96"
            className="overflow-y-auto flex-1 pr-2"
        >
            <ConfigFields
                definition={presentationConfigDefinition}
                config={presentationConfig}
                setConfig={(newConfig) => setPresentationConfig({ ...presentationConfig, ...newConfig })}
                handleImageUpload={handleImageUpload}
                hasBackground={Boolean(presentationConfig.bgImage)}
                inputLang={inputLang}
                targetLang={targetLang}
            />
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
        </Modal>
    );
} 