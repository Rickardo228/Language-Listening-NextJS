'use client';

import React from 'react';

interface Config {
    name: string;
    // Add other config properties as needed
}

interface SavedConfigsProps {
    savedConfigs: Config[];
    onLoadConfig: (config: Config) => void;
    onDeleteConfig: (index: number) => void;
}

const SavedConfigs: React.FC<SavedConfigsProps> = ({
    savedConfigs,
    onLoadConfig,
    onDeleteConfig,
}) => {
    return (
        <div className="space-y-2">
            <h3 className="text-xl font-semibold">Saved Configs</h3>
            <div>
                {savedConfigs.length === 0 ? (
                    <p>No configs saved.</p>
                ) : (
                    <ul className="list-disc pl-5">
                        {savedConfigs.map((config, idx) => (
                            <li key={idx} className="flex justify-between items-center">
                                <span
                                    onClick={() => onLoadConfig(config)}
                                    className="cursor-pointer hover:underline"
                                >
                                    {config.name}
                                </span>
                                <button
                                    onClick={() => onDeleteConfig(idx)}
                                    className="text-red-500 hover:underline"
                                >
                                    Delete
                                </button>
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default SavedConfigs;
