import axios from 'axios';

const MAIL_TM_API = "https://api.mail.tm";
const NANA_BANANA_API = "https://nanabanana.ai";

interface CreateEmailResponse {
  email: string;
  password: string;
  token: string;
}

interface NanaBananaAccountResponse {
  email: string;
  password: string;
  sessionToken: string;
}

interface TaskStatusResponse {
  status: 'pending' | 'processing' | 'completed' | 'failed';
  resultUrl?: string;
  errorMessage?: string;
}

/**
 * Create a temporary email account using mail.tm API
 */
export async function createTemporaryEmail(): Promise<CreateEmailResponse> {
  try {
    const emailHeaders = {
      "Content-Type": "application/json",
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36"
    };

    // Get available domains
    const domainsResp = await axios.get(`${MAIL_TM_API}/domains`, { headers: emailHeaders });
    const domain = domainsResp.data["hydra:member"][0]?.domain;

    if (!domain) {
      throw new Error("No available domains found");
    }

    // Generate random username
    const username = Array.from({ length: 12 }, () =>
      "abcdefghijklmnopqrstuvwxyz1234567890"[Math.floor(Math.random() * 36)]
    ).join('');

    const email = `${username}@${domain}`;
    const password = `Pass${Math.floor(Math.random() * 9000) + 1000}!`;

    // Create account
    await axios.post(`${MAIL_TM_API}/accounts`, { address: email, password }, { headers: emailHeaders });

    // Get token
    const tokenResp = await axios.post(`${MAIL_TM_API}/token`, { address: email, password }, { headers: emailHeaders });
    const token = tokenResp.data.token;

    return { email, password, token };
  } catch (error) {
    console.error("Error creating temporary email:", error);
    throw new Error("Failed to create temporary email");
  }
}

/**
 * Wait for verification code from NanaBanana
 */
export async function waitForVerificationCode(token: string, email: string, timeout: number = 300000): Promise<string | null> {
  const startTime = Date.now();
  const headers = {
    "Content-Type": "application/json",
    "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
    "Authorization": `Bearer ${token}`
  };

  while (Date.now() - startTime < timeout) {
    try {
      const messagesResp = await axios.get(`${MAIL_TM_API}/messages`, { headers });
      const messages = messagesResp.data["hydra:member"] || [];

      for (const msg of messages) {
        const sender = msg.from?.address || '';
        if (sender.includes('nanabanana.ai')) {
          const msgResp = await axios.get(`${MAIL_TM_API}/messages/${msg.id}`, { headers });
          const textContent = msgResp.data.text || '';
          const matches = textContent.match(/\b\d{6}\b/);

          if (matches) {
            return matches[0];
          }
        }
      }

      // Wait 5 seconds before next check
      await new Promise(resolve => setTimeout(resolve, 5000));
    } catch (error) {
      console.error("Error checking email:", error);
      await new Promise(resolve => setTimeout(resolve, 5000));
    }
  }

  return null;
}

/**
 * Create NanaBanana account with automatic verification
 */
export async function createNanaBananaAccount(): Promise<NanaBananaAccountResponse> {
  try {
    // Create temporary email
    const { email, password, token } = await createTemporaryEmail();

    const nanaHeaders = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'accept-language': "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
    };

    // Get CSRF token
    const csrfResp = await axios.get(`${NANA_BANANA_API}/api/auth/csrf`, { headers: nanaHeaders });
    let csrfToken = null;
    let csrfCookie = null;

    if (csrfResp.data) {
      csrfToken = csrfResp.data.csrfToken;
    }

    if (csrfResp.headers['set-cookie']) {
      const cookies = csrfResp.headers['set-cookie'];
      const csrfMatch = cookies.find((c: string) => c.includes('__Host-authjs.csrf-token'));
      if (csrfMatch) {
        csrfCookie = csrfMatch.split('=')[1].split(';')[0];
      }
    }

    // Request verification code
    const verificationHeaders = {
      ...nanaHeaders,
      'Content-Type': "application/json",
      'origin': "https://nanabanana.ai",
      'referer': "https://nanabanana.ai/ar/ai-image",
      'Cookie': `__Host-authjs.csrf-token=${csrfCookie}`
    };

    await axios.post(`${NANA_BANANA_API}/api/auth/email-verification`, { email }, { headers: verificationHeaders });

    // Wait for verification code
    const code = await waitForVerificationCode(token, email);
    if (!code) {
      throw new Error("Verification code not received");
    }

    // Complete registration
    const callbackHeaders = {
      ...nanaHeaders,
      'x-auth-return-redirect': "1",
      'origin': "https://nanabanana.ai",
      'referer': "https://nanabanana.ai/ar/ai-image",
      'Cookie': `__Host-authjs.csrf-token=${csrfCookie}`
    };

    const callbackResp = await axios.post(
      `${NANA_BANANA_API}/api/auth/callback/email-verification`,
      { email, code, redirect: "false", csrfToken, callbackUrl: "https://nanabanana.ai/ar/ai-image" },
      { headers: callbackHeaders }
    );

    let sessionToken = null;
    if (callbackResp.headers['set-cookie']) {
      const cookies = callbackResp.headers['set-cookie'];
      const sessionMatch = cookies.find((c: string) => c.includes('__Secure-authjs.session-token'));
      if (sessionMatch) {
        sessionToken = sessionMatch.split('=')[1].split(';')[0];
      }
    }

    if (!sessionToken) {
      throw new Error("Failed to extract session token");
    }

    return { email, password, sessionToken };
  } catch (error) {
    console.error("Error creating NanaBanana account:", error);
    throw new Error("Failed to create NanaBanana account");
  }
}

