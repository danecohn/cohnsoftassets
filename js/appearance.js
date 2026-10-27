// SPDX-License-Identifier: GPL-3.0-or-later
'use strict';
(() => {
 const root = document.documentElement, appearance = document.querySelector('#appearance'), font = document.querySelector('#system-font');
 if (!appearance || !font) return;
 let saved = 'dark', useSystem = false;
 try { saved = localStorage.getItem('vigiltech-appearance') || 'dark'; useSystem = localStorage.getItem('vigiltech-font') === 'system'; } catch {}
 if (!['dark','light','system'].includes(saved)) saved = 'dark';
 const apply = () => { if (appearance.value === 'system') delete root.dataset.theme; else root.dataset.theme = appearance.value; document.body.dataset.font = font.checked ? 'system' : 'vigil'; };
 appearance.value = saved; font.checked = useSystem; apply();
 const save = () => { apply(); try { localStorage.setItem('vigiltech-appearance', appearance.value); localStorage.setItem('vigiltech-font', font.checked ? 'system' : 'vigil'); } catch {} };
 appearance.addEventListener('change', save); font.addEventListener('change', save);
 document.querySelectorAll('.vt-segmented').forEach(group => group.addEventListener('click', event => { const button = event.target.closest('button'); if (button) group.querySelectorAll('button').forEach(item => item.setAttribute('aria-pressed', String(item === button))); }));
})();
