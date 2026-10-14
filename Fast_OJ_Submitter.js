// ==UserScript==
// @name         Fast Universal OJ Submitter
// @namespace    http://tampermonkey.net/
// @version      2.2
// @license      MIT
// @description  Instant Direct POST for DMOJ & SPOJ; Fast UI Injection for AtCoder, Codeforces & MarisaOJ with Zero-delay Turnstile.
// @author       TomDev
// @match        https://cses.fi/problemset/*
// @match        https://oj.vnoi.info/problem/*
// @match        https://oj.vnoi.info/submit/*
// @match        https://atcoder.jp/contests/*/tasks/*
// @match        https://atcoder.jp/contests/*/submit*
// @match        *://codeforces.com/contest/*
// @match        *://codeforces.com/gym/*
// @match        *://codeforces.com/problemset/*
// @match        *://codeforces.com/problemsets/*
// @match        *://*.codeforces.com/contest/*
// @match        *://*.codeforces.com/gym/*
// @match        *://*.codeforces.com/problemset/*
// @match        *://*.codeforces.com/problemsets/*
// @match        https://marisaoj.com/problem/*
// @match        https://marisaoj.com/submit/*
// @match        *://*.spoj.com/problems/*
// @match        *://*.spoj.com/submit/*
// @match        https://oj.iuhcoder.com/problem/*
// @match        https://oj.iuhcoder.com/submit/*
// @match        https://oj.giftedbat.edu.vn/problem/*
// @match        https://oj.giftedbat.edu.vn/submit/*
// @grant        unsafeWindow
// @run-at       document-end
// ==/UserScript==

