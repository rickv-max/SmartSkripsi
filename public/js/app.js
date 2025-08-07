document.addEventListener('DOMContentLoaded', () => {
    // === INISIALISASI ANIMASI PARTIKEL DIMULAI DI SINI ===
    tsParticles.load("particles-js", {
        background: {
            color: {
                value: 'transparent' // Membuat background canvas transparan
            }
        },
        fpsLimit: 60, // Batasi FPS untuk performa lebih baik
        particles: {
            number: {
                value: 120, // Jumlah partikel
                density: {
                    enable: true,
                    value_area: 800
                }
            },
            color: {
                value: "#ffffff" // Warna partikel
            },
            shape: {
                type: "circle"
            },
            opacity: {
                value: { min: 0.1, max: 0.5 }, // Opacity acak untuk efek berkelip
                animation: {
                    enable: true,
                    speed: 1,
                    minimumValue: 0.1,
                    sync: false
                }
            },
            size: {
                value: { min: 1, max: 3 } // Ukuran partikel acak
            },
            links: {
                enable: false, // Kita tidak ingin ada garis antar partikel
            },
            move: {
                enable: true,
                speed: 0.5, // Kecepatan gerak partikel
                direction: "none",
                random: true,
                straight: false,
                outModes: {
                    default: "out" // Partikel keluar dari layar
                }
            }
        },
        interactivity: {
            detectsOn: "canvas",
            events: {
                onHover: {
                    enable: false, // Interaksi saat hover dimatikan
                },
                onClick: {
                    enable: false, // Interaksi saat klik dimatikan
                },
                resize: true
            }
        },
        detectRetina: true
    });
    // === AKHIR INISIALISASI ===


    // STATE & CACHE (sisa kode Anda tetap sama)
    const loadingScreen = document.getElementById('loading-screen');
    if (loadingScreen) setTimeout(() => loadingScreen.classList.add('hidden'), 3400);

    const appState = { topic: '', problem: '', generated: {}, currentView: 'form-home' };
    const navLinks = document.querySelectorAll('.nav-link');
    // ... sisa kode JavaScript Anda persis sama seperti sebelumnya
    const sidebar = document.getElementById('sidebar');
    const mobileMenuButton = document.getElementById('mobile-menu-button');
    const menuOpenIcon = document.getElementById('menu-open-icon');
    const menuCloseIcon = document.getElementById('menu-close-icon');
    const sidebarOverlay = document.getElementById('sidebar-overlay');
    const copyAllBtn = document.getElementById('copyAllBtn');
    const clearAllBtn = document.getElementById('clearAllBtn');
    const desktopPreview = document.getElementById('thesisContent');

    const chaptersData = {
        'bab1': {
            title: 'BAB I: PENDAHULUAN',
            isCustom: false,
            subChapters: [
                { title: '1.1 Latar Belakang' },
                { title: '1.2 Rumusan Masalah' },
                { title: '1.3 Tujuan Penelitian' },
                { title: '1.4 Kontribusi Penelitian' },
                { title: '1.5 Orisinalitas', input: { id: 'orisinalitasInput', label: 'Sebutkan 3 judul penelitian terdahulu untuk dibuatkan tabel perbandingan (Opsional)' } }
            ]
        },
        'bab2': { title: 'BAB II: TINJAUAN PUSTAKA', isCustom: true },
        'bab3': {
            title: 'BAB III: METODE PENELITIAN',
            isCustom: false,
            subChapters: [
                { title: '3.1 Pendekatan Penelitian', input: { id: 'pendekatanInput', label: 'Pendekatan yang Digunakan (Contoh: Yuridis Empiris dengan kajian sosiologi hukum dan antropologi hukum)' } },
                { title: '3.2 Jenis Penelitian', input: { id: 'jenisInput', label: 'Jenis Penelitian (Contoh: Deskriptif Analitis)' } },
                { title: '3.3 Lokasi/Ruang Lingkup Penelitian', input: { id: 'lokasiInput', label: 'Lokasi/Ruang Lingkup (Contoh: Kecamatan Randuagung)' } },
                { title: '3.4 Metode Pengumpulan Data', input: { id: 'teknikInput', label: 'Metode Pengumpulan Data (Contoh: Wawancara dan Studi Pustaka)' } },
                { title: '3.5 Model Analisis Data', input: { id: 'analisisInput', label: 'Model Analisis Data (Contoh: Kualitatif Deskriptif)' } }
            ]
        },
        'bab4': {
            title: 'BAB IV: PEMBAHASAN',
            isCustom: false,
            subChapters: [
                { title: 'Pembahasan Rumusan Masalah Pertama' },
                { title: 'Pembahasan Rumusan Masalah Kedua' }
            ]
        }
    };

    const toggleMenu = () => {
        sidebar.classList.toggle('-translate-x-full');
        sidebar.classList.toggle('translate-x-0');
        sidebarOverlay.classList.toggle('hidden');
        menuOpenIcon.classList.toggle('hidden');
        menuCloseIcon.classList.toggle('hidden');
    };

    const renderSubChapterOptions = (chapterId, container, customSubChapters = null) => {
        container.innerHTML = '';
        const chapterConfig = chaptersData[chapterId];
        if (!chapterConfig) return;

        const subChaptersSource = customSubChapters || chapterConfig.subChapters;
        if (!subChaptersSource) {
            container.innerHTML = `<p class="text-muted">Daftar pilihan sub-bab akan muncul di sini.</p>`;
            return;
        };

        const optionsHtml = subChaptersSource.map((sub, index) => {
            const subTitle = typeof sub === 'string' ? sub : sub.title;
            const sanitizedId = `${chapterId}-sub-${index}`;
            const detailInputHtml = (typeof sub === 'object' && sub.input)
                ? `<div id="detail-for-${sanitizedId}" class="hidden mt-2 ml-7">
                     <label for="${sub.input.id}" class="form-label text-sm">${sub.input.label}</label>
                     <textarea id="${sub.input.id}" rows="2" class="form-input text-sm"></textarea>
                   </div>`
                : '';

            return `
                <div class="sub-chapter-option-wrapper mb-2">
                    <div class="flex items-center">
                        <input type="radio" id="${sanitizedId}" name="subchapter-${chapterId}" value="${subTitle}" class="h-4 w-4 text-primary focus:ring-primary border-gray-300">
                        <label for="${sanitizedId}" class="ml-3 block text-sm font-medium text-light">${subTitle}</label>
                    </div>
                    ${detailInputHtml}
                </div>`;
        }).join('');

        container.innerHTML = `
            <div class="space-y-4">
                <label class="form-label">Pilih sub-bab yang ingin dibuat:</label>
                <div id="radio-group-${chapterId}">${optionsHtml}</div>
            </div>
            <button class="generate-button mt-6" data-chapter="${chapterId}" disabled>
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" class="w-5 h-5 button-icon"><path d="M10.868 2.884c.321.077.635.148.942.22a.75.75 0 01.706.853l-.612 3.06a.75.75 0 00.298.635l2.525 2.148a.75.75 0 01-.247 1.293l-3.374.692a.75.75 0 00-.573.433l-1.42 3.108a.75.75 0 01-1.33.001l-1.42-3.108a.75.75 0 00-.573-.433l-3.374-.692a.75.75 0 01-.247-1.293l2.525-2.148a.75.75 0 00.298-.635l-.612-3.06a.75.75 0 01.706-.853c.307-.072.62-.143.942-.22z"/></svg>
                <span class="button-text">Bangun Draf Sub-Bab</span>
            </button>`;

        const formSection = document.getElementById(`form-${chapterId}`);
        const newGenerateButton = formSection.querySelector('.generate-button');
        const radioGroup = formSection.querySelector(`#radio-group-${chapterId}`);

        radioGroup.addEventListener('change', (e) => {
            if (e.target.type === 'radio') {
                newGenerateButton.disabled = false;
                formSection.querySelectorAll('[id^="detail-for-"]').forEach(div => div.classList.add('hidden'));
                const subConfig = subChaptersSource.find(s => (typeof s === 'string' ? s : s.title) === e.target.value);
                if (subConfig && typeof subConfig === 'object' && subConfig.input) {
                    const detailDiv = formSection.querySelector(`#detail-for-${e.target.id}`);
                    if (detailDiv) detailDiv.classList.remove('hidden');
                }
            }
        });

        newGenerateButton.addEventListener('click', () => {
            const selectedRadio = formSection.querySelector(`input[name="subchapter-${chapterId}"]:checked`);
            if (selectedRadio) {
                let detailValue = '';
                const subConfig = subChaptersSource.find(s => (typeof s === 'string' ? s : s.title) === selectedRadio.value);
                if (subConfig && typeof subConfig === 'object' && subConfig.input) {
                    const detailInput = formSection.querySelector(`#${subConfig.input.id}`);
                    if (detailInput) detailValue = detailInput.value;
                }
                generateSubChapter(selectedRadio, detailValue, newGenerateButton);
            }
        });
    };
    
    // Sisa kode di bawah ini tidak berubah...
    const switchView = (targetId) => { /* ... */ };
    const updateDesktopPreview = () => { /* ... */ };
    async function generateSubChapter(radioElement, detail, button) { /* ... */ };
    // Event listeners
    mobileMenuButton.addEventListener('click', toggleMenu);
    sidebarOverlay.addEventListener('click', toggleMenu);
    navLinks.forEach(link => { link.addEventListener('click', (e) => { e.preventDefault(); switchView(e.currentTarget.dataset.target); }); });
    copyAllBtn.addEventListener('click', () => { /* ... */ });
    clearAllBtn.addEventListener('click', () => { /* ... */ });
    const loadBab2Button = document.getElementById('load-bab2-button');
    if (loadBab2Button) { loadBab2Button.addEventListener('click', () => { /* ... */ }); }
    // INSIALISASI
    switchView('form-home');
    updateDesktopPreview();
});
