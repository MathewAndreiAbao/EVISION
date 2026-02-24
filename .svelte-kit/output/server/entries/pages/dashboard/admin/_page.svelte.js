import { h as head, e as ensure_array_like } from "../../../../chunks/index2.js";
import "clsx";
import "../../../../chunks/supabase.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    head("wt9tlv", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Admin Config — Smart E-VISION</title>`);
      });
    });
    $$renderer2.push(`<div class="max-w-4xl mx-auto"><div class="mb-8"><h1 class="text-2xl font-bold text-text-primary uppercase tracking-tight flex items-center gap-2">System Parameters</h1> <p class="text-text-secondary mt-1">Manage global system parameters and compliance thresholds.</p></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="space-y-4"><!--[-->`);
      const each_array = ensure_array_like(Array(3));
      for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
        each_array[$$index];
        $$renderer2.push(`<div class="h-32 glass-card-static animate-pulse"></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--> <div class="mt-12 p-8 border-2 border-dashed border-gray-100 rounded-3xl text-center"><p class="text-sm text-text-muted italic">Additional configuration modules (School Management, User Roles, API
            Keys) are currently handled via Supabase Dashboard.</p></div></div>`);
  });
}
export {
  _page as default
};
