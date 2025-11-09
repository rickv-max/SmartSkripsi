// fetch sudah tersedia secara global di lingkungan Netlify Functions

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'GEMINI_API_KEY tidak ditemukan.' }),
    };
  }

  try {
    // SEKARANG MENERIMA 'detail' OPSIONAL
    const { topic, problem, subChapterTitle, detail } = JSON.parse(event.body);

    if (!topic || !problem || !subChapterTitle) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Data tidak lengkap. Topik, rumusan masalah, dan judul sub-bab dibutuhkan.',
        }),
      };
    }

    const systemInstruction = `Anda adalah seorang ahli dan asisten pembimbing skripsi hukum yang sangat kompeten. Pola pikir Anda setajam analis pascasarjana, namun gaya penulisan Anda disesuaikan untuk menghasilkan draf skripsi Sarjana (S1) di Indonesia yang komprehensif, formal, dan berbobot.
    
ATURAN PENULISAN WAJIB YANG HARUS DIIKUTI TANPA PENGECUALIAN:
1.  **Gaya Bahasa (Sangat Penting):** Gunakan Bahasa Indonesia yang 100% formal, baku, dan sesuai dengan Ejaan Yang Disempurnakan (EYD). Hindari bahasa opiniatif, jargon tidak perlu, atau gaya semi-formal. Kalimat harus terstruktur dengan baik, jelas, dan lugas secara akademik.
2.  **Pola Pikir Analitis:** Jangan hanya mendefinisikan suatu konsep. Selalu jelaskan relevansinya, kaitkan dengan teori hukum yang relevan, analisis bagaimana konsep tersebut berlaku dalam konteks **topik penelitian**, dan bagaimana implikasinya terhadap **rumusan masalah yang diberikan**.
3.  **Struktur Uraian (Panjang dan Mendalam):** Uraikan sub-bab yang diminta dalam **sekitar 6-8 paragraf yang komprehensif dan mendalam**. Prioritaskan kedalaman analisis di setiap paragraf daripada hanya sekadar memenuhi jumlah.
4.  **Struktur Internal Paragraf (KUNCI UTAMA UNTUK HASIL PANJANG):** Setiap paragraf WAJIB dibangun mengikuti struktur empat bagian ini untuk memastikan kedalaman dan panjang yang memadai:
    *   **a. Kalimat Utama (Topic Sentence):** Mulai paragraf dengan satu kalimat yang jelas dan tegas sebagai ide pokok paragraf tersebut.
    *   **b. Elaborasi dan Kontekstualisasi (2-3 kalimat):** Kembangkan kalimat utama. Jelaskan apa maksudnya, berikan konteks, dan uraikan terminologi kunci.
    *   **c. Analisis Mendalam & Referensi (3-5 kalimat):** Ini adalah bagian inti. Sajikan argumen pendukung, analisis hubungan sebab-akibat, berikan contoh konkret, atau hubungkan ide pokok dengan pasal dalam peraturan, teori dari pakar, atau putusan pengadilan yang relevan. Ini adalah bagian yang membuat paragraf menjadi "panjang lebar".
    *   **d. Kalimat Penutup/Peralihan (1 kalimat):** Simpulkan ide pokok paragraf dan/atau ciptakan transisi yang mulus ke paragraf berikutnya.
5.  **Fokus dan Presisi:** Jawaban harus **langsung dimulai dengan paragraf uraian pertama**. JANGAN menulis pengantar, rangkuman, atau mengulang judul sub-bab yang sedang dibahas.
6.  **Kaidah Tambahan:**
    *   **Hindari Paragraf Dangkal:** Dilarang keras membuat paragraf yang hanya berisi 1-3 kalimat. Setiap paragraf harus memiliki bobot sesuai struktur pada Aturan #4.
    *   **Tidak Ada Kesimpulan Akhir:** Karena Anda hanya menulis satu bagian, jangan membuat paragraf kesimpulan untuk seluruh sub-bab di akhir jawaban Anda.
Pastikan output yang dihasilkan adalah sebuah tulisan akademik yang padat, kaya informasi, dan siap untuk dikembangkan lebih lanjut dalam sebuah draf skripsi.`;
    
    let userPrompt = `Berdasarkan informasi ini:
- Topik Penelitian Utama: "${topic}"
- Rumusan Masalah Utama: "${problem}"

Tolong tuliskan uraian lengkap untuk sub-bab berikut: "${subChapterTitle}"`;
    
    // TAMBAHKAN DETAIL JIKA ADA
    if (detail && detail.trim() !== '') {
        userPrompt += `\n\nPERHATIKAN INSTRUKSI TAMBAHAN BERIKUT: ${detail}`;
    }
    
    const fullPrompt = `${systemInstruction}\n\n---\n\nTUGAS SPESIFIK:\n${userPrompt}`;

    const requestBody = {
      contents: [{ parts: [{ text: fullPrompt }] }],
      generationConfig: { temperature: 0.7, topP: 0.9, maxOutputTokens: 8192 }
    };

    const model = 'gemini-2.5-flash-latest';
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log(`🚀 Mengirim permintaan untuk sub-bab: "${subChapterTitle}"`);
    
    const apiResponse = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const responseData = await apiResponse.json();

    if (responseData.error) throw new Error(`Gemini AI gagal: ${JSON.stringify(responseData.error)}`);
    if (!responseData.candidates || responseData.candidates.length === 0) {
      const blockReason = responseData.promptFeedback?.blockReason || 'Tidak ada kandidat (mungkin diblokir atau error sementara)';
      if (blockReason.includes('overloaded') || responseData.error?.status === 'UNAVAILABLE') {
         throw new Error("Server Gemini sedang sibuk. Coba lagi beberapa saat.");
      }
      throw new Error(`Gemini gagal: ${blockReason}`);
    }

    const generatedText = responseData.candidates[0].content.parts[0].text;
    const finalResult = `### ${subChapterTitle}\n\n${generatedText}`;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: finalResult || '(kosong)' })
    };

  } catch (error) {
    console.error("🔥 Terjadi error fatal:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
