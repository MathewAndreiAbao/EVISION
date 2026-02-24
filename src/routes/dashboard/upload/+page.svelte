<script lang="ts">
    import FileDropZone from "$lib/components/FileDropZone.svelte";
    import UploadProgress from "$lib/components/UploadProgress.svelte";
    import {
        runPipeline,
        type PipelinePhase,
        type PipelineResult,
    } from "$lib/utils/pipeline";
    import { getQueueSize } from "$lib/utils/offline";
    import { profile } from "$lib/utils/auth";
    import { addToast } from "$lib/stores/toast";
    import { supabase } from "$lib/utils/supabase";
    import { onMount } from "svelte";

    interface TeachingLoad {
        id: string;
        subject: string;
        grade_level: string;
    }

    let selectedFile = $state<File | null>(null);
    let docType = $state("DLL");
    let subject = $state("");
    let weekNumber = $state<number | undefined>();
    let teachingLoadId = $state<string>("");
    let teachingLoads = $state<TeachingLoad[]>([]);
    let loadingTeachingLoads = $state(true);
    let currentPhase = $state<PipelinePhase>("transcoding");
    let progress = $state(0);
    let message = $state("");
    let processing = $state(false);
    let result = $state<PipelineResult | null>(null);
    let queueCount = $state(0);
    let processLog = $state<{ timestamp: string; message: string }[]>([]);
    let currentDeadline = $state<any>(null);
    let submissionAlreadyExists = $state(false);
    let ocrConfidence = $state<number | null>(null);
    let fileSizeError = $state(false);

    // Watch for changes that could invalidate uniqueness
    $effect(() => {
        if (teachingLoadId && weekNumber && docType && $profile) {
            checkExistingSubmission();
        } else {
            submissionAlreadyExists = false;
        }
    });

    async function checkExistingSubmission() {
        const { data, error } = await supabase
            .from("submissions")
            .select("id")
            .eq("teaching_load_id", teachingLoadId)
            .eq("week_number", weekNumber)
            .eq("doc_type", docType)
            .eq("school_year", "2025-2026") // Should ideally match current active SY
            .maybeSingle();

        if (error) {
            console.error("[v0] Error checking existence:", error);
            return;
        }
        submissionAlreadyExists = !!data;
    }

    // Watch weekNumber and fetch deadline
    $effect(() => {
        if (weekNumber && $profile?.district_id) {
            fetchCurrentDeadline(weekNumber, $profile.district_id);
        } else {
            currentDeadline = null;
        }
    });

    async function fetchCurrentDeadline(wk: number, districtId: string) {
        const { data } = await supabase
            .from("academic_calendar")
            .select("deadline_date, description")
            .eq("district_id", districtId)
            .eq("week_number", wk)
            .maybeSingle();
        currentDeadline = data;
    }

    onMount(async () => {
        queueCount = await getQueueSize();

        // Fetch teaching loads for the current user
        if ($profile) {
            const { data, error } = await supabase
                .from("teaching_loads")
                .select("id, subject, grade_level")
                .eq("user_id", $profile.id)
                .eq("is_active", true)
                .order("subject, grade_level");

            if (error) {
                console.error(
                    "[v0] Error fetching teaching loads:",
                    error.message,
                );
                addToast("error", "Failed to load teaching loads");
            } else if (data) {
                teachingLoads = data;
                if (teachingLoads.length > 0) {
                    teachingLoadId = teachingLoads[0].id;
                }
            }

            // Also fetch current week deadline immediately
            const { getWeekNumber } = await import(
                "$lib/utils/useDashboardData"
            );
            const wk = getWeekNumber();
            if ($profile.district_id) {
                fetchCurrentDeadline(wk, $profile.district_id);
            }
        }
        loadingTeachingLoads = false;
    });

    function onFileSelected(file: File) {
        selectedFile = file;
        result = null;
        ocrConfidence = null;
        fileSizeError = file.size > 2 * 1024 * 1024; // 2MB Hard Limit UI Warning
    }

    async function handleUpload() {
        if (!selectedFile || !$profile || !teachingLoadId) {
            addToast("error", "Please select a teaching load before uploading");
            return;
        }

        processing = true;
        result = null;

        // Voice Guidance feedback
        const { speak, VoicePrompts } = await import("$lib/utils/voiceGuide");
        speak(VoicePrompts.UPLOAD_START);

        const pipeline = runPipeline(selectedFile, {
            userId: $profile.id,
            docType,
            subject: subject || undefined,
            weekNumber,
            teachingLoadId,
        });

        processLog = [];
        const startTime = Date.now();

        for await (const event of pipeline) {
            currentPhase = event.phase;
            progress = event.progress;
            message = event.message;

            // Add to log if message changed
            if (
                processLog.length === 0 ||
                processLog[processLog.length - 1].message !== event.message
            ) {
                processLog = [
                    ...processLog,
                    {
                        timestamp: new Date().toLocaleTimeString(),
                        message: event.message,
                    },
                ];
            }

            if (event.metadata) {
                if (event.metadata.docType !== "Unknown") {
                    docType = event.metadata.docType;
                }
                if (event.metadata.weekNumber) {
                    weekNumber = event.metadata.weekNumber;
                }
                if (event.metadata.confidence !== undefined) {
                    ocrConfidence = event.metadata.confidence;
                }
                const { speak } = await import("$lib/utils/voiceGuide");
                speak("Smart detection complete. Details updated.");
            }

            if (event.phase === "done" && event.result) {
                result = event.result;
                speak(VoicePrompts.UPLOAD_COMPLETE);
                addToast(
                    "success",
                    `Document uploaded successfully! Hash: ${event.result.fileHash.slice(0, 12)}...`,
                );
                selectedFile = null;
            }

            if (event.phase === "error") {
                const { speak, VoicePrompts } = await import(
                    "$lib/utils/voiceGuide"
                );
                speak(VoicePrompts.ERROR);
                addToast("error", event.message);
            }
        }

        processing = false;
        queueCount = await getQueueSize();
    }
