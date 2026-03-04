export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text || typeof text !== 'string' || text.trim().length === 0) {
    return res.status(400).json({ error: 'No text provided.' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured.' });
  }

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-haiku-4-5',
        max_tokens: 256,
        system: `You translate corporate language into plain English. Cut through jargon, buzzwords, and inflated framing to describe what a company or product actually is or does — as concretely and simply as possible. Rules: the input may be a single tagline or several paragraphs — handle either the same way. Output is always one to two short sentences, regardless of input length. Use everyday words. If the input is a press release or funding announcement, ignore the funding news and focus only on what the company does. Dry, understated wit is welcome; mean-spirited mockery is not. Examples — Input: "Aux Labs, a pioneer in animal-free proteins, today announced..." Output: "We make real cheese. No cows involved." Input: "Zeno, the electric-mobility and distributed energy services company, today announced it has raised $25 million..." Output: "Affordable motorcycles that can also power your home."`,
        messages: [
          { role: 'user', content: text.trim() }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Anthropic API error:', data);
      return res.status(502).json({ error: 'Translation service error. Please try again.' });
    }

    const translation = data.content?.[0]?.text ?? '';
    return res.status(200).json({ translation });

  } catch (err) {
    console.error('Handler error:', err);
    return res.status(500).json({ error: 'Something went wrong. Please try again.' });
  }
}