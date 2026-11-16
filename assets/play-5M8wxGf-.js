import{c as $}from"./createLucideIcon-FL6ee3o0.js";function m(f,a=!1){const c=/^#?([0-9a-f]{6})$/i.exec(f??"");if(!c)return a?"#3d36d6":"#4a43e8";const r=parseInt(c[1],16),t=(r>>16)/255,o=(r>>8&255)/255,s=(r&255)/255,u=Math.max(t,o,s),h=Math.min(t,o,s),i=u-h;let n=0;i&&(n=u===t?(o-s)/i%6:u===o?(s-t)/i+2:(t-o)/i+4),n=(n*60+360)%360;const e=a?6:0;return n>=25&&n<50?`hsl(32 74% ${55-e}%)`:n>=50&&n<75?`hsl(42 72% ${50-e}%)`:n>=75&&n<180?`hsl(${Math.round(n)} 40% ${52-e}%)`:n>=180&&n<210?`hsl(${Math.round(n)} 52% ${44-e}%)`:n<25||n>=330?`hsl(${Math.round(n)} 62% ${58-e}%)`:`hsl(${Math.round(n)} 58% ${58-e}%)`}function p(f,a=.45){const c=/^#?([0-9a-f]{6})$/i.exec(f??"");if(!c)return"#f4f6fb";const r=parseInt(c[1],16),t=o=>Math.round(o*a+255*(1-a));return`rgb(${t(r>>16)}, ${t(r>>8&255)}, ${t(r&255)})`}/**
 * @license lucide-react v0.487.0 - ISC
 *
 * This source code is licensed under the ISC license.
 * See the LICENSE file in the root directory of this source tree.
 */const d=[["polygon",{points:"6 3 20 12 6 21 6 3",key:"1oa8hb"}]],M=$("play",d);export{M as P,m as a,p as c};
