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
    let prompt = `Anda adalah asisten penulisan akademik di bidang hukum. Tugas Anda adalah menyusun draf skripsi yang komprehensif dan berbobot secara ilmiah berdasarkan struktur bab yang diberikan.

Gunakan Bahasa Indonesia akademik yang formal, objektif, dan sistematis. Jangan merangkum — melainkan kembangkan setiap poin menjadi **minimal 5 paragraf per sub-bab**. Paragraf harus kaya analisis hukum, berlandaskan teori dan metode hukum yang berlaku di Indonesia.

Berikan penjelasan yang menyeluruh, seolah-olah pembaca tidak mengetahui apa-apa tentang topik tersebut. 

Gunakan data berikut sebagai dasar penulisan:
- **Topik Penelitian:** "${topic}"
- **Rumusan Masalah:** "${problem}"
- **Preferensi Tambahan dari Pengguna:** ${JSON.stringify(details)}

Struktur bab yang harus dikembangkan:`;

     if (chapter === 'bab1') {
    prompt = `
Kamu adalah seorang pakar hukum dan akademisi yang sangat berpengalaman. Tugasmu adalah menulis Bab I Pendahuluan dari skripsi hukum berdasarkan input berikut:
Topik: ${topic}
Rumusan Masalah: ${problem}
Tulis setiap sub-bab berikut secara mendalam, dengan masing-masing sub-bab terdiri dari minimal 5 paragraf analitis. Gunakan gaya bahasa akademik hukum yang sistematis dan mengedepankan logika. Penulisan harus menggambarkan urgensi, konteks, dan konstruksi ilmiah dari penelitian.
1.1 Latar Belakang: Uraikan situasi hukum saat ini terkait topik, masalah yang muncul, dampaknya, serta mengapa isu ini penting untuk dikaji.
1.2 Rumusan Masalah: Jelaskan rumusan masalah secara filosofis, yuridis, dan sosiologis, serta jelaskan cara pertanyaan ini akan dijawab.
1.3 Tujuan Penelitian: Uraikan tujuan penelitian dari sisi teoritis dan praktis, serta bagaimana penelitian ini akan memberikan kontribusi terhadap pengembangan hukum.
1.4 Kontribusi Penelitian: Jelaskan kontribusi akademik, kebijakan, atau solusi praktis yang ditawarkan dari hasil penelitian.
1.5 Orisinalitas Penelitian: Buat dalam bentuk tabel yang menampilkan 3–5 penelitian terdahulu, penulisnya, fokusnya, dan bedanya dengan penelitian ini.
`;
  } else if (chapter === 'bab2') {
    prompt = `
Tulis Bab II Tinjauan Pustaka untuk skripsi hukum berdasarkan topik berikut:
Topik: ${topic}
Tuliskan seluruh bagian dengan pendekatan sistematis. Setiap sub-bab minimal terdiri dari 5 paragraf yang menjelaskan kerangka konseptual dan posisi teoritis yang relevan dengan topik. Hindari penjabaran ringkas. 
2.1 Tinjauan Umum: Bahas perkembangan hukum terkait topik dari sisi historis, regulasi nasional dan internasional.
2.2 Tinjauan Teori: Paparkan teori-teori hukum yang relevan (misalnya teori keadilan, utilitarianisme, hukum progresif), lengkap dengan pendapat ahli dan relevansinya dengan penelitian.
2.3 Penelitian Terdahulu: Ulas setidaknya 3 penelitian ilmiah (tesis, jurnal, atau disertasi) secara kritis dan bandingkan pendekatannya dengan penelitian ini.
`;
  } else if (chapter === 'bab3') {
    prompt = `
Tulis Bab III Metodologi Penelitian untuk skripsi hukum dengan topik:
Topik: ${topic}
Sertakan pengantar yang menjelaskan peran penting metode dalam karya ilmiah hukum, dan penutup yang menyimpulkan kenapa pendekatan metodologis ini paling tepat untuk menjawab rumusan masalah.
Tulis setiap sub-bab berikut dalam minimal 5 paragraf:
3.1 Pendekatan Penelitian: Jelaskan pendekatan normatif, empiris, atau kombinasi, dan alasan pemilihannya.
3.2 Jenis Penelitian: Uraikan apakah termasuk penelitian deskriptif, eksplanatoris, atau lainnya, dengan contoh konkret.
3.3 Lokasi Penelitian: Jelaskan alasan pemilihan lokasi dan relevansinya terhadap data dan objek hukum yang dikaji.
3.4 Metode Pengumpulan Data: Jelaskan metode seperti studi dokumen, wawancara, atau observasi, dan validitasnya.
3.5 Model Analisis Data: Jelaskan model analisis (misal: kualitatif, yuridis-normatif) yang digunakan untuk mengolah data agar sampai pada kesimpulan.
`;
  } else if (chapter === 'bab4') {
    prompt = `
Tulis Bab IV Hasil Penelitian dan Pembahasan berdasarkan topik dan rumusan masalah berikut:
Topik: ${topic}
Rumusan Masalah: ${problem}
Strukturkan isi bab ini agar mampu menjawab setiap rumusan masalah dengan analisis yuridis yang mendalam. Gunakan pendekatan normatif dan empiris bila tersedia. 
Setiap bagian pembahasan wajib disajikan dalam minimal 5 paragraf. Gunakan referensi hukum (UU, yurisprudensi, teori) secara eksplisit. Akhiri dengan penilaian kritis dan sintesis akademik terhadap hasil.
Jika pengguna belum menyelesaikan penelitiannya, simulasikan pembahasan berdasarkan data atau argumen hukum yang rasional.
`;
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
