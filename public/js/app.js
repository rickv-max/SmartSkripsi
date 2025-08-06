document.addEventListener('DOMContentLoaded', () => {
    // STATE & CACHE (Tidak ada perubahan)
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) {
        setTimeout(() => {
            loadingScreen.classList.add('hidden');
        }, 3400);
    }
    const appState = { topic: '', problem: '', generated: {}, currentView: 'form-home' };
    const navLinks = document.querySelectorAll('.nav-link');
    const sidebar = document.getElementById('sidebar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const menuOpenIcon = document.getElementById('menu-open-icon');
    const menuCloseIcon = document.getElementById('menu-close-icon');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    // Tombol generate sekarang dibuat dinamis, jadi kita tidak memilihnya di awal
    const copyAllBtn = document.getElementById('copyAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');

    // =====================================================================
    // DATA BARU: Struktur Bab dan Sub-Bab untuk UI dinamis
    // =====================================================================
    const chaptersData = {
        'bab1': {
            title: 'BAB I: PENDAHULUAN',
            subChapters: [ '1.1 Latar Belakang', '1.2 Rumusan Masalah', '1.3 Tujuan Penelitian', '1.4 Kontribusi Penelitian', '1.5 Orisinalitas' ]
        },
        'bab2': {
            title: 'BAB II: TINJAUAN PUSTAKA',
            subChapters: [ '2.1 Tinjauan Umum tentang Topik', '2.2 Teori-teori Relevan', '2.3 Penelitian Terdahulu yang Relevan' ]
        },
        'bab3': {
            title: 'BAB III: METODE PENELITIAN',
            subChapters: [ '3.1 Pendekatan Penelitian', '3.2 Jenis Penelitian', '3.3 Lokasi atau Ruang Lingkup Penelitian', '3.4 Teknik Pengumpulan Data', '3.5 Teknik Analisis Data' ]
        },
        'bab4': {
            title: 'BAB IV: PEMBAHASAN',
            subChapters: [ 'Pembahasan Rumusan Masalah Pertama', 'Pembahasan Rumusan Masalah Kedua' ]
        }
    };
    // =====================================================================


    // FUNGSI INTI
    const toggleMenu = () => { // Tidak ada perubahan
        sidebar.classList.toggle('-translate-x-full');
        sidebar.classList.toggle('translate-x-0');
        sidebarOverlay.classList.toggle('hidden');
        menuOpenIcon.classList.toggle('hidden');
        menuCloseIcon.classList.toggle('hidden');
    };

    // FUNGSI BARU: Untuk merender pilihan sub-bab dan tombolnya
    const renderSubChapterOptions = (chapterId, container) => {
        container.innerHTML = ''; // Kosongkan container dulu
        if (!chaptersData[chapterId]) return;

        // Buat daftar pilihan
        const optionsHtml = chaptersData[chapterId].subChapters.map(subChapter => `
            <div class="sub-chapter-option flex items-center mb-3">
                <input type="radio" id="${subChapter.replace(/\s+/g, '-')}" name="subchapter-${chapterId}" value="${subChapter}" class="h-4 w-4 text-primary focus:ring-primary border-gray-300">
                <label for="${subChapter.replace(/\s+/g, '-')}" class="ml-3 block text-sm font-medium text-light">${subChapter}</label>
            </div>
        `).join('');
        
        container.innerHTML = `
            <div class="space-y-4">
                <label class="form-label">Pilih sub-bab yang ingin dibuat:</label>
                ${optionsHtml}
            </div>
            <button class="generate-button mt-6" data-chapter="${chapterId}" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 button-icon"><path fill-rule="evenodd" d="M10.868 2.884c.321.077.635.148.942.22a.75.75 0 01.706.853l-.612 3.06a.75.75 0 00.298.635l2.525 2.148a.75.75 0 01-.247 1.293l-3.374.692a.75.75 0 00-.573.433l-1.42 3.108a.75.75 0 01-1.33.001l-1.42-3.108a.75.75 0 00-.573-.433l-3.374-.692a.75.75 0 01-.247-1.293l2.525-2.148a.75.75 0 00.298-.635l-.612-3.06a.75.75 0 01.706-.853c.307-.072.62-.143.942-.22z" clip-rule="evenodd" /></svg>
                <span class="button-text">Bangun Draf Sub-Bab</span>
            </button>
        `;

        // Tambahkan event listener untuk radio button dan tombol generate yang baru dibuat
        const formSection = document.getElementById(`form-${chapterId}`);
        const newGenerateButton = formSection.querySelector('.generate-button');
        const radioButtons = formSection.querySelectorAll(`input[name="subchapter-${chapterId}"]`);

        radioButtons.forEach(radio => {
            radio.addEventListener('change', () => {
                newGenerateButton.disabled = false; // Aktifkan tombol jika sub-bab dipilih
            });
        });

        newGenerateButton.addEventListener('click', () => {
            const selectedSubChapter = formSection.querySelector(`input[name="subchapter-${chapterId}"]:checked`);
            if (selectedSubChapter) {
                generateSubChapter(chapterId, selectedSubChapter.value, newGenerateButton);
            }
        });
    };

    const switchView = (targetId) => { // Dimodifikasi sedikit
        document.querySelectorAll('.form-section').forEach(section => section.classList.add('hidden'));
        const targetSection = document.getElementById(targetId);
        
        if (targetSection) {
            targetSection.classList.remove('hidden');

            // Jika ini adalah form bab, render pilihan sub-babnya
            const chapterId = targetId.replace('form-', '');
            const subChapterContainer = targetSection.querySelector('.sub-chapter-container');
            if (subChapterContainer) {
                renderSubChapterOptions(chapterId, subChapterContainer);
            }
        }

        navLinks.forEach(link => {
            link.classList.remove('active');
            if (link.dataset.target === targetId) link.classList.add('active');
        });

        appState.currentView = targetId;
        const homepageCTA = document.getElementById('homepage-cta');
        if (homepageCTA) {
            homepageCTA.classList.toggle('hidden', targetId !== 'form-home');
        }
        if (window.innerWidth < 1024 && !sidebar.classList.contains('-translate-x-full')) {
            toggleMenu();
        }
        const resultContainer = document.getElementById('result-container');
        if (targetId === 'form-home' && resultContainer) {
            resultContainer.classList.add('hidden');
        } else if (resultContainer && Object.values(appState.generated).length > 0) {
            resultContainer.classList.remove('hidden');
        }
    };

    const updateUI = () => { // Dimodifikasi untuk append content
        const desktopPreview = document.getElementById('thesisContent');
        const resultContainer = document.getElementById('result-container');
        const placeholder = document.getElementById('draft-placeholder');
        if (!desktopPreview || !resultContainer || !placeholder) return;

        let fullText = '';
        let hasContent = false;
        resultContainer.innerHTML = '';

        ['bab1', 'bab2', 'bab3', 'bab4'].forEach(bab => {
            if (appState.generated[bab]) {
                const titleMap = { bab1: "BAB I: PENDAHULUAN", bab2: "BAB II: TINJAUAN PUSTAKA", bab3: "BAB III: METODE PENELITIAN", bab4: "BAB IV: PEMBAHASAN" };
                fullText += `<h2>${titleMap[bab]}</h2><div class="prose-content">${appState.generated[bab].replace(/\n/g, '<br>')}</div>`;
                
                const resultCard = document.createElement('div');
                resultCard.className = 'result-card';
                resultCard.innerHTML = `<h3>${titleMap[bab]}</h3><pre>${appState.generated[bab]}</pre>`;
                resultContainer.appendChild(resultCard);

                hasContent = true;
            }
        });

        if (!hasContent && appState.currentView !== 'form-home') {
            resultContainer.appendChild(placeholder);
            placeholder.style.display = 'block';
        } else {
            placeholder.style.display = 'none';
        }

        desktopPreview.innerHTML = hasContent ? fullText : `<p class="text-muted">Pratinjau keseluruhan akan muncul di sini.</p>`;
        copyAllBtn.classList.toggle('hidden', !hasContent);
        clearAllBtn.classList.toggle('hidden', !hasContent);
    };

    // Fungsi generate DIMODIFIKASI TOTAL menjadi generateSubChapter
    async function generateSubChapter(chapter, subChapterTitle, button) {
        const buttonTextSpan = button.querySelector('.button-text');
        const originalButtonText = buttonTextSpan.textContent;
        button.disabled = true;
        button.innerHTML = `<span class="loading-spinner"></span><span>Membangun...</span>`;
        
        appState.topic = document.getElementById('mainThesisTopic').value;
        appState.problem = document.getElementById('mainRumusanMasalah').value;
        if (!appState.topic || !appState.problem) {
            alert('Harap isi Topik dan Rumusan Masalah utama terlebih dahulu.');
            button.disabled = false;
            buttonTextSpan.textContent = originalButtonText;
            switchView('form-home');
            return;
        }
        
        // PAYLOAD BARU: Lebih sederhana
        const payload = { 
            topic: appState.topic, 
            problem: appState.problem, 
            subChapterTitle: subChapterTitle 
        };

        try {
            const response = await fetch('/.netlify/functions/generate-thesis', { 
                method: 'POST', 
                headers: { 'Content-Type': 'application/json' }, 
                body: JSON.stringify(payload) 
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.error || 'Request gagal');
            
            if (data.text) {
                // MODIFIKASI STATE: Tambahkan hasil baru ke bab yang ada
                const existingContent = appState.generated[chapter] || '';
                appState.generated[chapter] = existingContent + data.text + '\n\n';
                
                updateUI();
                document.querySelector(`.nav-link[data-target="form-${chapter}"]`).classList.add('completed');
            } else { 
                throw new Error("Respons dari server tidak berisi teks."); 
            }
        } catch (error) {
            alert('Gagal: ' + error.message);
        } finally {
            button.disabled = false;
            button.innerHTML = `
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 button-icon"><path fill-rule="evenodd" d="M10.868 2.884c.321.077.635.148.942.22a.75.75 0 01.706.853l-.612 3.06a.75.75 0 00.298.635l2.525 2.148a.75.75 0 01-.247 1.293l-3.374.692a.75.75 0 00-.573.433l-1.42 3.108a.75.75 0 01-1.33.001l-1.42-3.108a.75.75 0 00-.573-.433l-3.374-.692a.75.75 0 01-.247-1.293l2.525-2.148a.75.75 0 00.298-.635l-.612-3.06a.75.75 0 01.706-.853c.307-.072.62-.143.942-.22z" clip-rule="evenodd" /></svg>
                <span class="button-text">${originalButtonText}</span>
            `;
            button.disabled = true; // Nonaktifkan lagi setelah selesai
        }
    }

    // EVENT LISTENERS (Tidak banyak berubah)
    mobileMenuButton.addEventListener('click', toggleMenu);
    sidebarOverlay.addEventListener('click', toggleMenu);
    
    navLinks.forEach(link => { 
        link.addEventListener('click', (e) => { 
            e.preventDefault(); 
            switchView(e.currentTarget.dataset.target); 
        }); 
    });
    
    copyAllBtn.addEventListener('click', () => {
        const textToCopy = document.getElementById('thesisContent').innerText;
        navigator.clipboard.writeText(textToCopy).then(() => {
            alert('Seluruh draf berhasil disalin!');
        }).catch(err => {
            alert('Gagal menyalin.');
        });
    });

    clearAllBtn.addEventListener('click', () => {
        if (confirm('Apakah Anda yakin ingin menghapus semua hasil?')) {
            appState.generated = {};
            document.querySelectorAll('.nav-link').forEach(link => link.classList.remove('completed'));
            updateUI();
        }
    });

    // INISIALISASI
    switchView('form-home');
    updateUI();
});
