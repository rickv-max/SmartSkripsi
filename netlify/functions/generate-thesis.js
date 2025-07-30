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
    // PROMPT DASAR
let prompt = `Sebagai asisten penulisan akademis, tugas Anda adalah membantu menyusun draf untuk sebuah karya tulis ilmiah di bidang hukum.
Hasil tulisan harus objektif, netral, dan fokus pada analisis teoretis. Gunakan bahasa Indonesia yang formal dan terstruktur.
Tujuan utamanya adalah menghasilkan draf yang komprehensif dan mendalam, di mana setiap sub-bab diuraikan dalam beberapa paragraf yang kaya analisis.

Informasi dasar untuk draf ini adalah sebagai berikut:
- Topik Penelitian: "${topic}"
- Rumusan Masalah: "${problem}"\n\n`;

switch (chapter) {
  case 'bab1':
    prompt += `Struktur BAB I - PENDAHULUAN:
1.1 Latar belakang
1.2 Rumusan masalah
1.3 Tujuan penelitian
1.4 Kontribusi penelitian
1.5 Orisinalitas (buat dalam bentuk tabel)
Pastikan setiap sub-bab memiliki minimal 5 paragraf yang mendalam dan relevan.
Setiap paragraf harus panjang, tidak boleh ringkas, dan berisi uraian analitis yang mendalam.
Gunakan kalimat kompleks dan elaboratif, hindari pernyataan singkat atau satu kalimat saja dalam satu paragraf.
Paragraf harus terdiri dari minimal 5–7 kalimat lengkap yang saling berkaitan secara logis.`;
    break;

  case 'bab2':
    prompt += `Struktur BAB II - TINJAUAN PUSTAKA:
2.1 Tinjauan umum tentang topik yang diangkat
2.2 Teori-teori relevan yang menjadi landasan kajian
2.3 Penelitian terdahulu yang relevan (minimal 3 referensi)
Setiap sub-bab harus dijelaskan secara sistematis dan panjang (minimal 5 paragraf per sub-bab). Kaitkan dengan topik dan rumusan masalah "${problem}".
Setiap paragraf harus panjang, tidak boleh ringkas, dan berisi uraian analitis yang mendalam.
Gunakan kalimat kompleks dan elaboratif, hindari pernyataan singkat atau satu kalimat saja dalam satu paragraf.
Paragraf harus terdiri dari minimal 5–7 kalimat lengkap yang saling berkaitan secara logis.`;
    break;

  case 'bab3':
    prompt += `Struktur BAB III - METODE PENELITIAN:
Berikan pengantar pentingnya metodologi dalam penelitian hukum, lalu uraikan secara sangat mendalam setiap sub-bab berikut. Masing-masing sub-bab wajib memiliki minimal 5 paragraf terstruktur dan fokus:

3.1 Pendekatan Penelitian:
- Uraikan pengertian pendekatan, jenis-jenis (yuridis normatif, empiris, socio-legal), dan berikan justifikasi logis berdasarkan topik "${topic}" serta masalah "${problem}". ${details.pendekatan ? `Gunakan pendekatan "${details.pendekatan}".` : ''}

3.2 Jenis Penelitian:
- Bahas jenis penelitian hukum seperti deskriptif, preskriptif, atau eksploratif. Berikan alasan akademik mengapa jenis tersebut tepat untuk digunakan. ${details.jenis ? `Prioritaskan jenis "${details.jenis}".` : ''}

3.3 Lokasi atau Ruang Lingkup Penelitian:
- Jelaskan secara rinci batasan atau lokasi penelitian. Jika kepustakaan, bahas lingkup sumber hukum yang dikaji (UU, yurisprudensi, literatur akademik). ${details.lokasi ? `Lokasi yang disarankan: "${details.lokasi}".` : ''}

3.4 Teknik Pengumpulan Data:
- Uraikan metode seperti studi pustaka, wawancara, observasi hukum, dan jelaskan secara teknis cara pelaksanaannya. ${details.metodePengumpulanData ? `Gunakan metode "${details.metodePengumpulanData}".` : ''}

3.5 Teknik Analisis Data:
- Bahas tahapan analisis hukum, mulai dari reduksi data, penyajian, hingga penarikan kesimpulan. Tautkan langsung dengan rumusan masalah "${problem}". ${details.modelAnalisis ? `Gunakan teknik "${details.modelAnalisis}".` : ''}
Setiap paragraf harus panjang, tidak boleh ringkas, dan berisi uraian analitis yang mendalam.
Gunakan kalimat kompleks dan elaboratif, hindari pernyataan singkat atau satu kalimat saja dalam satu paragraf.
Paragraf harus terdiri dari minimal 5–7 kalimat lengkap yang saling berkaitan secara logis.`;
    break;

  case 'bab4':
    prompt += `Struktur BAB IV - HASIL PENELITIAN DAN PEMBAHASAN:
- Buat struktur sistematis sesuai rumusan masalah.
- Bahas hasil analisis dengan mengaitkan teori dan data.
- Setiap bagian harus mengandung minimal 5 paragraf dengan argumen hukum yang mendalam dan kritis.
- Berikan kesimpulan sementara di akhir tiap bagian.
Setiap paragraf harus panjang, tidak boleh ringkas, dan berisi uraian analitis yang mendalam.
Gunakan kalimat kompleks dan elaboratif, hindari pernyataan singkat atau satu kalimat saja dalam satu paragraf.
Paragraf harus terdiri dari minimal 5–7 kalimat lengkap yang saling berkaitan secara logis.`;
    break;
  default:
        throw new Error('Chapter tidak valid');
    }
    
    // ==== KONSTRUKSI REQUEST KE CLAUDE ====
    const requestBody = {
  model: "anthropic/claude-3-haiku",
  messages: [
    {
      role: "user",
      content: `Instruksi: Tulis dengan gaya akademik hukum, setiap sub-bab minimal 5 paragraf penuh. Jangan merangkum. Jawaban harus panjang, rinci, dan fokus pada topik berikut.\n\n${prompt}`
    }
  ],
  temperature: 0.7,
  max_tokens: 8000, // maksimal Claude Haiku
  top_p: 0.9,
  stop_sequences: []
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
