// api/download.js
export default async function handler(req, res) {
    // 1. Security Headers (Allow your frontend to talk to this backend)
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    // 2. Handle Browser "Pre-flight" Check
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // 3. Only allow POST
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    try {
        // 4. CRITICAL FIX: Manually parse the body chunks
        // Vercel functions sometimes stream the body, so we need to await it fully.
        const buffers = [];
        for await (const chunk of req) {
            buffers.push(chunk);
        }
        const data = Buffer.concat(buffers).toString();
        
        // If body is empty, throw error
        if (!data) {
            return res.status(400).json({ error: 'No data received' });
        }

        const body = JSON.parse(data);
        const { url, mode } = body;

        if (!url) {
            return res.status(400).json({ error: 'URL is required' });
        }

        // 5. Call the Cobalt API
        const apiUrl = 'https://api.cobalt.tools/api/json';
        
        const requestBody = {
            url: url,
            vCodec: "h264",
            vQuality: "1080",
            aFormat: "mp3",
            isAudioOnly: mode === 'audio',
            isAudioMuted: mode === 'mute'
        };

        const response = await fetch(apiUrl, {
            method: 'POST',
            headers: {
                'Accept': 'application/json',
                'Content-Type': 'application/json',
                'User-Agent': 'Kittipaw/1.0' // Good practice
            },
            body: JSON.stringify(requestBody)
        });

        const apiData = await response.json();

        // 6. Handle API Response
        if (apiData.status === 'error') {
            // Pass the real error from the API to your frontend
            return res.status(400).json({ error: apiData.error.code || 'Processing Error' });
        }

        if (apiData.status === 'redirect' || apiData.status === 'stream') {
            return res.status(200).json({ 
                success: true, 
                url: apiData.url, 
                filename: `kittipaw_${mode || 'video'}` 
            });
        }

        return res.status(400).json({ error: 'Unknown API response' });

    } catch (error) {
        console.error("Server Error:", error);
        // Send back a real error message so the frontend can show it
        return res.status(500).json({ error: 'Internal Server Error: ' + error.message });
    }
}
