// ConfigFields.tsx
import React from "react";
import { PresentationConfig } from "./types";
import { ConfigFieldDefinition } from "./configDefinitions";

interface ConfigFieldsProps {
    definition: ConfigFieldDefinition[];
    config: PresentationConfig;
    setConfig: (newConfig: Partial<PresentationConfig>) => void;
    handleImageUpload?: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

const ConfigFields: React.FC<ConfigFieldsProps> = ({
    definition,
    config,
    setConfig,
    handleImageUpload,
}) => {
    const handleChange = (key: keyof PresentationConfig, value: any) => {
        setConfig({ [key]: value });
    };

    return (
        <div className="space-y-4">
            {definition.map((field) => {
                const { key, label, inputType } = field;
                const value = config[key];

                // Render a file input if the field is for a file (e.g. background image).
                if (inputType === "file") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label htmlFor={String(key)} className="block font-medium mb-1">
                                {label}
                            </label>
                            <input
                                type="file"
                                id={String(key)}
                                onChange={handleImageUpload}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                    );
                }

                // Render a checkbox input.
                if (inputType === "checkbox") {
                    return (
                        <div key={key} className="flex items-center">
                            <input
                                type="checkbox"
                                id={String(key)}
                                checked={value as boolean}
                                onChange={(e) => handleChange(key, e.target.checked)}
                                className="mr-2"
                            />
                            <label htmlFor={String(key)} className="font-medium">
                                {label}
                            </label>
                        </div>
                    );
                }

                // Render a number input.
                if (inputType === "number") {
                    return (
                        <div key={key} className="flex flex-col">
                            <label htmlFor={String(key)} className="block font-medium mb-1">
                                {label}
                            </label>
                            <input
                                type="number"
                                id={String(key)}
                                value={value as number}
                                onChange={(e) => handleChange(key, Number(e.target.value))}
                                className="w-full p-2 border border-gray-300 rounded"
                            />
                        </div>
                    );
                }

                // Render a text input (this covers text and color types, etc.)
                return (
                    <div key={key} className="flex flex-col">
                        <label htmlFor={String(key)} className="block font-medium mb-1">
                            {label}
                        </label>
                        <input
                            type="text"
                            id={String(key)}
                            value={value as string}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                    </div>
                );
            })}
        </div>
    );
};

export default ConfigFields;
