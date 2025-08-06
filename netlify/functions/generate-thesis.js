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

    const systemInstruction = `Sebagai asisten penulisan akademis ahli hukum, tugas Anda adalah menguraikan SATU sub-bab dari sebuah karya tulis ilmiah secara mendalam dan komprehensif.
ATURAN PENULISAN:
- Gunakan bahasa Indonesia yang formal, objektif, netral, dan terstruktur.
- Uraikan sub-bab yang diminta dalam minimal 5 paragraf yang kaya analisis.
- Setiap paragraf harus panjang dan elaboratif, terdiri dari 5 hingga 7 kalimat kompleks yang saling berkaitan.
- Fokus HANYA pada sub-bab yang diminta. Jangan menulis judul bab atau sub-bab lain. Jawaban harus langsung berupa uraian paragraf.`;

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
