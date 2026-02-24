import { h as head, j as attr, e as ensure_array_like, g as escape_html, d as attr_class, f as stringify } from "../../../../chunks/index2.js";
import "../../../../chunks/supabase.js";
function _page($$renderer, $$props) {
  $$renderer.component(($$renderer2) => {
    let searchQuery = "";
    let selectedMonth = "all";
    const months = [
      "all",
      "January",
      "February",
      "March",
      "April",
      "May",
      "June",
      "July",
      "August",
      "September",
      "October",
      "November",
      "December"
    ];
    head("15mknmq", $$renderer2, ($$renderer3) => {
      $$renderer3.title(($$renderer4) => {
        $$renderer4.push(`<title>Archive — Smart E-VISION</title>`);
      });
    });
    $$renderer2.push(`<div><div class="mb-8"><h1 class="text-2xl font-bold text-text-primary">Document Archive</h1> <p class="text-base text-text-secondary mt-1">Browse and search your archived instructional records</p></div> <div class="glass-card-static p-4 mb-6 flex flex-col sm:flex-row items-stretch sm:items-center gap-4"><div class="flex-1 relative"><input type="text"${attr("value", searchQuery)} placeholder="Search by filename or SHA-256 hash..." class="w-full px-4 py-3 text-sm bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue outline-none min-h-[48px]"/></div> `);
    $$renderer2.select(
      {
        value: selectedMonth,
        class: "px-4 py-3 text-sm bg-white/50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-gov-blue/30 focus:border-gov-blue outline-none min-h-[48px]"
      },
      ($$renderer3) => {
        $$renderer3.push(`<!--[-->`);
        const each_array = ensure_array_like(months);
        for (let $$index = 0, $$length = each_array.length; $$index < $$length; $$index++) {
          let month = each_array[$$index];
          $$renderer3.option({ value: month }, ($$renderer4) => {
            $$renderer4.push(`${escape_html(month === "all" ? "All Months" : month)}`);
          });
        }
        $$renderer3.push(`<!--]-->`);
      }
    );
    $$renderer2.push(` <div class="flex rounded-xl border border-gray-200 overflow-hidden"><button${attr_class(`px-4 py-3 text-sm font-medium min-h-[48px] transition-colors ${stringify(
      "bg-gov-blue text-white"
    )}`)}>Grid</button> <button${attr_class(`px-4 py-3 text-sm font-medium min-h-[48px] transition-colors ${stringify("bg-white/50 text-text-muted hover:text-text-primary")}`)}>List</button></div></div> `);
    {
      $$renderer2.push("<!--[-->");
      $$renderer2.push(`<div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"><!--[-->`);
      const each_array_1 = ensure_array_like(Array(6));
      for (let $$index_1 = 0, $$length = each_array_1.length; $$index_1 < $$length; $$index_1++) {
        each_array_1[$$index_1];
        $$renderer2.push(`<div class="glass-card-static p-6 animate-pulse"><div class="h-4 bg-gray-200 rounded w-3/4 mb-3"></div> <div class="h-3 bg-gray-200 rounded w-1/2"></div></div>`);
      }
      $$renderer2.push(`<!--]--></div>`);
    }
    $$renderer2.push(`<!--]--></div>`);
  });
}
export {
  _page as default
};
