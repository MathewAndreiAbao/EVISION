<script lang="ts">
    import { profile } from "$lib/utils/auth";
    import { supabase } from "$lib/utils/supabase";
    import { onMount } from "svelte";
    import { fly, fade } from "svelte/transition";

    let settings = $state<any[]>([]);
    let loading = $state(true);
    let saving = $state(false);
    let message = $state({ text: "", type: "success" });

    onMount(async () => {
        if (
            $profile?.role !== "District Supervisor" &&
            $profile?.role !== "Admin"
        ) {
            // Redirect or show error if not admin
        }
        await loadSettings();
        loading = false;
    });

    async function loadSettings() {
        const { data } = await supabase.from("system_settings").select("*");
        settings = data || [];

        // Default settings if empty
        if (settings.length === 0) {
            settings = [
                {
                    key: "submission_window_days",
                    value: "5",
                    description:
                        "Days after week end to allow on-time submissions",
                },
                {
                    key: "maintenance_mode",
                    value: "false",
                    description: "Disable all uploads for system maintenance",
                },
                {
                    key: "enforce_ocr",
                    value: "true",
                    description: "Prevent submission if OCR metadata mismatch",
                },
                {
                    key: "max_upload_size_mb",
                    value: "2",
                    description:
                        "Global file size limit for uploads (Hard Limit)",
                },
            ];
        }
    }

    async function saveSetting(key: string, value: string) {
        saving = true;
        const { error } = await supabase
            .from("system_settings")
            .upsert({ key, value, updated_at: new Date().toISOString() });

        if (error) {
            message = { text: "Failed to save setting", type: "error" };
        } else {
            message = {
                text: `Setting "${key}" updated successfully`,
                type: "success",
            };
            setTimeout(() => (message = { text: "", type: "success" }), 3000);
        }
        saving = false;
    }
</script>

<svelte:head>
    <title>Admin Config — Smart E-VISION</title>
</svelte:head>

<div class="max-w-4xl mx-auto">
    <div class="mb-8">
        <h1
            class="text-2xl font-bold text-text-primary uppercase tracking-tight flex items-center gap-2"
        >
            System Parameters
        </h1>
        <p class="text-text-secondary mt-1">
            Manage global system parameters and compliance thresholds.
        </p>
    </div>

    {#if loading}
        <div class="space-y-4">
            {#each Array(3) as _}
                <div class="h-32 glass-card-static animate-pulse"></div>
            {/each}
        </div>
    {:else}
        <div class="grid gap-6">
            {#each settings as s}
                <div
                    class="glass-card p-6 flex flex-col md:flex-row md:items-center justify-between gap-6"
                    in:fly={{ y: 20, duration: 400 }}
                >
                    <div class="max-w-md">
                        <h3
                            class="font-bold text-text-primary uppercase tracking-wider text-xs mb-1"
                        >
                            {s.key.replace(/_/g, " ")}
                        </h3>
                        <p class="text-sm text-text-secondary leading-relaxed">
                            {s.description ||
                                "System-wide parameter governing platform behavior."}
                        </p>
                    </div>

                    <div class="flex items-center gap-3">
                        {#if s.key === "maintenance_mode" || s.key === "enforce_ocr"}
                            <button
                                class="w-14 h-8 rounded-full transition-all relative {s.value ===
                                'true'
                                    ? 'bg-gov-blue'
                                    : 'bg-gray-200'}"
                                onclick={() => {
                                    s.value =
                                        s.value === "true" ? "false" : "true";
                                    saveSetting(s.key, s.value);
                                }}
                            >
                                <div
                                    class="absolute top-1 w-6 h-6 rounded-full bg-white transition-all {s.value ===
                                    'true'
                                        ? 'left-7'
                                        : 'left-1'}"
                                ></div>
                            </button>
                            <span
                                class="text-sm font-bold {s.value === 'true'
                                    ? 'text-gov-blue'
                                    : 'text-text-muted'}"
                            >
                                {s.value === "true" ? "ENABLED" : "DISABLED"}
                            </span>
                        {:else}
                            <input
                                type="text"
                                bind:value={s.value}
                                class="bg-white border border-gray-200 rounded-lg px-3 py-2 text-sm font-bold w-24 focus:ring-2 focus:ring-gov-blue/20 outline-none"
                            />
                            <button
                                onclick={() => saveSetting(s.key, s.value)}
                                disabled={saving}
                                class="px-4 py-2 bg-gov-blue text-white rounded-lg text-xs font-bold hover:bg-gov-blue-dark active:scale-95 transition-all"
                            >
                                Update
                            </button>
                        {/if}
                    </div>
                </div>
            {/each}
        </div>

        {#if message.text}
            <div
                class="fixed bottom-24 right-8 px-6 py-4 rounded-2xl shadow-elevated border-l-4 {message.type ===
                'success'
                    ? 'bg-green-50 border-green-500 text-green-800'
                    : 'bg-red-50 border-red-500 text-red-800'} flex items-center gap-3 font-bold text-sm"
                in:fly={{ x: 50 }}
                out:fade
            >
                <span
                    class="w-6 h-6 rounded-full bg-white flex items-center justify-center text-[10px] shadow-sm"
                >
                    {message.type === "success" ? "OK" : "!!"}
                </span>
                {message.text}
            </div>
        {/if}
    {/if}

    <div
        class="mt-12 p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center"
    >
        <p class="text-sm text-text-muted italic">
            Additional configuration modules (School Management, User Roles, API
            Keys) are currently handled via Supabase Dashboard.
        </p>
    </div>
</div>
