'use client'

import { useState } from 'react'
import { ImportPhrases, ImportPhrasesProps } from './ImportPhrases'
import { useImportPhrasesVisibility } from './hooks/useImportPhrasesVisibility'
import { createPortal } from 'react-dom'

export function ImportPhrasesDialog(props: ImportPhrasesProps) {
    const [isOpen, setIsOpen] = useState(false)
    const { shouldRender } = useImportPhrasesVisibility(props)

    if (!shouldRender) return null

    // Wrap the callbacks to close the dialog after successful completion
    const wrappedProps = {
        ...props,
        onProcess: props.onProcess ? async (prompt?: string) => {
            await props.onProcess!(prompt)
            setIsOpen(false)
        } : undefined,
        onAddToCollection: props.onAddToCollection ? async () => {
            await props.onAddToCollection!()
            setIsOpen(false)
        } : undefined
    }

    return (
        <>
            <button
                onClick={() => setIsOpen(true)}
                className="bg-blue-500 hover:bg-blue-600 text-white px-4 py-2 rounded-lg"
            >
                {props.onAddToCollection ? 'Add Phrases' : 'New Collection'}            </button>

            {isOpen && createPortal(
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[100] font-sans">
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
                        <ImportPhrases {...wrappedProps} />
                    </div>
                </div>,
                document.body
            )}
        </>
    )
} 