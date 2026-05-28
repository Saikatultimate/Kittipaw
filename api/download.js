// This runs as a Serverless Function on Vercel
export default async function handler(req, res) {
    // 1. Security: Only allow POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method Not Allowed' });
    }

    const { url, mode } = req.body;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 2. Call the public API from the SERVER (no CORS issues here)
        // We use the official Cobalt API
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
            },
            body: JSON.stringify(requestBody)
        });

        const data = await response.json();

        // 3. Handle API Response
        if (data.status === 'error') {
            return res.status(400).json({ error: data.error.code || 'API Error' });
        }

        if (data.status === 'redirect' || data.status === 'stream') {
            return res.status(200).json({ 
                success: true, 
                url: data.url, 
                filename: generateFilename(url, mode) 
            });
        }

        return res.status(400).json({ error: 'Unknown API response' });

    } catch (error) {
        console.error(error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
}

function generateFilename(url, mode) {
    try {
        const path = new URL(url).pathname.split('/').pop();
        if(path && path.length > 3) return path;
        return `kittipaw_${mode === 'audio' ? 'audio' : 'video'}`;
    } catch {
        return 'kittipaw_download';
    }
    }
