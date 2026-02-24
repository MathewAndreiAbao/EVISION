<script lang="ts">
    import Sidebar from "$lib/components/Sidebar.svelte";
    import InstallPrompt from "$lib/components/InstallPrompt.svelte";
    import UpdatePrompt from "$lib/components/UpdatePrompt.svelte";
    import { authLoading, profile, user } from "$lib/utils/auth";
    import { goto } from "$app/navigation";

    let { children } = $props();

    // Auth guard
    $effect(() => {
        if (!$authLoading && !$user) {
            goto("/auth/login");
        }
    });
</script>

<svelte:head>
    <title>Smart E-VISION — DASHBOARD</title>
</svelte:head>

{#if $authLoading}
    <!-- Loading skeleton -->
    <div class="min-h-screen gradient-mesh flex items-center justify-center">
        <div class="text-center animate-fade-in">
            <div
                class="w-16 h-16 mx-auto rounded-2xl gov-header-gradient flex items-center justify-center text-white text-3xl font-bold shadow-elevated mb-4 animate-pulse-glow"
            >
                V
            </div>
            <p class="text-lg text-text-secondary font-medium">
                INITIALIZING...
            </p>
        </div>
    </div>
{:else if $user}
    <div class="min-h-screen bg-surface">
        <Sidebar />

        <!-- Main content area — pushed right on desktop, bottom-padded on mobile -->
        <main class="lg:ml-72 min-h-screen">
            <div
                class="p-4 pt-16 lg:pt-8 lg:p-8 pb-24 lg:pb-8 max-w-7xl mx-auto"
            >
                {@render children()}
            </div>
        </main>

        <!-- PWA prompts -->
        <InstallPrompt />
        <UpdatePrompt />
    </div>
{/if}
