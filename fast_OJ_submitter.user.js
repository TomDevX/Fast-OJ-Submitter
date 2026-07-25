// ==UserScript==
// @name         CSES & VNOI & AtCoder & SPOJ fast submitter
// @namespace    http://tampermonkey.net/
// @version      1.0
// @license      MIT
// @description  Ctrl + S to auto paste clipboard, Alt + S to upload file.
// @author       TomDev
// @match        https://cses.fi/problemset/task/*
// @match        https://cses.fi/problemset/submit/*
// @match        https://oj.vnoi.info/problem/*
// @match        https://atcoder.jp/contests/*/tasks/*
// @match        https://atcoder.jp/contests/*/submit*
// @match        https://marisaoj.com/problem/*
// @match        https://marisaoj.com/submit/*
// @match        *://*.spoj.com/problems/*
// @match        *://*.spoj.com/submit/*
// @grant        unsafeWindow
// @run-at       document-end
// @downloadURL https://update.greasyfork.org/scripts/588502/CSES%20%20VNOI%20%20AtCoder%20%20SPOJ%20fast%20submitter.user.js
// @updateURL https://update.greasyfork.org/scripts/588502/CSES%20%20VNOI%20%20AtCoder%20%20SPOJ%20fast%20submitter.meta.js
// ==/UserScript==

(function() {
    'use strict';

    function getSubmitUrl(url) {
        if (url.includes('cses.fi')) {
            const m = url.match(/problemset\/task\/(\d+)/);
            if (m) return 'https://cses.fi/problemset/submit/' + m[1] + '/';
        }
        if (url.includes('oj.vnoi.info')) {
            if (!url.includes('/submit')) {
                let p = url.split('?')[0];
                if (p.endsWith('/')) p = p.slice(0, -1);
                return p + '/submit';
            }
        }
        if (url.includes('atcoder.jp')) {
            const m = url.match(/contests\/([^\/]+)\/tasks\/([^\/]+)/);
            if (m) return 'https://atcoder.jp/contests/' + m[1] + '/submit?taskScreenName=' + m[2];
        }
        if (url.includes('marisaoj.com')) {
            const m = url.match(/problem\/(\d+)/);
            if (m) return 'https://marisaoj.com/submit/' + m[1];
        }
        if (url.includes('spoj.com')) {
            const m = url.match(/spoj\.com\/problems\/([^\/]+)/);
            if (m) return window.location.origin + '/submit/' + m[1] + '/';
        }
        return url;
    }

    function submitVNOIDirectly(submitUrl, code) {
        let csrfToken = '';
        const csrfInput = document.querySelector('input[name="csrfmiddlewaretoken"]');
        if (csrfInput) {
            csrfToken = csrfInput.value;
        } else {
            const match = document.cookie.match(/csrftoken=([^;]+)/);
            if (match) csrfToken = match[1];
        }

        let currentLang = 'C++17';
        const langSelect = document.querySelector('select[name="language"]');
        if (langSelect && langSelect.value) {
            currentLang = langSelect.value;
        }

        const form = document.createElement('form');
        form.method = 'POST';
        form.action = submitUrl;

        const fields = {
            'csrfmiddlewaretoken': csrfToken,
            'language': currentLang,
            'source': code
        };

        for (const key in fields) {
            const input = document.createElement('input');
            input.type = 'hidden';
            input.name = key;
            input.value = fields[key];
            form.appendChild(input);
        }

        document.body.appendChild(form);
        form.submit();
    }

    function executeSubmit(code) {
        const url = window.location.href;

        // CSES Handler
        if (url.includes('cses.fi')) {
            const dt = new DataTransfer();
            const file = new File([code], 'solution.cpp', { type: 'text/plain' });
            dt.items.add(file);

            const fileInput = document.querySelector('input[type="file"][name="file"]');
            if (fileInput) {
                fileInput.files = dt.files;
                setTimeout(() => {
                    const btn = document.querySelector('input[type="submit"]');
                    if (btn) btn.click();
                }, 300);
            }
            return;
        }

        let attempts = 0;
        const maxAttempts = 40;

        const iv = setInterval(function() {
            attempts++;
            let success = false;

            // Ace Editor (AtCoder)
            if (unsafeWindow.ace) {
                try {
                    const editorEl = document.getElementById('editor') || document.querySelector('.ace_editor');
                    if (editorEl) {
                        const editor = unsafeWindow.ace.edit(editorEl);
                        if (editor) {
                            editor.setValue(code, -1);
                            success = true;
                        }
                    }
                } catch (e) {}
            }

            // CodeMirror (AtCoder / SPOJ / Others)
            const cmEl = document.querySelector('.CodeMirror');
            if (cmEl && cmEl.CodeMirror) {
                try {
                    cmEl.CodeMirror.setValue(code);
                    cmEl.CodeMirror.save();
                    success = true;
                } catch (e) {}
            }

            // Monaco Editor (MarisaOJ)
            if (unsafeWindow.monaco && unsafeWindow.monaco.editor) {
                try {
                    const models = unsafeWindow.monaco.editor.getModels();
                    if (models.length > 0) {
                        models[0].setValue(code);
                        success = true;
                    }
                } catch (e) {}
            }

            if (!success && !url.includes('oj.vnoi.info') && !url.includes('atcoder.jp') && !url.includes('marisaoj.com')) {
                const ta = document.querySelector('#sourceCode') || document.querySelector('textarea[name="source"]') || document.querySelector('#file');
                if (ta) {
                    ta.value = code;
                    success = true;
                }
            }

            if (success || attempts >= maxAttempts) {
                clearInterval(iv);

                let btn = null;
                if (url.includes('atcoder.jp')) {
                    btn = document.getElementById('submit');
                } else if (url.includes('marisaoj.com')) {
                    btn = document.querySelector('button[type="submit"]');
                } else if (url.includes('spoj.com')) {
                    btn = document.querySelector('input[type="submit"]') || document.querySelector('button[id="submit"]');
                }

                if (btn && success) {
                    const finalDelay = url.includes('atcoder.jp') ? 2000 : 200;
                    setTimeout(() => {
                        btn.click();
                    }, finalDelay);
                }
            }
        }, 150);
    }

    function processCode(code) {
        const currentUrl = window.location.href;
        const submitUrl = getSubmitUrl(currentUrl);

        if (currentUrl.includes('oj.vnoi.info')) {
            submitVNOIDirectly(submitUrl, code);
            return;
        }

        if (currentUrl.includes('/submit') || currentUrl === submitUrl) {
            executeSubmit(code);
        } else {
            sessionStorage.setItem('oj_autosubmit_data', JSON.stringify({ code: code }));
            window.location.href = submitUrl;
        }
    }

    window.addEventListener('keydown', async function(e) {
        if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 's') {
            e.preventDefault();
            try {
                const text = await navigator.clipboard.readText();
                if (text) processCode(text);
            } catch (err) {
                console.warn("[AutoSubmit] Lỗi Clipboard.");
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
                reader.onload = (re) => {
                    processCode(re.target.result);
                };
                reader.readAsText(file);
            };
            input.click();
        }
    });

    const dataStr = sessionStorage.getItem('oj_autosubmit_data');
    if (dataStr) {
        sessionStorage.removeItem('oj_autosubmit_data');
        setTimeout(() => {
            const data = JSON.parse(dataStr);
            executeSubmit(data.code);
        }, 500);
    }
})();
