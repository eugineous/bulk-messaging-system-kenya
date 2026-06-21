// Urban Bulk SMS — Swahili → English translation (Vercel serverless function)
// =============================================================================
// The app POSTs { texts: [...] } here; we return { translations: [...] }.
//
// SECURITY: the NVIDIA key is read ONLY from the NVIDIA_API_KEY environment
// variable. It is NEVER written in this file or shipped to the browser.
// Set it in Vercel -> Project -> Settings -> Environment Variables.
// =============================================================================

module.exports = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ error: 'Use POST' });
    return;
  }

  const key = process.env.NVIDIA_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'NVIDIA_API_KEY is not set in environment variables' });
    return;
  }

  let texts = [];
  try {
    const body = typeof req.body === 'string' ? JSON.parse(req.body) : (req.body || {});
    texts = Array.isArray(body.texts) ? body.texts : [];
  } catch (e) {
    res.status(400).json({ error: 'Invalid JSON body' });
    return;
  }

  if (texts.length === 0) {
    res.status(200).json({ translations: [] });
    return;
  }

  const prompt =
    'Translate each numbered line from Kenyan Swahili / Sheng into natural English. ' +
    'Reply with ONLY the numbered lines, English text after each number, nothing else.\n\n' +
    texts.map((t, i) => `${i + 1}. ${t}`).join('\n');

  try {
    const r = await fetch('https://integrate.api.nvidia.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'meta/llama-3.1-8b-instruct',
        messages: [
          { role: 'system', content: 'You are a precise Swahili-to-English translator for SMS replies.' },
          { role: 'user', content: prompt },
        ],
        temperature: 0.2,
        max_tokens: 1024,
      }),
    });

    if (!r.ok) {
      const detail = await r.text();
      res.status(502).json({ error: 'NVIDIA API error', detail });
      return;
    }

    const j = await r.json();
    const content =
      (j.choices && j.choices[0] && j.choices[0].message && j.choices[0].message.content) || '';

    const translations = content
      .split('\n')
      .map((l) => l.replace(/^\s*\d+[.)]\s*/, '').trim())
      .filter((l) => l.length > 0);

    res.status(200).json({ translations });
  } catch (e) {
    res.status(500).json({ error: 'Translation request failed', detail: String(e) });
  }
};
