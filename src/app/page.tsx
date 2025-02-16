'use client'

import { useState, useRef, useEffect, ChangeEvent } from 'react';
import { PresentationView } from './PresentationView';
import { Maximize2, Settings, X } from 'lucide-react';

interface AudioSegment {
  audioUrl: string;
  localFilePath: string;
  duration: number; // in seconds (may be estimated)
}

const languageOptions = [
  { code: 'en-GB', label: 'English (UK)' },
  { code: 'en-US', label: 'English (US)' },
  { code: 'en-AU', label: 'English (Australia)' },
  { code: 'es-ES', label: 'Spanish (Spain)' },
  { code: 'fr-FR', label: 'French (France)' },
  { code: 'de-DE', label: 'German (Germany)' },
  { code: 'it-IT', label: 'Italian (Italy)' },
  { code: 'ja-JP', label: 'Japanese (Japan)' },
  { code: 'zh-CN', label: 'Chinese (Simplified)' },
];

const DELAY_BETWEEN_PHRASES = 2000;

/**
 * A list of background color options.
 * The value is the computed CSS background value (RGB or keyword),
 * while the name indicates the Tailwind class.
 */
const bgColorOptions = [
  { name: "bg-inherit", value: "inherit" },
  { name: "bg-current", value: "currentColor" },
  { name: "bg-transparent", value: "transparent" },
  { name: "bg-black", value: "rgb(0 0 0)" },
  { name: "bg-white", value: "rgb(255 255 255)" },
  { name: "bg-slate-50", value: "rgb(248 250 252)" },
  { name: "bg-slate-100", value: "rgb(241 245 249)" },
  { name: "bg-slate-200", value: "rgb(226 232 240)" },
  { name: "bg-slate-300", value: "rgb(203 213 225)" },
  { name: "bg-slate-400", value: "rgb(148 163 184)" },
  { name: "bg-slate-500", value: "rgb(100 116 139)" },
  { name: "bg-slate-600", value: "rgb(71 85 105)" },
  { name: "bg-slate-700", value: "rgb(51 65 85)" },
  { name: "bg-slate-800", value: "rgb(30 41 59)" },
  { name: "bg-slate-900", value: "rgb(15 23 42)" },
  { name: "bg-slate-950", value: "rgb(2 6 23)" },
  { name: "bg-gray-50", value: "rgb(249 250 251)" },
  { name: "bg-gray-100", value: "rgb(243 244 246)" },
  { name: "bg-gray-200", value: "rgb(229 231 235)" },
  { name: "bg-gray-300", value: "rgb(209 213 219)" },
  { name: "bg-gray-400", value: "rgb(156 163 175)" },
  { name: "bg-gray-500", value: "rgb(107 114 128)" },
  { name: "bg-gray-600", value: "rgb(75 85 99)" },
  { name: "bg-gray-700", value: "rgb(55 65 81)" },
  { name: "bg-gray-800", value: "rgb(31 41 55)" },
  { name: "bg-gray-900", value: "rgb(17 24 39)" },
  { name: "bg-gray-950", value: "rgb(3 7 18)" },
  { name: "bg-zinc-50", value: "rgb(250 250 250)" },
  { name: "bg-zinc-100", value: "rgb(244 244 245)" },
  { name: "bg-zinc-200", value: "rgb(228 228 231)" },
  { name: "bg-zinc-300", value: "rgb(212 212 216)" },
  { name: "bg-zinc-400", value: "rgb(161 161 170)" },
  { name: "bg-zinc-500", value: "rgb(113 113 122)" },
  { name: "bg-zinc-600", value: "rgb(82 82 91)" },
  { name: "bg-zinc-700", value: "rgb(63 63 70)" },
  { name: "bg-zinc-800", value: "rgb(39 39 42)" },
  { name: "bg-zinc-900", value: "rgb(24 24 27)" },
  { name: "bg-zinc-950", value: "rgb(9 9 11)" },
  { name: "bg-neutral-50", value: "rgb(250 250 250)" },
  { name: "bg-neutral-100", value: "rgb(245 245 245)" },
  { name: "bg-neutral-200", value: "rgb(229 229 229)" },
  { name: "bg-neutral-300", value: "rgb(212 212 212)" },
  { name: "bg-neutral-400", value: "rgb(163 163 163)" },
  { name: "bg-neutral-500", value: "rgb(115 115 115)" },
  { name: "bg-neutral-600", value: "rgb(82 82 82)" },
  { name: "bg-neutral-700", value: "rgb(64 64 64)" },
  { name: "bg-neutral-800", value: "rgb(38 38 38)" },
  { name: "bg-neutral-900", value: "rgb(23 23 23)" },
  { name: "bg-neutral-950", value: "rgb(10 10 10)" },
  { name: "bg-stone-50", value: "rgb(250 250 249)" },
  { name: "bg-stone-100", value: "rgb(245 245 244)" },
  { name: "bg-stone-200", value: "rgb(231 229 228)" },
  { name: "bg-stone-300", value: "rgb(214 211 209)" },
  { name: "bg-stone-400", value: "rgb(168 162 158)" },
  { name: "bg-stone-500", value: "rgb(120 113 108)" },
  { name: "bg-stone-600", value: "rgb(87 83 78)" },
  { name: "bg-stone-700", value: "rgb(68 64 60)" },
  { name: "bg-stone-800", value: "rgb(41 37 36)" },
  { name: "bg-stone-900", value: "rgb(28 25 23)" },
  { name: "bg-stone-950", value: "rgb(12 10 9)" },
  { name: "bg-red-50", value: "rgb(254 242 242)" },
  { name: "bg-red-100", value: "rgb(254 226 226)" },
  { name: "bg-red-200", value: "rgb(254 202 202)" },
  { name: "bg-red-300", value: "rgb(252 165 165)" },
  { name: "bg-red-400", value: "rgb(248 113 113)" },
  { name: "bg-red-500", value: "rgb(239 68 68)" },
  { name: "bg-red-600", value: "rgb(220 38 38)" },
  { name: "bg-red-700", value: "rgb(185 28 28)" },
  { name: "bg-red-800", value: "rgb(153 27 27)" },
  { name: "bg-red-900", value: "rgb(127 29 29)" },
  { name: "bg-red-950", value: "rgb(69 10 10)" },
  { name: "bg-orange-50", value: "rgb(255 247 237)" },
  { name: "bg-orange-100", value: "rgb(255 237 213)" },
  { name: "bg-orange-200", value: "rgb(254 215 170)" },
  { name: "bg-orange-300", value: "rgb(253 186 116)" },
  { name: "bg-orange-400", value: "rgb(251 146 60)" },
  { name: "bg-orange-500", value: "rgb(249 115 22)" },
  { name: "bg-orange-600", value: "rgb(234 88 12)" },
  { name: "bg-orange-700", value: "rgb(194 65 12)" },
  { name: "bg-orange-800", value: "rgb(154 52 18)" },
  { name: "bg-orange-900", value: "rgb(124 45 18)" },
  { name: "bg-orange-950", value: "rgb(67 20 7)" },
  { name: "bg-amber-50", value: "rgb(255 251 235)" },
  { name: "bg-amber-100", value: "rgb(254 243 199)" },
  { name: "bg-amber-200", value: "rgb(253 230 138)" },
  { name: "bg-amber-300", value: "rgb(252 211 77)" },
  { name: "bg-amber-400", value: "rgb(251 191 36)" },
  { name: "bg-amber-500", value: "rgb(245 158 11)" },
  { name: "bg-amber-600", value: "rgb(217 119 6)" },
  { name: "bg-amber-700", value: "rgb(180 83 9)" },
  { name: "bg-amber-800", value: "rgb(146 64 14)" },
  { name: "bg-amber-900", value: "rgb(120 53 15)" },
  { name: "bg-amber-950", value: "rgb(69 26 3)" },
  { name: "bg-yellow-50", value: "rgb(254 252 232)" },
  { name: "bg-yellow-100", value: "rgb(254 249 195)" },
  { name: "bg-yellow-200", value: "rgb(254 240 138)" },
  { name: "bg-yellow-300", value: "rgb(253 224 71)" },
  { name: "bg-yellow-400", value: "rgb(250 204 21)" },
  { name: "bg-yellow-500", value: "rgb(234 179 8)" },
  { name: "bg-yellow-600", value: "rgb(202 138 4)" },
  { name: "bg-yellow-700", value: "rgb(161 98 7)" },
  { name: "bg-yellow-800", value: "rgb(133 77 14)" },
  { name: "bg-yellow-900", value: "rgb(113 63 18)" },
  { name: "bg-yellow-950", value: "rgb(66 32 6)" },
  { name: "bg-lime-50", value: "rgb(247 254 231)" },
  { name: "bg-lime-100", value: "rgb(236 252 203)" },
  { name: "bg-lime-200", value: "rgb(217 249 157)" },
  { name: "bg-lime-300", value: "rgb(190 242 100)" },
  { name: "bg-lime-400", value: "rgb(163 230 53)" },
  { name: "bg-lime-500", value: "rgb(132 204 22)" },
  { name: "bg-lime-600", value: "rgb(101 163 13)" },
  { name: "bg-lime-700", value: "rgb(77 124 15)" },
  { name: "bg-lime-800", value: "rgb(63 98 18)" },
  { name: "bg-lime-900", value: "rgb(54 83 20)" },
  { name: "bg-lime-950", value: "rgb(26 46 5)" },
  { name: "bg-green-50", value: "rgb(240 253 244)" },
  { name: "bg-green-100", value: "rgb(220 252 231)" },
  { name: "bg-green-200", value: "rgb(187 247 208)" },
  { name: "bg-green-300", value: "rgb(134 239 172)" },
  { name: "bg-green-400", value: "rgb(74 222 128)" },
  { name: "bg-green-500", value: "rgb(34 197 94)" },
  { name: "bg-green-600", value: "rgb(22 163 74)" },
  { name: "bg-green-700", value: "rgb(21 128 61)" },
  { name: "bg-green-800", value: "rgb(22 101 52)" },
  { name: "bg-green-900", value: "rgb(20 83 45)" },
  { name: "bg-green-950", value: "rgb(5 46 22)" },
  { name: "bg-emerald-50", value: "rgb(236 253 245)" },
  { name: "bg-emerald-100", value: "rgb(209 250 229)" },
  { name: "bg-emerald-200", value: "rgb(167 243 208)" },
  { name: "bg-emerald-300", value: "rgb(110 231 183)" },
  { name: "bg-emerald-400", value: "rgb(52 211 153)" },
  { name: "bg-emerald-500", value: "rgb(16 185 129)" },
  { name: "bg-emerald-600", value: "rgb(5 150 105)" },
  { name: "bg-emerald-700", value: "rgb(4 120 87)" },
  { name: "bg-emerald-800", value: "rgb(6 95 70)" },
  { name: "bg-emerald-900", value: "rgb(6 78 59)" },
  { name: "bg-emerald-950", value: "rgb(2 44 34)" },
  { name: "bg-teal-50", value: "rgb(240 253 250)" },
  { name: "bg-teal-100", value: "rgb(204 251 241)" },
  { name: "bg-teal-200", value: "rgb(153 246 228)" },
  { name: "bg-teal-300", value: "rgb(94 234 212)" },
  { name: "bg-teal-400", value: "rgb(45 212 191)" },
  { name: "bg-teal-500", value: "rgb(20 184 166)" },
  { name: "bg-teal-600", value: "rgb(13 148 136)" },
  { name: "bg-teal-700", value: "rgb(15 118 110)" },
  { name: "bg-teal-800", value: "rgb(17 94 89)" },
  { name: "bg-teal-900", value: "rgb(19 78 74)" },
  { name: "bg-teal-950", value: "rgb(4 47 46)" },
  { name: "bg-cyan-50", value: "rgb(236 254 255)" },
  { name: "bg-cyan-100", value: "rgb(207 250 254)" },
  { name: "bg-cyan-200", value: "rgb(165 243 252)" },
  { name: "bg-cyan-300", value: "rgb(103 232 249)" },
  { name: "bg-cyan-400", value: "rgb(34 211 238)" },
  { name: "bg-cyan-500", value: "rgb(6 182 212)" },
  { name: "bg-cyan-600", value: "rgb(8 145 178)" },
  { name: "bg-cyan-700", value: "rgb(14 116 144)" },
  { name: "bg-cyan-800", value: "rgb(21 94 117)" },
  { name: "bg-cyan-900", value: "rgb(22 78 99)" },
  { name: "bg-cyan-950", value: "rgb(8 51 68)" },
  { name: "bg-sky-50", value: "rgb(240 249 255)" },
  { name: "bg-sky-100", value: "rgb(224 242 254)" },
  { name: "bg-sky-200", value: "rgb(186 230 253)" },
  { name: "bg-sky-300", value: "rgb(125 211 252)" },
  { name: "bg-sky-400", value: "rgb(56 189 248)" },
  { name: "bg-sky-500", value: "rgb(14 165 233)" },
  { name: "bg-sky-600", value: "rgb(2 132 199)" },
  { name: "bg-sky-700", value: "rgb(3 105 161)" },
  { name: "bg-sky-800", value: "rgb(7 89 133)" },
  { name: "bg-sky-900", value: "rgb(12 74 110)" },
  { name: "bg-sky-950", value: "rgb(8 47 73)" },
  { name: "bg-blue-50", value: "rgb(239 246 255)" },
  { name: "bg-blue-100", value: "rgb(219 234 254)" },
  { name: "bg-blue-200", value: "rgb(191 219 254)" },
  { name: "bg-blue-300", value: "rgb(147 197 253)" },
  { name: "bg-blue-400", value: "rgb(96 165 250)" },
  { name: "bg-blue-500", value: "rgb(59 130 246)" },
  { name: "bg-blue-600", value: "rgb(37 99 235)" },
  { name: "bg-blue-700", value: "rgb(29 78 216)" },
  { name: "bg-blue-800", value: "rgb(30 64 175)" },
  { name: "bg-blue-900", value: "rgb(30 58 138)" },
  { name: "bg-blue-950", value: "rgb(23 37 84)" },
  { name: "bg-indigo-50", value: "rgb(238 242 255)" },
  { name: "bg-indigo-100", value: "rgb(224 231 255)" },
  { name: "bg-indigo-200", value: "rgb(199 210 254)" },
  { name: "bg-indigo-300", value: "rgb(165 180 252)" },
  { name: "bg-indigo-400", value: "rgb(129 140 248)" },
  { name: "bg-indigo-500", value: "rgb(99 102 241)" },
  { name: "bg-indigo-600", value: "rgb(79 70 229)" },
  { name: "bg-indigo-700", value: "rgb(67 56 202)" },
  { name: "bg-indigo-800", value: "rgb(55 48 163)" },
  { name: "bg-indigo-900", value: "rgb(49 46 129)" },
  { name: "bg-indigo-950", value: "rgb(30 27 75)" },
  { name: "bg-violet-50", value: "rgb(245 243 255)" },
  { name: "bg-violet-100", value: "rgb(237 233 254)" },
  { name: "bg-violet-200", value: "rgb(221 214 254)" },
  { name: "bg-violet-300", value: "rgb(196 181 253)" },
  { name: "bg-violet-400", value: "rgb(167 139 250)" },
  { name: "bg-violet-500", value: "rgb(139 92 246)" },
  { name: "bg-violet-600", value: "rgb(124 58 237)" },
  { name: "bg-violet-700", value: "rgb(109 40 217)" },
  { name: "bg-violet-800", value: "rgb(91 33 182)" },
  { name: "bg-violet-900", value: "rgb(76 29 149)" },
  { name: "bg-violet-950", value: "rgb(46 16 101)" },
  { name: "bg-purple-50", value: "rgb(250 245 255)" },
  { name: "bg-purple-100", value: "rgb(243 232 255)" },
  { name: "bg-purple-200", value: "rgb(233 213 255)" },
  { name: "bg-purple-300", value: "rgb(216 180 254)" },
  { name: "bg-purple-400", value: "rgb(192 132 252)" },
  { name: "bg-purple-500", value: "rgb(168 85 247)" },
  { name: "bg-purple-600", value: "rgb(147 51 234)" },
  { name: "bg-purple-700", value: "rgb(126 34 206)" },
  { name: "bg-purple-800", value: "rgb(107 33 168)" },
  { name: "bg-purple-900", value: "rgb(88 28 135)" },
  { name: "bg-purple-950", value: "rgb(59 7 100)" },
  { name: "bg-fuchsia-50", value: "rgb(253 244 255)" },
  { name: "bg-fuchsia-100", value: "rgb(250 232 255)" },
  { name: "bg-fuchsia-200", value: "rgb(245 208 254)" },
  { name: "bg-fuchsia-300", value: "rgb(240 171 252)" },
  { name: "bg-fuchsia-400", value: "rgb(232 121 249)" },
  { name: "bg-fuchsia-500", value: "rgb(217 70 239)" },
  { name: "bg-fuchsia-600", value: "rgb(192 38 211)" },
  { name: "bg-fuchsia-700", value: "rgb(162 28 175)" },
  { name: "bg-fuchsia-800", value: "rgb(134 25 143)" },
  { name: "bg-fuchsia-900", value: "rgb(112 26 117)" },
  { name: "bg-fuchsia-950", value: "rgb(74 4 78)" },
  { name: "bg-pink-50", value: "rgb(253 242 248)" },
  { name: "bg-pink-100", value: "rgb(252 231 243)" },
  { name: "bg-pink-200", value: "rgb(251 207 232)" },
  { name: "bg-pink-300", value: "rgb(249 168 212)" },
  { name: "bg-pink-400", value: "rgb(244 114 182)" },
  { name: "bg-pink-500", value: "rgb(236 72 153)" },
  { name: "bg-pink-600", value: "rgb(219 39 119)" },
  { name: "bg-pink-700", value: "rgb(190 24 93)" },
  { name: "bg-pink-800", value: "rgb(157 23 77)" },
  { name: "bg-pink-900", value: "rgb(131 24 67)" },
  { name: "bg-pink-950", value: "rgb(80 7 36)" },
  { name: "bg-rose-50", value: "rgb(255 241 242)" },
  { name: "bg-rose-100", value: "rgb(255 228 230)" },
  { name: "bg-rose-200", value: "rgb(254 205 211)" },
  { name: "bg-rose-300", value: "rgb(253 164 175)" },
  { name: "bg-rose-400", value: "rgb(251 113 133)" },
  { name: "bg-rose-500", value: "rgb(244 63 94)" },
  { name: "bg-rose-600", value: "rgb(225 29 72)" },
  { name: "bg-rose-700", value: "rgb(190 18 60)" },
  { name: "bg-rose-800", value: "rgb(159 18 57)" },
  { name: "bg-rose-900", value: "rgb(136 19 55)" }
  // (You can add bg-rose-950 if you have its computed value.)
];