(function() {
    'use strict';

    // =========================================================================
    // 1. CẤU HÌNH OJ & NGÔN NGỮ MẶC ĐỊNH
    // =========================================================================
    const OJ_REGISTRY = [
        {
            name: 'VNOI',
            type: 'dmoj_post',
            match: /oj\.vnoi\.info\/problem\/([^/?#]+)/,
            getSubmitUrl: (m) => `https://oj.vnoi.info/problem/${m[1]}/submit`,
            lang: 'C++17'
        },
        {
            name: 'IUHCoder',
            type: 'dmoj_post',
            match: /oj\.iuhcoder\.com\/problem\/([^/?#]+)/,
            getSubmitUrl: (m) => `https://oj.iuhcoder.com/problem/${m[1]}/submit`,
            lang: 'CPP17'
        },
        {
            name: 'GiftedBat',
            type: 'dmoj_post',
            match: /oj\.giftedbat\.edu\.vn\/problem\/([^/?#]+)/,
            getSubmitUrl: (m) => `https://oj.giftedbat.edu.vn/problem/${m[1]}/submit`,
            lang: 'CPP17'
        },
        {
            name: 'SPOJ',
            type: 'spoj_post',
            match: /spoj\.com\/(?:problems|submit)\/([^/?#]+)/,
            getSubmitUrl: () => `${window.location.origin}/submit/complete/`,
            langId: 44
        },
        {
            name: 'CSES',
            type: 'cses_post',
            match: /cses\.fi\/problemset\/(task|submit)\/(\d+)/,
            getSubmitUrl: (m) => `https://cses.fi/problemset/submit/${m[2]}/`
        },
        {
            name: 'MarisaOJ',
            type: 'ui_simulation',
            match: /marisaoj\.com\/(problem|submit)\/(\d+)/,
            getSubmitUrl: (m) => `https://marisaoj.com/submit/${m[2]}`
        },
        {
            name: 'AtCoder',
            type: 'ui_simulation',
            match: /atcoder\.jp\/contests\/([^/]+)\/(tasks|submit)(\/([^/?]+))?/,
            getSubmitUrl: (m, url) => {
                const task = m[4] || new URL(url).searchParams.get('taskScreenName');
                return `https://atcoder.jp/contests/${m[1]}/submit${task ? '?taskScreenName=' + task : ''}`;
            }
        },
        {
            name: 'Codeforces',
            type: 'ui_simulation',
            match: /codeforces\.com\/(contest|gym|problemset|problemsets)/,
            getSubmitUrl: (m, url) => {
                const u = new URL(url);
                const segs = u.pathname.split('/').filter(Boolean);
                if (['contest', 'gym'].includes(segs[0]) && segs.length >= 2) {
                    return `${u.origin}/${segs[0]}/${segs[1]}/submit`;
                }
                if (segs[0] === 'problemsets' && segs.length >= 2) {
                    return `${u.origin}/problemsets/${segs[1]}/submit`;
                }
                return `${u.origin}/problemset/submit`;
            },
            getProblemIndex: (url) => {
                const u = new URL(url);
                const segs = u.pathname.split('/').filter(Boolean);
                if (['contest', 'gym'].includes(segs[0]) && segs.length >= 4 && segs[2] === 'problem') return segs[3];
                if (segs[0] === 'problemset' && segs.length >= 4 && segs[1] === 'problem') return segs[2] + segs[3];
                if (segs[0] === 'problemsets' && segs[1] === 'acmsguru' && segs.length >= 5 && segs[2] === 'problem') return segs[4];
                return null;
            }
        }
    ];

    // =========================================================================
    // 2. DIRECT POST ENGINES
    // =========================================================================
    function submitDMOJDirectly(submitUrl, code, defaultLang) {
        let csrfToken = document.cookie.match(/csrftoken=([^;]+)/)?.[1] || '';
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) csrfToken = csrfInput.value;

        const langSelect = document.querySelector('select[name="language"]');
        const language = (langSelect && langSelect.value) ? langSelect.value : (defaultLang || 'CPP17');

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;

        const fields = { 'csrfmiddlewaretoken': csrfToken, 'language': language, 'source': code };
        for (const [k, v] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = v;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
    }

    function submitSPOJDirectly(submitUrl, problemCode, code, langId) {
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;

        const fields = { 'problemcode': problemCode, 'lang': langId || 44, 'file': code, 'subpage': 'problems' };
        for (const [k, v] of Object.entries(fields)) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = k;
            input.value = v;
            form.appendChild(input);
        }
        document.body.appendChild(form);
        form.submit();
    }

    function submitCSESDirectly(submitUrl, code) {
        let csrfToken = document.querySelector('input[name="csrf_token"]')?.value || '';
        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;
        form.enctype = 'multipart/form-data';

        if (csrfToken) {
            const csrfInput = document.createElement('input');
            csrfInput.type = 'hidden';
            csrfInput.name = 'csrf_token';
            csrfInput.value = csrfToken;
            form.appendChild(csrfInput);
        }

        const dt = new DataTransfer();
        dt.items.add(new File([code], 'solution.cpp', { type: 'text/plain' }));

        const fileInput = document.createElement('input');
        fileInput.type = 'file';
        fileInput.name = 'file';
        fileInput.files = dt.files;
        form.appendChild(fileInput);

        document.body.appendChild(form);
        form.submit();
    }

    // =========================================================================
    // 3. UI INJECTION & TURNSTILE ENGINE
    // =========================================================================
    function syncHiddenInputs(code) {
        const els = document.querySelectorAll(
            'textarea[name="source"], #sourceCodeTextarea, textarea[name="code"], textarea[name="solution"], #sourceCode, textarea[name="sourcefile"], input[name="source"]'
        );
        els.forEach(el => {
            el.value = code;
            el.dispatchEvent(new Event('input', { bubbles: true }));
            el.dispatchEvent(new Event('change', { bubbles: true }));
        });
    }

    function selectProblemOption(problem) {
        if (!problem) return;
        const select = document.querySelector('select[name="submittedProblemIndex"], select[name="data.TaskScreenName"]');
        if (!select) return;

        const target = problem.trim().toUpperCase();
        const opt = [...select.options].find(o => {
            const val = o.value.trim().toUpperCase();
            const txt = o.textContent.trim().toUpperCase();
            return val === target || (val.length > target.length && val.endsWith(target)) ||
                   txt === target || txt.startsWith(target + ' ') || txt.startsWith(target + ' -') || txt.startsWith(target + '.');
        });

        if (opt && select.value !== opt.value) {
            select.value = opt.value;
            select.dispatchEvent(new Event('change', { bubbles: true }));
        }
    }

    function injectCodeIntoEditor(code) {
        // Monaco Editor (MarisaOJ)
        if (unsafeWindow.monaco?.editor) {
            try {
                const models = unsafeWindow.monaco.editor.getModels();
                if (models?.length > 0) {
                    models[0].setValue(code);
                    syncHiddenInputs(code);
                    return true;
                }
            } catch (e) {}
        }

        // Ace Editor (AtCoder & Codeforces)
        let aceInjected = false;
        if (unsafeWindow.ace) {
            try {
                const el = document.querySelector('.ace_editor') || document.getElementById('editor');
                if (el) {
                    const editor = unsafeWindow.ace.edit(el);
                    if (editor) {
                        editor.setValue(code, -1);
                        syncHiddenInputs(code);
                        aceInjected = true;
                    }
                }
            } catch (e) {}
        }

        try {
            const script = document.createElement('script');
            script.textContent = `
            (function() {
                try {
                    if (typeof ace !== 'undefined' && ace.edit) {
                        const edElem = document.getElementById('editor') || document.querySelector('.ace_editor');
                        if (edElem) {
                            const ed = ace.edit(edElem);
                            if (ed) ed.setValue(${JSON.stringify(code)}, -1);
                        }
                    }
                } catch(e) {}
            })();`;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
            syncHiddenInputs(code);
            aceInjected = true;
        } catch (_) {}

        if (aceInjected) return true;

        // CodeMirror 5 & 6
        const cmEl = document.querySelector('.CodeMirror');
        if (cmEl?.CodeMirror) {
            try {
                cmEl.CodeMirror.setValue(code);
                cmEl.CodeMirror.save();
                syncHiddenInputs(code);
                return true;
            } catch (e) {}
        }

        const cm6El = document.querySelector('.cm-editor');
        if (cm6El?.cmView?.view) {
            try {
                cm6El.cmView.view.dispatch({
                    changes: { from: 0, to: cm6El.cmView.view.state.doc.length, insert: code }
                });
                syncHiddenInputs(code);
                return true;
            } catch (e) {}
        }

        // Plain Textarea
        const ta = document.querySelector('#sourceCodeTextarea, #sourceCode, textarea[name="source"], textarea[name="code"], textarea[name="solution"], #editor textarea');
        if (ta && ta.offsetParent !== null) {
            ta.value = code;
            ta.dispatchEvent(new Event('input', { bubbles: true }));
            ta.dispatchEvent(new Event('change', { bubbles: true }));
            return true;
        }

        return false;
    }

    function getTurnstileToken() {
        try {
            if (unsafeWindow.turnstile && typeof unsafeWindow.turnstile.getResponse === 'function') {
                const token = unsafeWindow.turnstile.getResponse();
                if (token && token.length > 0) return token;
            }
        } catch (_) {}

        const cfInput = document.querySelector('input[name="cf-turnstile-response"], [name="cf_challenge_response"], [name="g-recaptcha-response"]');
        if (cfInput && cfInput.value && cfInput.value.trim().length > 0) {
            return cfInput.value.trim();
        }
        return null;
    }

    function triggerSubmitButton() {
        try {
            const script = document.createElement('script');
            script.textContent = `
            (function() {
                try {
                    const form = document.querySelector('form.submit-form') || document.querySelector('form[action*="submit"]');
                    const select = document.getElementsByName('submittedProblemIndex')[0];
                    const ta = document.getElementById('sourceCodeTextarea') || document.querySelector('textarea[name="source"]');

                    if (typeof ace !== 'undefined' && ace.edit) {
                        const editorElem = document.getElementById('editor') || document.querySelector('.ace_editor');
                        if (editorElem) {
                            const ed = ace.edit(editorElem);
                            if (ed && ta) ta.value = ed.getValue();
                        }
                    }

                    if (select && (!select.value || select.value === '')) {
                        const firstVal = [...select.options].find(o => o.value && o.value !== '');
                        if (firstVal) select.value = firstVal.value;
                    }

                    if (typeof $ !== 'undefined' && form) {
                        const $form = $(form);
                        const btn = $form.find('input[type="submit"], .submit, button[type="submit"], #submit')[0];
                        if (btn) $(btn).trigger('click');
                        $form.trigger('submit');
                        if (form.submit && typeof form.submit === 'function') form.submit();
                    } else if (form) {
                        const btn = form.querySelector('input[type="submit"], .submit, button[type="submit"], #submit');
                        if (btn) btn.click();
                        else if (form.submit) form.submit();
                    }
                } catch(e) {}
            })();`;
            (document.head || document.documentElement).appendChild(script);
            script.remove();
        } catch (_) {}

        const selectors = [
            'form.submit-form input[type="submit"]',
            'form.submit-form .submit',
            '#submit',
            'input[type="submit"][value="Submit"]',
            'button[type="submit"]',
            'input[type="submit"]'
        ];
        for (const sel of selectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null && !btn.disabled) {
                btn.click();
                break;
            }
        }
    }

    function executeUISubmission(code, problem) {
        const sourceFilesTab = document.getElementById('sourceFilesTab');
        if (sourceFilesTab?.classList.contains('selectedTab')) {
            const singleSourceFileTab = document.getElementById('singleSourceFileTab');
            const link = singleSourceFileTab?.querySelector('a') || singleSourceFileTab?.firstElementChild;
            if (link) link.click();
        }

        let attempts = 0;
        const maxAttempts = 40;

        const fillTimer = setInterval(() => {
            attempts++;
            if (problem) selectProblemOption(problem);
            const injected = injectCodeIntoEditor(code);

            if (injected || attempts >= maxAttempts) {
                clearInterval(fillTimer);

                const isTurnstileSite = window.location.hostname.includes('codeforces.com') || window.location.hostname.includes('atcoder.jp');
                let submitted = false;
                const doSubmit = () => {
                    if (submitted) return;
                    submitted = true;
                    setTimeout(triggerSubmitButton, 100);
                };

                const watchInput = () => {
                    const cfInput = document.querySelector('input[name="cf-turnstile-response"]');
                    if (cfInput && !cfInput.__hooked) {
                        cfInput.__hooked = true;
                        let val = cfInput.value;
                        Object.defineProperty(cfInput, 'value', {
                            get: () => val,
                            set: (newVal) => {
                                val = newVal;
                                if (newVal && newVal.trim().length > 0) doSubmit();
                            },
                            configurable: true
                        });
                    }
                };
                watchInput();

                let elapsed = 0;
                const maxWait = 15000;
                const checkInterval = 50;

                const cfTimer = setInterval(() => {
                    elapsed += checkInterval;
                    watchInput();

                    const token = getTurnstileToken();
                    if (token) {
                        clearInterval(cfTimer);
                        doSubmit();
                        return;
                    }

                    if (!isTurnstileSite && elapsed > 1500) {
                        const hasWidget = document.querySelector('.cf-turnstile, iframe[src*="challenges.cloudflare.com"]');
                        if (!hasWidget) {
                            clearInterval(cfTimer);
                            doSubmit();
                            return;
                        }
                    }

                    if (elapsed >= maxWait) {
                        clearInterval(cfTimer);
                        doSubmit();
                    }
                }, checkInterval);
            }
        }, 100);
    }

    // =========================================================================
    // 4. DISPATCHER & EVENT LISTENERS
    // =========================================================================
    function handleSubmission(code) {
        const currentUrl = window.location.href;

        for (const target of OJ_REGISTRY) {
            const match = currentUrl.match(target.match);
            if (match) {
                const submitUrl = target.getSubmitUrl(match, currentUrl);

                if (target.type === 'dmoj_post') {
                    submitDMOJDirectly(submitUrl, code, target.lang);
                    return;
                }

                if (target.type === 'spoj_post') {
                    submitSPOJDirectly(submitUrl, match[1], code, target.langId);
                    return;
                }

                if (target.type === 'cses_post') {
                    submitCSESDirectly(submitUrl, code);
                    return;
                }

                if (target.type === 'ui_simulation') {
                    const probIdx = target.getProblemIndex ? target.getProblemIndex(currentUrl) : null;
                    if (submitUrl !== currentUrl && !currentUrl.includes('/submit')) {
                        sessionStorage.setItem('oj_autosubmit_code', code);
                        if (probIdx) sessionStorage.setItem('oj_autosubmit_problem', probIdx);
                        window.location.href = submitUrl;
                    } else {
                        executeUISubmission(code, probIdx);
                    }
                    return;
                }
            }
        }

        executeUISubmission(code);
    }

    window.addEventListener('keydown', async (e) => {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            if (e.target && e.target.tagName === 'INPUT' && ['text', 'search'].includes(e.target.type)) return;
            e.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                if (text?.trim()) handleSubmission(text);
            } catch (err) {
                console.warn("[AutoSubmit] Không đọc được Clipboard:", err);
            }
        }

        if (e.altKey && e.key.toLowerCase() === 's') {
            e.preventDefault();
            const input = document.createElement('input');
            input.type = 'file';
            input.accept = '.cpp,.c,.py,.java,.pas,.txt';
            input.onchange = (ev) => {
                const file = ev.target.files[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = (re) => handleSubmission(re.target.result);
                reader.readAsText(file);
            };
            input.click();
        }
    });

    const savedCode = sessionStorage.getItem('oj_autosubmit_code');
    const savedProblem = sessionStorage.getItem('oj_autosubmit_problem');
    if (savedCode) {
        sessionStorage.removeItem('oj_autosubmit_code');
        sessionStorage.removeItem('oj_autosubmit_problem');
        setTimeout(() => executeUISubmission(savedCode, savedProblem), 300);
    }
})();
