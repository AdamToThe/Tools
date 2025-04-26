/**
      This script finds the source or the origin everytime an audio is played on a webpage.
      Helps me download music from [untitled]
**/
(() => {
    console.log("%c[Audio Sniffer] Initialized", "color: green; font-weight: bold;");

    let detectedAudio = null; // To track detected audio URLs
    const downloadedAudio = new Set(); // To track downloaded URLs
    const logAudioUrl = (url) => {
        if (detectedAudio !== url && url) {
            detectedAudio = url;
            console.log("%c[Audio Detected]:", "color: blue; font-weight: bold;", url);
        }
    };
  
    const downloadAudio = async (url, title) => {
        if (!url) return;

        // THIS WAS FOR [untitled] 
        if (!url.startsWith("https://tyymaqwprqsupipyalpj.supabase.co")) {
            console.warn("%c[Warning]:", "color: orange; font-weight: bold;", "URL is not from Supabase, skipping download.");
            return;
        }

        if (downloadedAudio.has(url)) {
            console.log("%c[Info]:", "color: orange;", "Audio has already been downloaded. Skipping...");
            return;
        }

        downloadedAudio.add(url);
        console.log("%c[Downloading]:", title,  "color: blue; font-weight: bold;", url);

        try {
            const response = await fetch(url);
            if (!response.ok) {
                throw new Error(`Failed to fetch audio: ${response.statusText}`);
            }

            const blob = await response.blob();
            const objectURL = URL.createObjectURL(blob);

            const downloadLink = document.createElement("a");
            downloadLink.href = objectURL;
            downloadLink.download = `${title || 'audio'}.mp3`;  // Default to 'audio' if no title is found
            document.body.appendChild(downloadLink);
            downloadLink.click();
            document.body.removeChild(downloadLink);

            // Release the object URL to free up resources
            URL.revokeObjectURL(objectURL);

            console.log("%c[Download Complete]:", "color: green; font-weight: bold;", title);
        } catch (error) {
            console.error("%c[Download Error]:", "color: red; font-weight: bold;", error);
        }
    };

    const detectAudioUrl = (url) => {
        if (!url) return;

        const audioRegex = /(audio|music|sound|stream).*?\.(mp3|ogg|wav|aac|m4a|flac|opus|m3u8|mp4|webm|ts)($|\?|&)/i;
        const directFileRegex = /\.(mp3|ogg|wav|aac|m4a|flac|opus|m3u8|mp4|webm|ts)($|\?|&)/i;

        if ((audioRegex.test(url) || directFileRegex.test(url)) && url.startsWith("https://tyymaqwprqsupipyalpj.supabase.co")) {
            logAudioUrl(url);
        }
    };


    const originalOpen = XMLHttpRequest.prototype.open;
    XMLHttpRequest.prototype.open = function (method, url) {
        detectAudioUrl(url);
        return originalOpen.apply(this, arguments);
    };


    const originalFetch = window.fetch;
    window.fetch = function (url, options) {
        if (typeof url === "string") {
            detectAudioUrl(url);
        } else if (url instanceof Request) {
            detectAudioUrl(url.url);
        }
        return originalFetch.apply(this, arguments);
    };

    // Monitor and log any changes to media elements sources (e.g., via Media Capture API)
    const originalSetAttribute = HTMLMediaElement.prototype.setAttribute;
    HTMLMediaElement.prototype.setAttribute = function (attr, value) {
        if (attr === "src" && value.startsWith("https://tyymaqwprqsupipyalpj.supabase.co")) {
            logAudioUrl(value); 
        }
        return originalSetAttribute.apply(this, arguments);
    };


    const addClickListeners = () => {
        document.querySelectorAll('button[role="button"]').forEach((button) => {
            button.addEventListener('click', async () => {
                const title = button.querySelector('h3')?.textContent.trim();
                if (!title) {
                    console.error("%c[Error]:", "color: red; font-weight: bold;", "Song title not found.");
                    return;
                }

               
                await new Promise(resolve => {
                    const interval = setInterval(() => {
                        if (detectedAudio) {
                            clearInterval(interval); // Stop checking once the URL is found
                            resolve();
                        }
                    }, 500);
                });
              
		let audioUrl = detectedAudio;
                if (audioUrl) {
                    await downloadAudio(audioUrl, title);
		    detectedAudio = null;
                } else {
                    console.log("%c[Info]:", "color: orange;", "No valid audio URL found.");
                }
            });
        });
    };

    const setupObserver = () => {
        const observer = new MutationObserver(() => {
            addClickListeners();
        });

        observer.observe(document.body, { childList: true, subtree: true });
    };

    addClickListeners();
    setupObserver();


    document.querySelectorAll('audio, source').forEach(audio => {
        logAudioUrl(audio.src);
    });

    console.log("%c[Audio Sniffer] Ready for action!", "color: green; font-weight: bold;");
})();
