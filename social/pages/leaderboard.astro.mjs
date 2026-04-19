/* empty css                                     */
import { c as createComponent, b as createAstro } from '../chunks/astro/server_C8GjfOXF.mjs';
import 'piccolore';
import 'html-escaper';
import 'clsx';
export { renderers } from '../renderers.mjs';

const $$Astro = createAstro();
const $$Leaderboard = createComponent(($$result, $$props, $$slots) => {
  const Astro2 = $$result.createAstro($$Astro, $$props, $$slots);
  Astro2.self = $$Leaderboard;
  return Astro2.redirect("/social/space");
}, "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/leaderboard.astro", void 0);

const $$file = "/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/leaderboard.astro";
const $$url = "/social/leaderboard";

const _page = /*#__PURE__*/Object.freeze(/*#__PURE__*/Object.defineProperty({
	__proto__: null,
	default: $$Leaderboard,
	file: $$file,
	url: $$url
}, Symbol.toStringTag, { value: 'Module' }));

const page = () => _page;

export { page };
