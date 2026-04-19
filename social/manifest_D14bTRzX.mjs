import 'piccolore';
import 'html-escaper';
import 'clsx';
import { N as NOOP_MIDDLEWARE_HEADER, g as decodeKey } from './chunks/astro/server_C8GjfOXF.mjs';
import 'es-module-lexer';

const NOOP_MIDDLEWARE_FN = async (_ctx, next) => {
  const response = await next();
  response.headers.set(NOOP_MIDDLEWARE_HEADER, "true");
  return response;
};

const codeToStatusMap = {
  // Implemented from IANA HTTP Status Code Registry
  // https://www.iana.org/assignments/http-status-codes/http-status-codes.xhtml
  BAD_REQUEST: 400,
  UNAUTHORIZED: 401,
  PAYMENT_REQUIRED: 402,
  FORBIDDEN: 403,
  NOT_FOUND: 404,
  METHOD_NOT_ALLOWED: 405,
  NOT_ACCEPTABLE: 406,
  PROXY_AUTHENTICATION_REQUIRED: 407,
  REQUEST_TIMEOUT: 408,
  CONFLICT: 409,
  GONE: 410,
  LENGTH_REQUIRED: 411,
  PRECONDITION_FAILED: 412,
  CONTENT_TOO_LARGE: 413,
  URI_TOO_LONG: 414,
  UNSUPPORTED_MEDIA_TYPE: 415,
  RANGE_NOT_SATISFIABLE: 416,
  EXPECTATION_FAILED: 417,
  MISDIRECTED_REQUEST: 421,
  UNPROCESSABLE_CONTENT: 422,
  LOCKED: 423,
  FAILED_DEPENDENCY: 424,
  TOO_EARLY: 425,
  UPGRADE_REQUIRED: 426,
  PRECONDITION_REQUIRED: 428,
  TOO_MANY_REQUESTS: 429,
  REQUEST_HEADER_FIELDS_TOO_LARGE: 431,
  UNAVAILABLE_FOR_LEGAL_REASONS: 451,
  INTERNAL_SERVER_ERROR: 500,
  NOT_IMPLEMENTED: 501,
  BAD_GATEWAY: 502,
  SERVICE_UNAVAILABLE: 503,
  GATEWAY_TIMEOUT: 504,
  HTTP_VERSION_NOT_SUPPORTED: 505,
  VARIANT_ALSO_NEGOTIATES: 506,
  INSUFFICIENT_STORAGE: 507,
  LOOP_DETECTED: 508,
  NETWORK_AUTHENTICATION_REQUIRED: 511
};
Object.entries(codeToStatusMap).reduce(
  // reverse the key-value pairs
  (acc, [key, value]) => ({ ...acc, [value]: key }),
  {}
);

