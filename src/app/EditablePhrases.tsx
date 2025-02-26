import { Phrase } from './types';

interface EditablePhrasesProps {
    phrases: Phrase[];
    setPhrases: (phrases: Phrase[]) => void;
}

export function EditablePhrases({ phrases, setPhrases }: EditablePhrasesProps) {
    const handlePhraseChange = (index: number, field: keyof Phrase, value: string) => {
        const newPhrases = [...phrases];
        newPhrases[index] = { ...newPhrases[index], [field]: value };
        setPhrases(newPhrases);
    };

    return (
        <div className="mb-4">
            <h3 className="text-xl font-bold mb-2">Edit Phrases</h3>
            {phrases.map((phrase, index) => (
                <div key={index} className="mb-4 border p-2 rounded">
                    <div className="mb-2">
                        <label className="block font-medium mb-1">Input:</label>
                        <input
                            type="text"
                            value={phrase.input}
                            onChange={(e) => handlePhraseChange(index, 'input', e.target.value)}
                            className="w-96 p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block font-medium mb-1">Translated:</label>
                        <input
                            type="text"
                            value={phrase.translated}
                            onChange={(e) => handlePhraseChange(index, 'translated', e.target.value)}
                            className="w-96 p-2 border border-gray-300 rounded"
                        />
                    </div>
                    <div className="mb-2">
                        <label className="block font-medium mb-1">Romanized:</label>
                        <input
                            type="text"
                            value={phrase.romanized}
                            onChange={(e) => handlePhraseChange(index, 'romanized', e.target.value)}
                            className="w-96 p-2 border border-gray-300 rounded"
                        />
                    </div>
                </div>
            ))}
        </div>
    );
} 