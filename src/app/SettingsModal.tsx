import { X } from 'lucide-react';
import { PresentationConfig } from './types';
import ConfigFields from './ConfigFields';
import { ConfigFieldDefinition } from './configDefinitions';

interface SettingsModalProps {
    isOpen: boolean;
    onClose: () => void;
    configName: string;
    setConfigName: (name: string) => void;
    onSaveConfig: () => void;
    presentationConfig: PresentationConfig;
    setPresentationConfig: (config: PresentationConfig) => void;
    presentationConfigDefinition: ConfigFieldDefinition[];
    handleImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function SettingsModal({
    isOpen,
    onClose,
    configName,
    setConfigName,
    onSaveConfig,
    presentationConfig,
    setPresentationConfig,
    presentationConfigDefinition,
    handleImageUpload
}: SettingsModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white p-4 rounded shadow-lg w-96 overflow-scroll max-h-svh">
                <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold">Settings</h2>
                    <button
                        onClick={onClose}
                        className="p-2 text-gray-700 hover:text-gray-900"
                        title="Close Settings"
                    >
                        <X className="h-6 w-6" />
                    </button>
                </div>
                <ConfigFields
                    definition={presentationConfigDefinition}
                    config={presentationConfig}
                    setConfig={(newConfig) => setPresentationConfig({ ...presentationConfig, ...newConfig })}
                    handleImageUpload={handleImageUpload}
                />
                <div className="mt-4 border-t pt-4">
                    <input
                        type="text"
                        id="configName"
                        placeholder="Enter config name (optional)"
                        value={configName}
                        onChange={(e) => setConfigName(e.target.value)}
                        className="w-full p-2 border border-gray-300 rounded mb-2"
                    />
                    <button
                        onClick={onSaveConfig}
                        className="w-full px-4 py-2 bg-indigo-500 text-white rounded hover:bg-indigo-600"
                    >
                        Save Config
                    </button>
                </div>
            </div>
        </div>
    );
} 