function sanitizeParams(params) {
  return Object.fromEntries(
    Object.entries(params).map(([key, value]) => {
      if (typeof value === "string") {
        return [key, value.normalize().replace(/#/g, "%23").replace(/\?/g, "%3F")];
      }
      return [key, value];
    })
  );
}
function getParameter(part, params) {
  if (part.spread) {
    return params[part.content.slice(3)] || "";
  }
  if (part.dynamic) {
    if (!params[part.content]) {
      throw new TypeError(`Missing parameter: ${part.content}`);
    }
    return params[part.content];
  }
  return part.content.normalize().replace(/\?/g, "%3F").replace(/#/g, "%23").replace(/%5B/g, "[").replace(/%5D/g, "]");
}
function getSegment(segment, params) {
  const segmentPath = segment.map((part) => getParameter(part, params)).join("");
  return segmentPath ? "/" + segmentPath : "";
}
function getRouteGenerator(segments, addTrailingSlash) {
  return (params) => {
    const sanitizedParams = sanitizeParams(params);
    let trailing = "";
    if (addTrailingSlash === "always" && segments.length) {
      trailing = "/";
    }
    const path = segments.map((segment) => getSegment(segment, sanitizedParams)).join("") + trailing;
    return path || "/";
  };
}

function deserializeRouteData(rawRouteData) {
  return {
    route: rawRouteData.route,
    type: rawRouteData.type,
    pattern: new RegExp(rawRouteData.pattern),
    params: rawRouteData.params,
    component: rawRouteData.component,
    generate: getRouteGenerator(rawRouteData.segments, rawRouteData._meta.trailingSlash),
    pathname: rawRouteData.pathname || void 0,
    segments: rawRouteData.segments,
    prerender: rawRouteData.prerender,
    redirect: rawRouteData.redirect,
    redirectRoute: rawRouteData.redirectRoute ? deserializeRouteData(rawRouteData.redirectRoute) : void 0,
    fallbackRoutes: rawRouteData.fallbackRoutes.map((fallback) => {
      return deserializeRouteData(fallback);
    }),
    isIndex: rawRouteData.isIndex,
    origin: rawRouteData.origin
  };
}

function deserializeManifest(serializedManifest) {
  const routes = [];
  for (const serializedRoute of serializedManifest.routes) {
    routes.push({
      ...serializedRoute,
      routeData: deserializeRouteData(serializedRoute.routeData)
    });
    const route = serializedRoute;
    route.routeData = deserializeRouteData(serializedRoute.routeData);
  }
  const assets = new Set(serializedManifest.assets);
  const componentMetadata = new Map(serializedManifest.componentMetadata);
  const inlinedScripts = new Map(serializedManifest.inlinedScripts);
  const clientDirectives = new Map(serializedManifest.clientDirectives);
  const serverIslandNameMap = new Map(serializedManifest.serverIslandNameMap);
  const key = decodeKey(serializedManifest.key);
  return {
    // in case user middleware exists, this no-op middleware will be reassigned (see plugin-ssr.ts)
    middleware() {
      return { onRequest: NOOP_MIDDLEWARE_FN };
    },
    ...serializedManifest,
    assets,
    componentMetadata,
    inlinedScripts,
    clientDirectives,
    routes,
    serverIslandNameMap,
    key
  };
}

const manifest = deserializeManifest({"hrefRoot":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/","cacheDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/node_modules/.astro/","outDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/","srcDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/src/","publicDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/public/","buildClientDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/client/","buildServerDir":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/server/","adapterName":"","routes":[{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/bookmarks/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/bookmarks","isIndex":false,"type":"page","pattern":"^\\/bookmarks\\/?$","segments":[[{"content":"bookmarks","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/bookmarks.astro","pathname":"/bookmarks","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/leaderboard/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/leaderboard","isIndex":false,"type":"page","pattern":"^\\/leaderboard\\/?$","segments":[[{"content":"leaderboard","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/leaderboard.astro","pathname":"/leaderboard","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/login/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/login","isIndex":false,"type":"page","pattern":"^\\/login\\/?$","segments":[[{"content":"login","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/login.astro","pathname":"/login","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/messages/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/messages","isIndex":false,"type":"page","pattern":"^\\/messages\\/?$","segments":[[{"content":"messages","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/messages.astro","pathname":"/messages","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/notifications/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/notifications","isIndex":false,"type":"page","pattern":"^\\/notifications\\/?$","segments":[[{"content":"notifications","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/notifications.astro","pathname":"/notifications","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/profile/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/profile","isIndex":true,"type":"page","pattern":"^\\/profile\\/?$","segments":[[{"content":"profile","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/profile/index.astro","pathname":"/profile","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/search/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/search","isIndex":false,"type":"page","pattern":"^\\/search\\/?$","segments":[[{"content":"search","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/search.astro","pathname":"/search","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/research/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/space/research","isIndex":false,"type":"page","pattern":"^\\/space\\/research\\/?$","segments":[[{"content":"space","dynamic":false,"spread":false}],[{"content":"research","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/space/research.astro","pathname":"/space/research","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/roadmap/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/space/roadmap","isIndex":false,"type":"page","pattern":"^\\/space\\/roadmap\\/?$","segments":[[{"content":"space","dynamic":false,"spread":false}],[{"content":"roadmap","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/space/roadmap.astro","pathname":"/space/roadmap","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/space","isIndex":true,"type":"page","pattern":"^\\/space\\/?$","segments":[[{"content":"space","dynamic":false,"spread":false}]],"params":[],"component":"src/pages/space/index.astro","pathname":"/space","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}},{"file":"file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/index.html","links":[],"scripts":[],"styles":[],"routeData":{"route":"/","isIndex":true,"type":"page","pattern":"^\\/$","segments":[],"params":[],"component":"src/pages/index.astro","pathname":"/","prerender":true,"fallbackRoutes":[],"distURL":[],"origin":"project","_meta":{"trailingSlash":"ignore"}}}],"base":"/social","trailingSlash":"ignore","compressHTML":true,"componentMetadata":[["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/bookmarks.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/index.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/login.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/messages.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/notifications.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/profile/index.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/search.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/space/index.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/space/research.astro",{"propagation":"none","containsHead":true}],["/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/pages/space/roadmap.astro",{"propagation":"none","containsHead":true}]],"renderers":[],"clientDirectives":[["idle","(()=>{var l=(n,t)=>{let i=async()=>{await(await n())()},e=typeof t.value==\"object\"?t.value:void 0,s={timeout:e==null?void 0:e.timeout};\"requestIdleCallback\"in window?window.requestIdleCallback(i,s):setTimeout(i,s.timeout||200)};(self.Astro||(self.Astro={})).idle=l;window.dispatchEvent(new Event(\"astro:idle\"));})();"],["load","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).load=e;window.dispatchEvent(new Event(\"astro:load\"));})();"],["media","(()=>{var n=(a,t)=>{let i=async()=>{await(await a())()};if(t.value){let e=matchMedia(t.value);e.matches?i():e.addEventListener(\"change\",i,{once:!0})}};(self.Astro||(self.Astro={})).media=n;window.dispatchEvent(new Event(\"astro:media\"));})();"],["only","(()=>{var e=async t=>{await(await t())()};(self.Astro||(self.Astro={})).only=e;window.dispatchEvent(new Event(\"astro:only\"));})();"],["visible","(()=>{var a=(s,i,o)=>{let r=async()=>{await(await s())()},t=typeof i.value==\"object\"?i.value:void 0,c={rootMargin:t==null?void 0:t.rootMargin},n=new IntersectionObserver(e=>{for(let l of e)if(l.isIntersecting){n.disconnect(),r();break}},c);for(let e of o.children)n.observe(e)};(self.Astro||(self.Astro={})).visible=a;window.dispatchEvent(new Event(\"astro:visible\"));})();"]],"entryModules":{"\u0000noop-middleware":"_noop-middleware.mjs","\u0000virtual:astro:actions/noop-entrypoint":"noop-entrypoint.mjs","\u0000@astro-page:src/pages/bookmarks@_@astro":"pages/bookmarks.astro.mjs","\u0000@astro-page:src/pages/leaderboard@_@astro":"pages/leaderboard.astro.mjs","\u0000@astro-page:src/pages/login@_@astro":"pages/login.astro.mjs","\u0000@astro-page:src/pages/messages@_@astro":"pages/messages.astro.mjs","\u0000@astro-page:src/pages/notifications@_@astro":"pages/notifications.astro.mjs","\u0000@astro-page:src/pages/profile/index@_@astro":"pages/profile.astro.mjs","\u0000@astro-page:src/pages/search@_@astro":"pages/search.astro.mjs","\u0000@astro-page:src/pages/space/research@_@astro":"pages/space/research.astro.mjs","\u0000@astro-page:src/pages/space/roadmap@_@astro":"pages/space/roadmap.astro.mjs","\u0000@astro-page:src/pages/space/index@_@astro":"pages/space.astro.mjs","\u0000@astro-page:src/pages/index@_@astro":"pages/index.astro.mjs","\u0000@astro-renderers":"renderers.mjs","\u0000@astrojs-manifest":"manifest_D14bTRzX.mjs","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/BookmarksView":"_astro/BookmarksView.DO0PMOKK.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/SearchView":"_astro/SearchView.DSmfHQiv.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/NotificationsList":"_astro/NotificationsList.CPAx6RSF.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/AuthForm":"_astro/AuthForm.3P_Lhr4L.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/NavAuth":"_astro/NavAuth.BKjqZWTa.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/MobileNavAuth":"_astro/MobileNavAuth.DfVMM1pN.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/node_modules/@preact/signals/dist/signals.module.js":"_astro/signals.module.BAEbmU-G.js","@astrojs/preact/client.js":"_astro/client.yiQ3kqIY.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/ConversationsList":"_astro/ConversationsList.BeJp1SS_.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/PostComposer":"_astro/PostComposer.Bk3sMAL-.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/ProfilePage":"_astro/ProfilePage.BVTcoWyG.js","/sessions/relaxed-keen-euler/mnt/FRQNCY WEBSITE/social/src/components/Feed":"_astro/Feed.C2R396ae.js","astro:scripts/before-hydration.js":""},"inlinedScripts":[],"assets":["/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/bookmarks/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/leaderboard/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/login/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/messages/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/notifications/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/profile/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/search/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/research/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/roadmap/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/space/index.html","/social/file:///sessions/relaxed-keen-euler/mnt/FRQNCY%20WEBSITE/social/dist/index.html"],"buildFormat":"directory","checkOrigin":false,"allowedDomains":[],"actionBodySizeLimit":1048576,"serverIslandNameMap":[],"key":"qQUcz5dBqkgu9CJ34BCOqxz9CH9BIgh6CJv4oY1zEPM="});
if (manifest.sessionConfig) manifest.sessionConfig.driverModule = null;

export { manifest };
