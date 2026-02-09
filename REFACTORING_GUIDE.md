# API Deduplication Refactoring Guide

## What We Created

### 1. `useGeneratePhrases` Hook
**Location:** `src/app/hooks/useGeneratePhrases.ts`

**Purpose:** Handles AI phrase generation from prompts or URLs

**Features:**
- Detects URLs and routes to `/fetch-url-content` endpoint
- Routes prompts to `/generate-phrases` endpoint
- Tracks analytics with `trackGeneratePhrases`
- Handles errors with toast notifications
- Returns `isGenerating` and `isFetchingUrl` states

**Usage:**
```typescript
const { generatePhrases, isGenerating, isFetchingUrl } = useGeneratePhrases({
    inputLang: 'en-GB',
    targetLang: 'it-IT',
    collectionType: 'phrases',
    onSuccess: (phrases, prompt) => {
        // Handle generated phrases
        setPhrasesInput(phrases)
    },
})

// Call it
await generatePhrases({ prompt: 'ordering coffee', allowEmpty: false })
```

### 2. `useProcessPhrases` Hook
**Location:** `src/app/hooks/useProcessPhrases.ts`

**Purpose:** Handles batch processing of phrases with the `/process` endpoint

**Features:**
- Automatic batching (default 10 phrases per batch)
- Progress tracking with `progress` state
- Automatic audio skipping for large batches (>50 phrases)
- Returns properly formatted `Phrase[]` objects

**Usage:**
```typescript
const { processPhrases, isProcessing, progress } = useProcessPhrases({
    inputLang: 'en-GB',
    targetLang: 'it-IT',
    inputVoice: 'en-GB-Standard-A',  // optional
    targetVoice: 'it-IT-Standard-A',  // optional
    batchSize: 10,                    // optional
    onProgress: (completed, total) => {
        // Optional progress callback
        console.log(`${completed}/${total}`)
    },
})

// Call it
const phrases = await processPhrases(['Hello', 'Goodbye'], {
    skipAudio: false,  // optional override
})
```

### 3. `TranslationProgressDialog` Component
**Location:** `src/app/components/TranslationProgressDialog.tsx`

**Purpose:** Universal progress dialog for phrase translation/processing

**Features:**
- Animated motivational phrases
- Progress bar with percentage
- Spinner animation
- Customizable title

**Usage:**
```typescript
<TranslationProgressDialog
    isOpen={!!progress}
    completed={progress?.completed || 0}
    total={progress?.total || 0}
    title="Translating phrases"  // optional, default shown
/>
```

## Files Already Updated ✅

1. **AIGenerateInput.tsx** - Now uses `useGeneratePhrases`
2. **ImportPhrasesDialog.tsx** - Now uses `useGeneratePhrases` and `TranslationProgressDialog`
3. **QuickAddDialog.tsx** - Now uses `useProcessPhrases`

## Files That Need Updating

### 1. `src/app/components/LibraryManager.tsx`
**Lines:** 185-195 (process endpoint call)

**Changes needed:**
- Add `useProcessPhrases` hook
- Remove manual `/process` fetch call
- Replace progress UI with `TranslationProgressDialog`

**Before:**
```typescript
const response = await fetch(`${API_BASE_URL}/process`, { ... })
```

**After:**
```typescript
const { processPhrases, progress } = useProcessPhrases({ inputLang, targetLang })
const phrases = await processPhrases(allPhrases)
```

### 2. `src/app/[locale]/(app)/collection/[id]/page.tsx`
**Lines:** 185-195 (process endpoint call)

**Changes needed:**
- Add `useProcessPhrases` hook
- Remove manual `/process` fetch call
- Handle `isSwapped` logic when calling the hook

### 3. `src/app/components/PhrasePlaybackView.tsx`
**Lines:** 1986-1996 (process endpoint call)

**Changes needed:**
- Add `useProcessPhrases` hook
- Remove manual `/process` fetch call
- Handle `isSwapped` logic for voices

### 4. `src/app/EditablePhrases.tsx`
**Lines:** 177-187 (process endpoint call)

**Changes needed:**
- Add `useProcessPhrases` hook (for single phrase)
- Remove manual `/process` fetch call

## Migration Pattern

For each file using `/process`, follow this pattern:

```typescript
// 1. Add the import
import { useProcessPhrases } from './hooks/useProcessPhrases'
import { TranslationProgressDialog } from './components/TranslationProgressDialog'

// 2. Initialize the hook
const { processPhrases, isProcessing, progress } = useProcessPhrases({
    inputLang: effectiveInputLang,
    targetLang: effectiveTargetLang,
    inputVoice: voices?.inputVoice,
    targetVoice: voices?.targetVoice,
})

// 3. Replace fetch calls with hook call
// Before:
const response = await fetch(`${API_BASE_URL}/process`, { ... })
const data = await response.json()

// After:
const phrases = await processPhrases(rawPhrases, {
    skipAudio: rawPhrases.length > 50,
})

// 4. Add progress dialog (if needed)
{progress && (
    <TranslationProgressDialog
        isOpen={true}
        completed={progress.completed}
        total={progress.total}
    />
)}
```

## Benefits

1. **Less Code Duplication:** All API logic centralized
2. **Consistent Error Handling:** Toast notifications everywhere
3. **Consistent Progress UI:** Same look & feel across app
4. **Easier Maintenance:** Update one place instead of 7+
5. **Better Type Safety:** Shared types for `Phrase` objects
6. **Consistent Analytics:** Tracking happens automatically
7. **Automatic Batching:** No need to reimplement batch logic

## Testing Checklist

After updating each file, test:
- [ ] Phrase generation from prompts works
- [ ] URL fetching works (if applicable)
- [ ] Batch processing works with progress updates
- [ ] Error handling shows toast notifications
- [ ] Progress dialog displays and animates correctly
- [ ] Audio generation/skipping works as expected
- [ ] Analytics tracking still fires
