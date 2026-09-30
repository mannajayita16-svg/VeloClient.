export default async function handler(req, res) {

  if (req.method !== "POST") {
    return res.status(405).json({
      error: "Method not allowed"
    });
  }

  try {

    const authorization = req.headers.authorization || "";

    if (!authorization.startsWith("Bearer ")) {
      return res.status(401).json({
        error: "You must be signed in."
      });
    }

    const accessToken = authorization.replace("Bearer ", "");

    if (!process.env.GEMINI_API_KEY) {
      return res.status(500).json({
        error: "Gemini API key is not configured in Vercel."
      });
    }

    if (!process.env.SUPABASE_URL || !process.env.SUPABASE_ANON_KEY) {
      return res.status(500).json({
        error: "Supabase environment variables are missing."
      });
    }

    const userResponse = await fetch(
      `${process.env.SUPABASE_URL}/auth/v1/user`,
      {
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`
        }
      }
    );

    if (!userResponse.ok) {
      return res.status(401).json({
        error: "Your session is invalid or expired."
      });
    }

    const user = await userResponse.json();

    const body = req.body || {};

    const client = String(body.client || "").trim();
    const project = String(body.project || "").trim();
    const information = String(body.information || "").trim();

    if (!client) {
      return res.status(400).json({
        error: "Client name is required."
      });
    }

    const prompt = `
You are the AI onboarding auditor inside VeloClient.

VeloClient is a professional client onboarding platform for US digital,
creative, marketing and web agencies.

Analyze the following client onboarding information.

CLIENT:
${client}

PROJECT:
${project}

INFORMATION:
${information}

Return a professional agency audit containing:

1. Executive Summary
2. Missing Information
3. Missing Assets or Access
4. Project Risks
5. Important Questions for the Client
6. Recommended Next Actions
7. Kickoff Readiness Score from 0 to 100

Be practical and concise.
Do not invent facts.
Clearly identify anything that is unknown.
`;

    const geminiResponse = await fetch(
      "https://generativelanguage.googleapis.com/v1beta/models/gemini-3.6-flash:generateContent",
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": process.env.GEMINI_API_KEY
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt
                }
              ]
            }
          ]
        })
      }
    );

    if (!geminiResponse.ok) {

      const errorText = await geminiResponse.text();

      console.error(errorText);

      return res.status(502).json({
        error: "Gemini could not complete the audit."
      });
    }

    const geminiData = await geminiResponse.json();

    const text =
      geminiData?.candidates?.[0]?.content?.parts
        ?.map(part => part.text || "")
        .join("\n") || "";

    if (!text) {
      return res.status(502).json({
        error: "Gemini returned an empty response."
      });
    }

    await fetch(
      `${process.env.SUPABASE_URL}/rest/v1/audits`,
      {
        method: "POST",
        headers: {
          apikey: process.env.SUPABASE_ANON_KEY,
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
          Prefer: "return=minimal"
        },
        body: JSON.stringify({
          user_id: user.id,
          client_name: client,
          project,
          input_text: information,
          result_text: text
        })
      }
    );

    return res.status(200).json({
      text
    });

  } catch (error) {

    console.error(error);

    return res.status(500).json({
      error: "Unexpected server error."
    });

  }

}
