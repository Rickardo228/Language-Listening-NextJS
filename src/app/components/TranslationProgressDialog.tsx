'use client'

import { useState, useEffect } from 'react'
import { Dialog } from '@headlessui/react'
import { AnimatePresence, motion } from 'framer-motion'

const motivationalPhrases = [
    "Every word brings you closer to fluency",
    "Building your language superpowers",
    "Your future self will thank you",
    "Great things take a little patience",
    "Unlocking a whole new world for you",
    "One phrase at a time, one step at a time",
    "Making these phrases sound perfect",
    "You're investing in yourself right now",
    "Language is the road map of a culture",
    "Almost there, hang tight!",
]

interface TranslationProgressDialogProps {
    isOpen: boolean
    completed: number
    total: number
    title?: string
}

export function TranslationProgressDialog({
    isOpen,
    completed,
    total,
    title = "Translating phrases",
}: TranslationProgressDialogProps) {
    const [motivationalIndex, setMotivationalIndex] = useState(() =>
        Math.floor(Math.random() * motivationalPhrases.length)
    )

    useEffect(() => {
        if (!isOpen) return

        setMotivationalIndex(Math.floor(Math.random() * motivationalPhrases.length))
        const interval = setInterval(() => {
            setMotivationalIndex((i) => (i + 1) % motivationalPhrases.length)
        }, 10000)
        return () => clearInterval(interval)
    }, [isOpen])

    const percentage = total > 0 ? Math.round((completed / total) * 100) : 0

    return (
        <Dialog open={isOpen} onClose={() => {}} className="relative z-[400]">
            <div className="fixed inset-0 bg-black/50" />
            <div className="fixed inset-0 flex items-center justify-center">
                <Dialog.Panel className="bg-background text-foreground p-4 rounded-lg shadow-lg w-[500px] max-w-[90vw] border">
                    <div className="flex flex-col items-center py-8 px-4 gap-4">
                        <div className="h-6 relative w-full">
                            <AnimatePresence mode="wait">
                                <motion.p
                                    key={motivationalIndex}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0, y: -8 }}
                                    transition={{ duration: 0.3 }}
                                    className="text-sm text-muted-foreground italic text-center absolute inset-0"
                                >
                                    {motivationalPhrases[motivationalIndex]}
                                </motion.p>
                            </AnimatePresence>
                        </div>
                        <div className="w-8 h-8 border-3 border-primary border-t-transparent rounded-full animate-spin" />
                        <div className="text-center">
                            <p className="text-lg font-semibold">{title}</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                {completed} of {total} phrases
                            </p>
                        </div>
                        <div className="w-full bg-secondary rounded-full h-2 overflow-hidden">
                            <div
                                className="bg-primary h-full rounded-full transition-all duration-300 ease-out"
                                style={{ width: `${percentage}%` }}
                            />
                        </div>
                        <p className="text-xs text-muted-foreground">{percentage}%</p>
                    </div>
                </Dialog.Panel>
            </div>
        </Dialog>
    )
}
