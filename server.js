const express = require('express');
const fetch = require('node-fetch');
const app = express();
const PORT = process.env.PORT || 3000;

// Daftar instance Invidious publik sebagai fallback
const INVIDIOUS_INSTANCES = [
  'https://invidious.privacyredirect.com',
  'https://inv.nadeko.net',
  'https://yt.artemislena.eu',
  'https://invidious.perryc.co'
];

async function fetchInvidious(endpoint) {
  for (const instance of INVIDIOUS_INSTANCES) {
    try {
      const res = await fetch(`${instance}/api/v1${endpoint}`, { timeout: 5000 });
      if (res.ok) {
        return await res.json();
      }
    } catch (err) {
      console.log(`Gagal pada instance ${instance}:`, err.message);
    }
  }
  throw new Error('Semua instance Invidious sedang tidak tersedia');
}

app.use(express.urlencoded({ extended: true }));
app.use(express.static('public'));

// Endpoint Pencarian
app.get('/api/search', async (req, res) => {
  const query = req.query.q || 'trending';
  try {
    const data = await fetchInvidious(`/search?q=${encodeURIComponent(query)}`);
    const videos = data.map(item => ({
      videoId: item.videoId,
      title: item.title,
      author: item.author,
      thumbnail: item.videoThumbnails ? item.videoThumbnails[0].url : ''
    }));
    res.json(videos);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Endpoint Detail & Format Video
app.get('/api/video/:id', async (req, res) => {
  const videoId = req.params.id;
  try {
    const data = await fetchInvidious(`/videos/${videoId}`);
    const formats = (data.formatStreams || []).map(f => ({
      quality: f.qualityLabel || 'SD',
      url: f.url
    }));
    res.json({
      title: data.title,
      author: data.author,
      formats: formats
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// Untuk Vercel serverless
module.exports = app;

// Untuk dijalankan secara lokal
if (require.main === module) {
  app.listen(PORT, () => {
    console.log(`YourTube berjalan di port ${PORT}`);
  });
}
