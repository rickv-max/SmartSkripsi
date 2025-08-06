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
    const { topic, problem, chapter, details } = JSON.parse(event.body);

    if (!topic || !problem || !chapter) {
      return {
        statusCode: 400,
        body: JSON.stringify({
          error: 'Data tidak lengkap. Topik, rumusan masalah, dan bab dibutuhkan.',
        }),
      };
    }

    // ==== INSTRUKSI UTAMA YANG TELAH DISESUAIKAN ====
    const systemInstruction = `Sebagai asisten penulisan akademis ahli hukum, tugas Anda adalah menghasilkan draf karya tulis ilmiah yang komprehensif dan mendalam.
ATURAN PENULISAN:
- Gunakan bahasa Indonesia yang formal, objektif, netral, dan terstruktur.
- Fokus pada analisis teoretis.
- Setiap sub-bab yang diminta harus diuraikan dalam 2 hingga 3 paragraf yang sangat mendalam.
- Setiap paragraf WAJIB sangat panjang dan komprehensif, terdiri dari 7 hingga 10 kalimat yang detail dan saling terhubung secara logis.
- Jangan pernah merangkum atau memberikan jawaban singkat. Jawaban harus selalu panjang dan rinci.
- Jika diminta membuat tabel, buatlah dalam format Markdown.`;

    // Prompt spesifik tugas (tidak perlu diubah)
    let userPrompt = `Tuliskan draf untuk bagian di bawah ini.
- Topik Penelitian: "${topic}"
- Rumusan Masalah: "${problem}"\n\n`;

    switch (chapter) {
      case 'bab1':
        userPrompt += `BAGIAN YANG HARUS DITULIS: BAB I - PENDAHULUAN
Struktur yang harus diikuti:
1.1 Latar belakang
1.2 Rumusan masalah
1.3 Tujuan penelitian
1.4 Kontribusi penelitian
1.5 Orisinalitas (dalam bentuk tabel)`;
        break;

      case 'bab2':
        userPrompt += `BAGIAN YANG HARUS DITULIS: BAB II - TINJAUAN PUSTAKA
Struktur yang harus diikuti:
2.1 Tinjauan umum tentang topik
2.2 Teori-teori relevan sebagai landasan
2.3 Penelitian terdahulu yang relevan (minimal 3)`;
        break;

      case 'bab3':
        userPrompt += `BAGIAN YANG HARUS DITULIS: BAB III - METODE PENELITIAN
Berikan pengantar singkat tentang pentingnya metodologi, lalu uraikan sub-bab berikut:
3.1 Pendekatan Penelitian: ${details.pendekatan ? `Gunakan "${details.pendekatan}".` : ''} Jelaskan pengertian, jenis, dan justifikasi logisnya.
3.2 Jenis Penelitian: ${details.jenis ? `Prioritaskan "${details.jenis}".` : ''} Bahas dan berikan alasan akademis.
3..3 Lokasi/Ruang Lingkup Penelitian: ${details.lokasi ? `Fokus pada "${details.lokasi}".` : ''} Jelaskan batasannya.
3.4 Teknik Pengumpulan Data: ${details.metodePengumpulanData ? `Gunakan "${details.metodePengumpulanData}".` : ''} Uraikan secara teknis.
3.5 Teknik Analisis Data: ${details.modelAnalisis ? `Gunakan teknik "${details.modelAnalisis}".` : ''} Bahas tahapannya dan kaitkan dengan rumusan masalah.`;
        break;

      case 'bab4':
        userPrompt += `BAGIAN YANG HARUS DITULIS: BAB IV - HASIL PENELITIAN DAN PEMBAHASAN
Struktur:
- Buat struktur pembahasan yang sistematis sesuai rumusan masalah.
- Lakukan analisis mendalam dengan mengaitkan teori dan data.
- Berikan argumen hukum yang kritis.`;
        break;
      default:
        throw new Error('Chapter tidak valid');
    }
    
    const fullPrompt = `${systemInstruction}\n\n---\n\nTUGAS SPESIFIK:\n${userPrompt}`;

    const requestBody = {
      contents: [{
        parts: [{ text: fullPrompt }]
      }],
      generationConfig: {
        temperature: 0.7,
        topP: 0.9,
        maxOutputTokens: 8192,
      }
    };

    const model = 'gemini-1.5-flash-latest';
    const apiURL = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${GEMINI_API_KEY}`;
    
    console.log("🚀 Mengirim permintaan (2-3 paragraf panjang) ke Gemini...");

    const apiResponse = await fetch(apiURL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody)
    });

    const responseData = await apiResponse.json();

    if (responseData.error) {
      const errorDetails = JSON.stringify(responseData.error);
      console.error("🔥 Gemini API Error Response:", errorDetails);
      throw new Error(`Gemini AI gagal: ${errorDetails}`);
    }
    
    if (!responseData.candidates || responseData.candidates.length === 0) {
      const blockReason = responseData.promptFeedback?.blockReason || 'Tidak ada kandidat (kemungkinan diblokir)';
      console.error("🔥 Respons diblokir atau kosong dari Gemini:", JSON.stringify(responseData));
      throw new Error(`Gemini gagal: ${blockReason}`);
    }

    const resultText = responseData.candidates[0].content.parts[0].text;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: resultText || '(Respons berhasil namun teks kosong)' })
    };

  } catch (error) {
    console.error("🔥 Terjadi error fatal dalam handler:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
