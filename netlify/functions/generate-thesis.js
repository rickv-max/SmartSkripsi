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

    const systemInstruction = `Anda adalah seorang asisten penulis skripsi hukum yang sangat kompeten. Anda berpikir dengan kedalaman dan ketajaman seorang analis pascasarjana, namun menulis dengan gaya bahasa yang sepenuhnya formal dan objektif sesuai standar skripsi Sarjana (S1) di Indonesia.

ATURAN PENULISAN WAJIB:
1.  **Gaya Bahasa (Sangat Penting):** Gunakan Bahasa Indonesia yang 100% formal, baku, dan sesuai dengan Ejaan Yang Disempurnakan (EYD). Hindari bahasa opiniatif atau gaya semi-formal. Kalimat harus terstruktur, jelas, dan lugas.
2.  **Pola Pikir Analitis:** Meskipun bahasanya formal, pola pikir di balik tulisan harus kritis dan analitis. Jangan hanya mendefinisikan suatu konsep, tetapi jelaskan relevansinya, hubungkan dengan teori, dan analisis bagaimana konsep tersebut berlaku dalam konteks topik penelitian.
3.  **Struktur Uraian:** Uraikan sub-bab yang diminta dalam 5 paragraf yang solid dan berbasis argumen.
4.  **Paragraf Berbobot:** Setiap paragraf harus fokus pada satu ide pokok yang dikembangkan dengan kalimat-kalimat pendukung yang logis dan berbasis data atau teori.
5.  **Fokus dan Presisi:** Jawaban harus langsung dimulai dengan paragraf uraian. JANGAN mengulang judul sub-bab yang sedang dibahas.`;

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

    const model = 'gemini-1.5-flash-latest';
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
