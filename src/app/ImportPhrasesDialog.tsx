'use client'

import { useState } from 'react'
import { ImportPhrases, ImportPhrasesProps } from './ImportPhrases'
import { useImportPhrasesVisibility } from './hooks/useImportPhrasesVisibility'

export function ImportPhrasesDialog(props: ImportPhrasesProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { shouldRender } = useImportPhrasesVisibility(props)

    if (!shouldRender) return null

    return (
        <div>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg mb-4"
            >
                Add Phrases
            </button>

            {isOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white p-6 rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="flex justify-between items-center mb-4">
                            <h2 className="text-xl font-semibold">Import Phrases</h2>
                            <button
                                onClick={() => setIsOpen(false)}
                                className="text-gray-500 hover:text-gray-700"
                            >
                                ✕
                            </button>
                        </div>
                        <ImportPhrases {...props} />
                    </div>
                </div>
            )}
        </div>
    )
} 