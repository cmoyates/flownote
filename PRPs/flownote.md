# PRPs/flownote.md (Revised)

## 1. INITIAL.md Analysis (Unchanged)

- **Project Goal:** Develop a React Native (Android-specific) application for voice-to-text notes with AI-powered cleanup and direct integration into Notion.
- **Core Feature Set:**
  1. **Voice Activity Detection (VAD):** Continuous listening mode that only transcribes actual speech.
  2. **AI Transcription:** Use Google Gemini for speech-to-text.
  3. **AI Cleanup:** Use a second LLM call to refine the transcription.
  4. **Notion Integration:** Automatically manage notes in a Notion database.
  5. **Markdown to Notion Block Conversion:** Translate text to Notion's API structure.
- **Target Technology Stack:**
  - **Framework:** React Native with Expo
  - **Language:** TypeScript
  - **UI:** Native Wind, React Native Reanimated, React Native Reusables, etc., for a Shad CN workflow.
  - **AI Provider:** Google Gemini
  - **Target Platform:** Android `.apk`.

## 2. Web Research and Technology Analysis (Revised)

### 2.1. Critical Technology Documentation

- **React Native & Expo:**
  - **Expo Audio (`expo-audio`):** The core library for audio recording. The `useAudioRecorder` hook is central to the implementation, providing control over recording instances. The `useAudioRecorderState` hook will be used to get real-time status updates, including the crucial `metering` value for VAD.
  - **Expo SecureStore (`expo-secure-store`):** The standard for securely storing sensitive data like API keys.
  - **NativeWind:** The primary styling library, requiring configuration in `tailwind.config.js` and `babel.config.js`.
  - **Permissions:** The `expo-audio` library includes `AudioModule.requestRecordingPermissionsAsync()` to properly handle microphone access requests.

- **Voice Activity Detection (VAD):**
  - **Concept:** Distinguish speech from silence to trigger recording.
  - **Implementation:** The plan remains to use a simple amplitude-based VAD. This is achieved by monitoring the `metering` property from the `useAudioRecorderState` hook. When the audio level (in dBFS) crosses a predefined threshold, recording starts; when it drops below for a certain duration, it stops. This avoids external dependencies and is highly efficient.

- **Google Gemini API:**
  - **SDK:** The `@google/genai` JavaScript SDK.
  - **Security:** API keys will be managed via the settings screen and stored with `expo-secure-store`. **Documentation will strongly recommend a backend proxy for any public-facing app.**

- **Notion API:**
  - **SDK:** The `@notionhq/client` JavaScript SDK.
  - **Core Operations:** `notion.pages.create` and `notion.blocks.children.append` are the key functions.

### 2.2. Implementation Patterns & Gotchas (Revised)

- **Modern React Native Hooks:** The implementation will be heavily hook-based. The logic for audio recording and VAD will be encapsulated within a custom `useAudioRecorder` hook, making the component code on `HomeScreen.tsx` much cleaner.
- **API Calls are Asynchronous:** The UI state must clearly reflect the `listening`, `recording`, `transcribing`, and `saving` states. Zustand or React Context will manage this.
- **VAD Tuning:** The dBFS threshold for starting and stopping recording will be a configurable constant, as it may need tuning based on the device's microphone sensitivity and ambient noise.

## 3. Implementation Blueprint: `template-synapse-notes` (Revised)

### 3.1. Template Philosophy (Unchanged)

Provide a fully wired-up architecture. The developer only needs to provide API keys and run the app.

### 3.2. Template Package Structure (Revised)

The structure remains the same, but the core logic inside the `useAudioRecorder.ts` hook is updated to use the new `expo-audio` API.

```plaintext
/use-cases/synapse-notes/
|-- .env.example
|-- ... (config files) ...
|
|-- src/
    |-- ... (other folders) ...
    |
    |-- hooks/
    |   |-- useAudioRecorder.ts   # (REVISED) Manages recording & VAD using expo-audio hooks.
    |   |-- useSynapseFlow.ts     # Orchestrates the full transcribe->clean->upload flow.
    |
    |-- services/
    |   |-- gemini.ts
    |   |-- notion.ts
    |-- ... (etc) ...
```

### 3.3. Specialization & Configuration Strategy (Unchanged)

Configuration will be handled via `.env` for initial setup and an in-app settings screen for user-friendly updates, storing keys in `expo-secure-store`.

### 3.4. Validation Design (Unchanged)

The validation gates remain the same, ensuring template structure, content cleanliness, and mock testing of the service modules.

## 4. Quality Checklist & Confidence Score (Revised)

- [x] Extensive web research completed on target technology.
- [x] Official documentation **(for the correct `expo-audio` library)** thoroughly reviewed.
- [x] Real-world examples and patterns identified (hook-based architecture).
- [x] Complete template package structure planned.
- [x] Domain-specific validation designed.
- [x] All web research findings documented in PRP.
- [x] Technology-specific gotchas and patterns captured.

**Confidence Score: 10/10**

The correction to use `expo-audio` and the confirmation of its capabilities from the official documentation solidify the plan. The hook-based nature of the new library simplifies the architecture, making the template even more robust and maintainable. The path to a high-quality, working implementation is now clearer and based on the latest Expo standards.
