// netlify/functions/generate-thesis.js (VERSI FINAL - FULL - Claude Haiku 3.5 via OpenRouter)

const fetch = require('node-fetch');

exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
  if (!OPENROUTER_API_KEY) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'OPENROUTER_API_KEY tidak ditemukan.' }),
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

    // ==== RANGKAI PROMPT ====
    let prompt = `Sebagai asisten penulisan akademis, tugas Anda adalah membantu menyusun draf untuk sebuah karya tulis ilmiah di bidang hukum.
Hasil tulisan harus objektif, netral, dan fokus pada analisis teoretis. Gunakan bahasa Indonesia yang formal dan terstruktur.
Tujuan utamanya adalah menghasilkan draf yang komprehensif dan mendalam, di mana setiap sub-bab diuraikan dalam lima paragraf yang kaya analisis.

Informasi dasar untuk draf ini adalah sebagai berikut:
- Topik Penelitian: "${topic}"
- Rumusan Masalah: "${problem}"

`;

    if (chapter === 'bab1') {
      prompt += `Struktur BAB I - PENDAHULUAN:
1.1 Latar belakang
1.2 Rumusan masalah
1.3 Tujuan penelitian
1.4 Kontribusi penelitian
1.5 Orisinalitas penelitian (buat dalam bentuk tabel dengan pembeda dari karya sebelumnya)`;
    } else if (chapter === 'bab2') {
      prompt += `Struktur BAB II - TINJAUAN PUSTAKA:
2.1 Tinjauan Umum
2.2 Tinjauan Teori (relevan dengan topik)
2.3 Penelitian Terdahulu (minimal 3 dengan penjelasan poin per poin)`;
    } else if (chapter === 'bab3') {
      const pendekatan = details?.pendekatan || '';
      const jenis = details?.jenis || '';
      const lokasi = details?.lokasi || '';
      const metodePengumpulanData = details?.metodePengumpulanData || '';
      const modelAnalisis = details?.modelAnalisis || '';

      prompt += `Struktur BAB III - METODOLOGI PENELITIAN:
Tuliskan secara mendalam dan terstruktur:
3.1 Pendekatan Penelitian: ${pendekatan}
3.2 Jenis Penelitian: ${jenis}
3.3 Lokasi Penelitian: ${lokasi}
3.4 Metode Pengumpulan Data: ${metodePengumpulanData}
3.5 Model Analisis Data: ${modelAnalisis}`;
    } else if (chapter === 'bab4') {
      prompt += `Struktur BAB IV - HASIL PENELITIAN DAN PEMBAHASAN:
Gunakan pola sistematis untuk membahas hasil penelitian secara kritis dan menyeluruh.
Analisis harus terikat dengan teori dan rumusan masalah.
Buat struktur penulisan yang logis, tidak bersifat naratif umum.`;
    } else {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'Bab tidak dikenali.' }),
      };
    }

    // ==== KONSTRUKSI REQUEST KE CLAUDE ====
    const requestBody = {
      model: "anthropic/claude-3-haiku",
      messages: [
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.7,
      max_tokens: 4096
    };

    const apiURL = "https://openrouter.ai/api/v1/chat/completions";
    let retries = 3;
    let responseData;

    while (retries > 0) {
      const apiResponse = await fetch(apiURL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://yourdomain.netlify.app/',
          'X-Title': 'ThesisArchitect'
        },
        body: JSON.stringify(requestBody)
      });

      responseData = await apiResponse.json();

      if (!responseData.error || responseData.error.code !== 503) break;

      console.warn('Model overloaded, mencoba ulang...');
      await new Promise(res => setTimeout(res, 2000));
      retries--;
    }

    if (responseData.error) {
      throw new Error(`Claude gagal: ${responseData.error.message}`);
    }

    const resultText = responseData.choices?.[0]?.message?.content;

    return {
      statusCode: 200,
      body: JSON.stringify({ text: resultText || '(kosong)' })
    };

  } catch (error) {
    console.error('Terjadi error:', error.message);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: error.message }),
    };
  }
};