/**
 * Upload image to NanaBanana
 */
export async function uploadImageToNanaBanana(imageBuffer: Buffer, sessionToken: string): Promise<string> {
  try {
    const headers = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'origin': "https://nanabanana.ai",
      'sec-fetch-site': "same-origin",
      'sec-fetch-mode': "cors",
      'sec-fetch-dest': "empty",
      'referer': "https://nanabanana.ai/ar/ai-image",
      'accept-language': "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      'priority': "u=1, i",
      'Cookie': `__Secure-authjs.session-token=${sessionToken}`
    };

    const formData = new FormData();
    const uint8Array = new Uint8Array(imageBuffer);
    const blob = new Blob([uint8Array], { type: 'image/jpeg' });
    formData.append('file', blob, 'image.jpg');

    const response = await axios.post(`${NANA_BANANA_API}/api/upload`, formData, { headers });
    return response.data.url;
  } catch (error) {
    console.error("Error uploading image:", error);
    throw new Error("Failed to upload image");
  }
}

/**
 * Create or edit image on NanaBanana
 */
export async function createOrEditImage(
  sessionToken: string,
  prompt: string,
  imageUrls?: string[]
): Promise<string> {
  try {
    const payload = {
      prompt,
      output_format: "png",
      image_size: "auto",
      enable_pro: false,
      width: 1024,
      height: 1024,
      steps: 20,
      guidance_scale: 7.5,
      is_public: false,
      ...(imageUrls && { image_urls: imageUrls })
    };

    const headers = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
      'Content-Type': "application/json",
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'origin': "https://nanabanana.ai",
      'sec-fetch-site': "same-origin",
      'sec-fetch-mode': "cors",
      'sec-fetch-dest': "empty",
      'referer': "https://nanabanana.ai/ar/ai-image",
      'accept-language': "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      'priority': "u=1, i",
      'Cookie': `__Secure-authjs.session-token=${sessionToken}`
    };

    const response = await axios.post(`${NANA_BANANA_API}/api/image-generation-nano-banana/create`, payload, { headers });
    return response.data.task_id;
  } catch (error) {
    console.error("Error creating/editing image:", error);
    throw new Error("Failed to create/edit image");
  }
}

/**
 * Check task status
 */
export async function checkTaskStatus(taskId: string, sessionToken: string): Promise<TaskStatusResponse> {
  try {
    const headers = {
      'User-Agent': "Mozilla/5.0 (Linux; Android 10; K) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36",
      'sec-ch-ua-platform': '"Android"',
      'sec-ch-ua': '"Google Chrome";v="143", "Chromium";v="143", "Not A(Brand";v="24"',
      'sec-ch-ua-mobile': '?1',
      'accept-language': "ar-EG,ar;q=0.9,en-US;q=0.8,en;q=0.7",
      'Cookie': `__Secure-authjs.session-token=${sessionToken}`
    };

    const response = await axios.get(`${NANA_BANANA_API}/api/image-generation-nano-banana/${taskId}`, { headers });
    
    return {
      status: response.data.status,
      resultUrl: response.data.result_url,
      errorMessage: response.data.error_message
    };
  } catch (error) {
    console.error("Error checking task status:", error);
    throw new Error("Failed to check task status");
  }
}

/**
 * Download image from URL
 */
export async function downloadImage(imageUrl: string): Promise<Buffer> {
  try {
    const response = await axios.get(imageUrl, { responseType: 'arraybuffer' });
    return Buffer.from(response.data as ArrayBuffer);
  } catch (error) {
    console.error("Error downloading image:", error);
    throw new Error("Failed to download image");
  }
}
