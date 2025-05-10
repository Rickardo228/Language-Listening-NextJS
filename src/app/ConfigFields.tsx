// ConfigFields.tsx
import React from "react";
import { PresentationConfig } from "./types";
import { ConfigFieldDefinition } from "./configDefinitions";
import bgColorOptions from "./utils/bgColorOptions";

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
    const handleChange = (key: keyof PresentationConfig, value: boolean | string | number) => {
        setConfig({ [key]: value });
    };

    return (
        <div className="space-y-4">
            {definition.map((field) => {
                const { key, label, inputType, description } = field;
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
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    );
                }

                // Render a checkbox input.
                if (inputType === "checkbox") {
                    return (
                        <div key={key} className="flex flex-col">
                            <div className="flex items-center">
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
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1 ml-6">{description}</p>
                            )}
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
                            {description && (
                                <p className="text-sm text-muted-foreground mt-1">{description}</p>
                            )}
                        </div>
                    );
                }

                if (inputType === "color") {
                    return <div key={key} className="flex flex-col">
                        <label htmlFor={String(key)} className="block font-medium mb-1">
                            {label}
                        </label>
                        <input
                            list="bgColorOptions"
                            type="text"
                            id={String(key)}
                            value={value as string}
                            onChange={(e) => handleChange(key, e.target.value)}
                            className="w-full p-2 border border-gray-300 rounded"
                        />
                        <datalist id="bgColorOptions">
                            {bgColorOptions.map((option) => (
                                <option key={option.name} value={option.value}>
                                    {option.name}
                                </option>
                            ))}
                        </datalist>
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
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
                        {description && (
                            <p className="text-sm text-muted-foreground mt-1">{description}</p>
                        )}
                    </div>
                );
            })}
        </div>
    );
};

export default ConfigFields;