export default function Home() {
  // User input
  const [phrasesInput, setPhrasesInput] = useState<string>('');
  // Language selection
  const [inputLang, setInputLang] = useState<string>(languageOptions[0]?.code);
  const [targetLang, setTargetLang] = useState<string>('it-IT');
  // Processed data from the backend
  const [translated, setTranslated] = useState<string[]>([]);
  const [inputAudioSegments, setInputAudioSegments] = useState<AudioSegment[]>([]);
  const [outputAudioSegments, setOutputAudioSegments] = useState<AudioSegment[]>([]);
  // Playback and sequence control
  const [currentPhraseIndex, setCurrentPhraseIndex] = useState<number>(-1);
  const [currentPhase, setCurrentPhase] = useState<'input' | 'output'>('input');
  const [finished, setFinished] = useState<boolean>(false);
  // Presentation mode (fullscreen vs inline)
  const [fullscreen, setFullscreen] = useState<boolean>(false);
  // Background image URL from upload
  const [bgImage, setBgImage] = useState<string | null>(null);
  // Settings modal state
  const [settingsOpen, setSettingsOpen] = useState<boolean>(false);
  // New states for background colors and snow effect
  const [containerBg, setContainerBg] = useState<string>("rgb(20 184 166)"); // default to teal-500 rgb value
  const [textBg, setTextBg] = useState<string>("rgb(20 184 166)");          // default to rose-500 rgb value
  const [enableSnow, setEnableSnow] = useState<boolean>(false);
  const [enableLeaves, setEnableLeaves] = useState<boolean>(false);
  const [enableAutumnLeaves, setEnableAutumnLeaves] = useState<boolean>(false);

  // Ref for the audio element
  const audioRef = useRef<HTMLAudioElement>(null);

  const handleProcess = async () => {
    const phrases = phrasesInput
      .split('\n')
      .map((line) => line.trim())
      .filter(Boolean);
    if (!phrases.length) return;

    const response = await fetch('http://localhost:3000/process', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        phrases,
        inputLang,
        targetLang,
      }),
    });
    const data = await response.json();
    setTranslated(data.translated || []);
    setInputAudioSegments(data.inputAudioSegments || []);
    setOutputAudioSegments(data.outputAudioSegments || []);
    setCurrentPhraseIndex(0);
    setCurrentPhase('input');
    setFinished(false);
  };

  // Update audio source when phrase or phase changes.
  useEffect(() => {
    if (currentPhraseIndex < 0) return;
    let src = '';
    if (currentPhase === 'input' && inputAudioSegments[currentPhraseIndex]) {
      src = inputAudioSegments[currentPhraseIndex].audioUrl;
    } else if (currentPhase === 'output' && outputAudioSegments[currentPhraseIndex]) {
      src = outputAudioSegments[currentPhraseIndex].audioUrl;
    }
    if (audioRef.current && src) {
      audioRef.current.playbackRate = 0.4;
      audioRef.current.src = src;
      audioRef.current.play().catch((err) => console.error('Auto-play error:', err));
    }
  }, [currentPhraseIndex, currentPhase, inputAudioSegments, outputAudioSegments]);

  const handleAudioEnded = () => {
    if (currentPhase === 'input') {
      setTimeout(() => {
        setCurrentPhase('output');
      }, DELAY_BETWEEN_PHRASES / 2);
    } else {
      setTimeout(() => {
        if (currentPhraseIndex < (inputAudioSegments?.length || 0) - 1) {
          setCurrentPhraseIndex(currentPhraseIndex + 1);
          setCurrentPhase('input');
        } else {
          setFinished(true);
        }
      }, DELAY_BETWEEN_PHRASES);
    }
  };

  const handleReplay = () => {
    setCurrentPhraseIndex(0);
    setCurrentPhase('input');
    setFinished(false);
  };

  // Handle background image upload; create a blob URL from the selected file.
  const handleImageUpload = (e: ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const url = URL.createObjectURL(file);
      setBgImage(url);
    }
  };

  // Fullscreen toggle button
  const FullScreenButton = (
    <button
      onClick={() => setFullscreen(!fullscreen)}
      className="p-2 bg-gray-200 rounded hover:bg-gray-300"
      title={fullscreen ? "Exit Presentation Mode" : "Enter Presentation Mode"}
    >
      <Maximize2 className="h-8 w-8 text-gray-700" />
    </button>
  );

  // Settings button (similar style to the full screen button)
  const SettingsButton = (
    <button
      onClick={() => setSettingsOpen(true)}
      className="p-2 bg-gray-200 rounded hover:bg-gray-300"
      title="Settings"
    >
      <Settings className="h-8 w-8 text-gray-700" />
    </button>
  );

  return (
    <div className="p-5 font-sans">
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-3xl font-bold">Language Shadowing</h1>
      </div>

      {/* Controls: Language selection */}
      <div className="flex flex-wrap gap-4 mb-4">
        <div>
          <label htmlFor="inputLang" className="block font-medium mb-1">
            Input Language
          </label>
          <select
            id="inputLang"
            value={inputLang}
            onChange={(e) => setInputLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label htmlFor="targetLang" className="block font-medium mb-1">
            Output Language
          </label>
          <select
            id="targetLang"
            value={targetLang}
            onChange={(e) => setTargetLang(e.target.value)}
            className="p-2 border border-gray-300 rounded"
          >
            {languageOptions.map((option) => (
              <option key={option.code} value={option.code}>
                {option.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Textarea for input phrases */}
      <textarea
        placeholder="Enter phrases, one per line"
        value={phrasesInput}
        onChange={(e) => setPhrasesInput(e.target.value)}
        rows={6}
        className="w-full p-2 text-lg border border-gray-300 rounded mb-4"
      />

      <button
        onClick={handleProcess}
        className="px-4 py-2 text-lg bg-blue-500 text-white rounded hover:bg-blue-600 mb-4"
      >
        Process
      </button>

      {/* Audio element for playback */}
      <audio
        ref={audioRef}
        onEnded={handleAudioEnded}
        className="w-full mb-4"
        controls
        hidden
      />

      <div className="h-8" />

      {/* Presentation view and controls */}
      {currentPhraseIndex >= 0 && (
        <>
          <div className="flex mb-2 items-center gap-2">
            {FullScreenButton}
            {SettingsButton}
            {finished && (
              <button
                onClick={handleReplay}
                className="ml-2 px-6 py-3 bg-green-500 text-white rounded hover:bg-green-600"
              >
                Replay
              </button>
            )}
          </div>
          <PresentationView
            currentPhrase={phrasesInput.split('\n')[currentPhraseIndex]}
            currentTranslated={translated[currentPhraseIndex] || ''}
            currentPhase={currentPhase}
            fullScreen={fullscreen}
            backgroundImage={bgImage || undefined}
            onClose={() => setFullscreen(false)}
            enableSnow={enableSnow}
            enableLeaves={enableLeaves}
            enableAutumnLeaves={enableAutumnLeaves}
            containerBg={containerBg}
            textBg={textBg}
          />
        </>
      )}

      {/* Inline display of the current phrase */}
      {currentPhraseIndex >= 0 && !finished && (
        <div className="mt-5">
          <h2 className="text-2xl font-bold mb-2">
            Phrase {currentPhraseIndex + 1} of {inputAudioSegments?.length || 0}
          </h2>
          <div className="mb-4">
            <p className="text-xl">
              <span className="font-semibold">Input:</span>{" "}
              {phrasesInput.split('\n')[currentPhraseIndex]}
            </p>
            <p className="text-xl">
              <span className="font-semibold">Translated:</span>{" "}
              {translated[currentPhraseIndex]}
            </p>
            <p className="text-lg italic">
              Now playing:{" "}
              {currentPhase === 'input' ? "Input audio" : "Translated audio"}
            </p>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {settingsOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-4 rounded shadow-lg w-96">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">Settings</h2>
              <button
                onClick={() => setSettingsOpen(false)}
                className="p-2 text-gray-700 hover:text-gray-900"
                title="Close Settings"
              >
                <X className="h-6 w-6" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label htmlFor="containerBg" className="block font-medium mb-1">
                  Container Background Color
                </label>
                <input
                  list="bgColorOptions"
                  type="text"
                  id="containerBg"
                  placeholder="Select a color"
                  value={containerBg}
                  onChange={(e) => setContainerBg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="textBg" className="block font-medium mb-1">
                  Text Background Color
                </label>
                <input
                  list="bgColorOptions"
                  type="text"
                  id="textBg"
                  placeholder="Select a color"
                  value={textBg}
                  onChange={(e) => setTextBg(e.target.value)}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div>
                <label htmlFor="bgImage" className="block font-medium mb-1">
                  Background Image
                </label>
                <input
                  type="file"
                  accept="image/*"
                  id="bgImage"
                  onChange={handleImageUpload}
                  className="w-full p-2 border border-gray-300 rounded"
                />
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableSnow"
                  checked={enableSnow}
                  onChange={(e) => setEnableSnow(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableSnow" className="font-medium">
                  Enable Snow Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableLeaves"
                  checked={enableLeaves}
                  onChange={(e) => setEnableLeaves(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableLeaves" className="font-medium">
                  Enable Leaves Effect
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="enableAutumnLeaves"
                  checked={enableAutumnLeaves}
                  onChange={(e) => setEnableAutumnLeaves(e.target.checked)}
                  className="mr-2"
                />
                <label htmlFor="enableAutumnLeaves" className="font-medium">
                  Enable Autumn Leaves Effect
                </label>
              </div>
            </div>
            {/* Shared datalist for background color options */}
            <datalist id="bgColorOptions">
              {bgColorOptions.map((option) => (
                <option key={option.name} value={option.value}>
                  {option.name}
                </option>
              ))}
            </datalist>
          </div>
        </div>
      )}
    </div>
  );
}
