import { h as head } from "../../../../chunks/index2.js";
import "@sveltejs/kit/internal";
import "../../../../chunks/exports.js";
import "../../../../chunks/utils.js";
import "clsx";
import "@sveltejs/kit/internal/server";
import "../../../../chunks/root.js";
import "../../../../chunks/state.svelte.js";
import "../../../../chunks/supabase.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("1nolav9", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Verify Document — Smart E-VISION</title>`);
      });
    });
    $$renderer2.push(`<div class="min-h-screen gradient-mesh flex items-center justify-center p-6"><div class="w-full max-w-lg animate-slide-up"><div class="text-center mb-8"><div class="w-14 h-14 mx-auto rounded-2xl bg-gradient-to-br from-gov-blue to-gov-blue-dark flex items-center justify-center text-white text-2xl font-bold shadow-elevated mb-3">E</div> <h1 class="text-xl font-bold text-text-primary">Smart E-VISION</h1> <p class="text-sm text-text-muted">Document Verification</p></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="glass-card-static p-10 text-center animate-pulse"><p class="text-text-muted">Verifying document...</p></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="text-center mt-6"><a href="/dashboard" class="text-sm text-text-muted hover:text-gov-blue transition-colors">BACK TO Smart E-VISION</a></div></div></div>`);
  });
}
export {
  _page as default
};