</script>

<svelte:head>
    <title>Upload Document — Smart E-VISION</title>
</svelte:head>

<div>
    <!-- Header -->
    <div class="mb-8 flex items-start justify-between">
        <div>
            <h1
                class="text-2xl font-bold text-text-primary flex items-center gap-2"
            >
                Upload Document <span
                    class="text-[10px] opacity-20 font-mono font-normal"
                    >UPLOAD_PAGE_V2</span
                >
            </h1>
            <p class="text-base text-text-secondary mt-1">
                Submit your DLL, ISP, or ISR for archival
            </p>
            {#if currentDeadline}
                <div
                    class="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-gov-blue/5 border border-gov-blue/10 text-xs font-semibold text-gov-blue"
                >
                    Deadline: {new Date(
                        currentDeadline.deadline_date,
                    ).toLocaleDateString("en-PH", {
                        month: "short",
                        day: "numeric",
                        year: "numeric",
                    })}
                    {#if currentDeadline.week_number}
                        · Week {currentDeadline.week_number}
                    {/if}
                </div>
            {/if}
        </div>

        {#if queueCount > 0}
            <div
                class="flex items-center gap-2 px-4 py-2 rounded-xl bg-gov-gold/10 text-gov-gold-dark text-sm font-semibold"
            >
                {queueCount} file{queueCount > 1 ? "s" : ""} queued offline
                <button
                    onclick={async () => {
                        const { processQueue } = await import(
                            "$lib/utils/offline"
                        );
                        const result = await processQueue(true);
                        queueCount = await getQueueSize();
                    }}
                    class="ml-2 px-2 py-1 bg-gov-gold text-white text-xs rounded hover:bg-gov-gold-dark transition-colors"
                >
                    Sync Now
                </button>
            </div>
        {/if}
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <!-- Upload Area -->
        <div class="lg:col-span-2 space-y-6">
            <!-- File Drop Zone -->
            <FileDropZone
                onfileselected={onFileSelected}
                disabled={processing}
            />

            <!-- Metadata Inputs -->
            {#if selectedFile && !processing}
                <div class="glass-card-static p-6 animate-fade-in">
                    <h3 class="text-lg font-bold text-text-primary mb-4">
                        Document Details
                    </h3>

                    <div class="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <!-- Teaching Load (Required) -->
                        <div>
                            <label
                                for="teachingLoad"
                                class="block text-sm font-semibold text-text-primary mb-2"
                                >Teaching Load <span class="text-gov-red"
                                    >*</span
                                ></label
                            >
                            {#if loadingTeachingLoads}
                                <div
                                    class="w-full px-4 py-3 text-base bg-white/60 border border-gray-200 rounded-xl text-text-muted"
                                >
                                    Loading...
                                </div>
                            {:else if teachingLoads.length === 0}
                                <div
                                    class="w-full px-4 py-3 text-base bg-white/60 border border-gov-red rounded-xl text-gov-red"
                                >
                                    No teaching loads available
                                </div>
                            {:else}
                                <select
                                    id="teachingLoad"
                                    bind:value={teachingLoadId}
                                    class="w-full px-4 py-3 text-base bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue outline-none min-h-[48px]"
                                >
                                    <option value=""
                                        >Select a teaching load...</option
                                    >
                                    {#each teachingLoads as load (load.id)}
                                        <option value={load.id}>
                                            {load.subject} - Grade {load.grade_level}
                                        </option>
                                    {/each}
                                </select>
                            {/if}
                        </div>

                        <!-- Doc Type -->
                        <div>
                            <label
                                for="docType"
                                class="block text-sm font-semibold text-text-primary mb-2"
                                >Document Type</label
                            >
                            <select
                                id="docType"
                                bind:value={docType}
                                class="w-full px-4 py-3 text-base bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue outline-none min-h-[48px]"
                            >
                                <option value="DLL"
                                    >Daily Lesson Log (DLL)</option
                                >
                                <option value="ISP"
                                    >Instructional Supervisory Plan (ISP)</option
                                >
                                <option value="ISR"
                                    >Instructional Supervisory Report (ISR)</option
                                >
                            </select>
                        </div>

                        <!-- Week -->
                        <div>
                            <label
                                for="week"
                                class="block text-sm font-semibold text-text-primary mb-2"
                                >Week Number</label
                            >
                            <input
                                id="week"
                                type="number"
                                bind:value={weekNumber}
                                placeholder="e.g., 5"
                                min="1"
                                max="52"
                                class="w-full px-4 py-3 text-base bg-white/60 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue outline-none min-h-[48px]"
                            />
                            {#if currentDeadline}
                                <p
                                    class="text-[10px] text-gov-blue mt-1 font-medium animate-fade-in"
                                >
                                    Target Deadline: {new Date(
                                        currentDeadline.deadline_date,
                                    ).toLocaleDateString()}
                                </p>
                            {:else if weekNumber}
                                <p
                                    class="text-[10px] text-text-muted mt-1 italic"
                                >
                                    No custom deadline set for this week.
                                </p>
                            {/if}
                        </div>
                    </div>

                    {#if ocrConfidence !== null}
                        <div
                            class="mt-6 p-4 rounded-2xl bg-surface-muted/50 border border-border-subtle flex items-center justify-between"
                        >
                            <div class="flex items-center gap-3">
                                <div
                                    class="w-2 h-2 rounded-full {ocrConfidence >
                                    80
                                        ? 'bg-gov-green'
                                        : ocrConfidence > 50
                                          ? 'bg-gov-gold'
                                          : 'bg-gov-red'} shadow-sm"
                                ></div>
                                <div>
                                    <p
                                        class="text-xs font-bold text-text-primary uppercase tracking-tighter"
                                    >
                                        OCR Smart Detection Integrity
                                    </p>
                                    <p class="text-[10px] text-text-muted">
                                        Extracted metadata accuracy based on
                                        document clarity
                                    </p>
                                </div>
                            </div>
                            <div class="text-right">
                                <p
                                    class="text-sm font-black {ocrConfidence >
                                    80
                                        ? 'text-gov-green'
                                        : ocrConfidence > 50
                                          ? 'text-gov-gold-dark'
                                          : 'text-gov-red'}"
                                >
                                    {Math.round(ocrConfidence)}%
                                </p>
                                <p
                                    class="text-[9px] font-bold text-text-muted uppercase"
                                >
                                    Confidence Score
                                </p>
                            </div>
                        </div>
                    {/if}

                    <!-- Upload Button -->
                    {#if fileSizeError}
                        <div
                            class="mt-6 p-4 bg-gov-red/10 border border-gov-red rounded-xl text-gov-red text-sm font-semibold flex items-center gap-2"
                        >
                            File exceeds 2MB limit. Please compress your
                            document before uploading to ensure system
                            stability.
                        </div>
                    {:else if submissionAlreadyExists}
                        <div
                            class="mt-6 p-4 bg-gov-red/10 border border-gov-red rounded-xl text-gov-red text-sm font-semibold flex items-center gap-2 animate-pulse"
                        >
                            A {docType} has already been submitted for this load
                            and week.
                        </div>
                    {:else}
                        <button
                            onclick={handleUpload}
                            class="mt-6 w-full py-4 bg-gradient-to-r from-gov-blue to-gov-blue-dark text-white text-lg font-bold rounded-xl shadow-md hover:shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 min-h-[56px] flex items-center justify-center gap-2"
                        >
                            Start Upload Pipeline
                        </button>
                    {/if}
                </div>
            {/if}

            <!-- Processing Progress -->
            <div class="animate-fade-in">
                <UploadProgress {currentPhase} {progress} {message} />

                <!-- Process Log -->
                <div
                    class="mt-4 p-4 rounded-xl bg-gray-900 font-mono text-xs text-green-400 h-48 overflow-y-auto"
                >
                    <div
                        class="mb-2 text-gray-500 border-b border-gray-800 pb-1"
                    >
                        > Smart E-VISION PIPELINE v2.0 initialized...
                    </div>
                    {#each processLog as log}
                        <div class="mb-1">
                            <span class="text-gray-600">[{log.timestamp}]</span>
                            {log.message}
                        </div>
                    {/each}
                    {#if currentPhase !== "done" && currentPhase !== "error"}
                        <div class="animate-pulse">_</div>
                    {/if}
                </div>
            </div>

            <!-- Result -->
            {#if result}
                <div
                    class="glass-card-static p-6 border-l-4 border-gov-green animate-fade-in"
                >
                    <div class="flex items-center gap-3 mb-3">
                        <h3 class="text-lg font-bold text-gov-green">
                            Upload Successful!
                        </h3>
                    </div>
                    <div class="grid grid-cols-2 gap-3 text-sm">
                        <div>
                            <span class="text-text-muted">File:</span>
                            <span class="font-medium text-text-primary ml-1"
                                >{result.fileName}</span
                            >
                        </div>
                        <div>
                            <span class="text-text-muted">Size:</span>
                            <span class="font-medium text-text-primary ml-1"
                                >{(result.fileSize / 1024).toFixed(0)} KB</span
                            >
                        </div>
                        <div class="col-span-2">
                            <span class="text-text-muted">SHA-256:</span>
                            <code
                                class="font-mono text-xs text-gov-blue ml-1 break-all"
                                >{result.fileHash}</code
                            >
                        </div>
                    </div>
                </div>
            {/if}
        </div>

        <!-- Sidebar Info -->
        <div class="space-y-6">
            <div class="glass-card-static p-6">
                <h3 class="text-lg font-bold text-text-primary mb-4">
                    How It Works
                </h3>
                <ol class="space-y-3 text-sm text-text-secondary">
                    <li class="flex items-start gap-3">
                        <span
                            class="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue text-xs font-bold flex items-center justify-center flex-shrink-0"
                            >1</span
                        >
                        <span
                            ><strong>Transcode</strong> — Word files are converted
                            to PDF</span
                        >
                    </li>
                    <li class="flex items-start gap-3">
                        <span
                            class="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue text-xs font-bold flex items-center justify-center flex-shrink-0"
                            >2</span
                        >
                        <span
                            ><strong>Compress</strong> — Files are optimized to &lt;1MB</span
                        >
                    </li>
                    <li class="flex items-start gap-3">
                        <span
                            class="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue text-xs font-bold flex items-center justify-center flex-shrink-0"
                            >3</span
                        >
                        <span
                            ><strong>Hash</strong> — SHA-256 fingerprint for integrity</span
                        >
                    </li>
                    <li class="flex items-start gap-3">
                        <span
                            class="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue text-xs font-bold flex items-center justify-center flex-shrink-0"
                            >4</span
                        >
                        <span
                            ><strong>Stamp</strong> — Verification QR code is embedded</span
                        >
                    </li>
                    <li class="flex items-start gap-3">
                        <span
                            class="w-7 h-7 rounded-full bg-gov-blue/10 text-gov-blue text-xs font-bold flex items-center justify-center flex-shrink-0"
                            >5</span
                        >
                        <span
                            ><strong>Sync</strong> — Uploaded to secure cloud storage</span
                        >
                    </li>
                </ol>
            </div>

            <div class="glass-card-static p-6 border-l-4 border-gov-gold">
                <h3 class="text-lg font-bold text-text-primary mb-3">
                    Security & Integrity
                </h3>
                <p class="text-sm text-text-secondary mb-3">
                    Your documents are secured with <strong>SHA-256</strong> digital
                    fingerprinting.
                </p>
                <ul class="space-y-2 text-xs text-text-muted">
                    <li class="flex gap-2">
                        <span
                            ><strong>Anti-Tampering:</strong> Any change to the file
                            content will alter its hash, making it invalid.</span
                        >
                    </li>
                    <li class="flex gap-2">
                        <span
                            ><strong>No Duplicates:</strong> The system automatically
                            rejects files that have already been archived.</span
                        >
                    </li>
                    <li class="flex gap-2">
                        <span
                            ><strong>Verifiable:</strong> Each document gets a unique
                            QR code for instant authenticity checks.</span
                        >
                    </li>
                </ul>
            </div>

            <div class="glass-card-static p-6">
                <h3 class="text-lg font-bold text-text-primary mb-3">
                    System Status
                </h3>
                <p class="text-sm text-text-secondary leading-relaxed">
                    No internet? No problem. Your files are queued locally and
                    will auto-sync when your connection is restored.
                </p>
            </div>
        </div>
    </div>
</div>
