type RecaptchaVerifyResult =
  | {
      ok: true;
      hostname?: string;
      challengeTs?: string;
      score?: number;
    }
  | {
      ok: false;
      reason: "unconfigured" | "verification_failed" | "invalid" | "low_score";
      errorCodes?: string[];
      score?: number;
    };

type VerifyGoogleRecaptchaParams = {
  token: string;
  remoteIp?: string | null;
  minimumScore?: number;
};

type GoogleRecaptchaResponse = {
  success: boolean;
  challenge_ts?: string;
  hostname?: string;
  score?: number;
  action?: string;
  "error-codes"?: string[];
};

function getRecaptchaSecret() {
  const secret = process.env.RECAPTCHA_SECRET_KEY?.trim();
  return secret || null;
}

export async function verifyGoogleRecaptcha({
  token,
  remoteIp,
  minimumScore = 0.4
}: VerifyGoogleRecaptchaParams): Promise<RecaptchaVerifyResult> {
  const secret = getRecaptchaSecret();
  if (!secret) {
    return { ok: false, reason: "unconfigured" };
  }

  const body = new URLSearchParams();
  body.set("secret", secret);
  body.set("response", token);

  if (remoteIp) {
    body.set("remoteip", remoteIp);
  }

  let data: GoogleRecaptchaResponse;

  try {
    const response = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body,
      cache: "no-store"
    });

    if (!response.ok) {
      return { ok: false, reason: "verification_failed" };
    }

    data = (await response.json()) as GoogleRecaptchaResponse;
  } catch {
    return { ok: false, reason: "verification_failed" };
  }

  if (!data.success) {
    return {
      ok: false,
      reason: "invalid",
      errorCodes: data["error-codes"]
    };
  }

  if (typeof data.score === "number" && data.score < minimumScore) {
    return {
      ok: false,
      reason: "low_score",
      score: data.score,
      errorCodes: data["error-codes"]
    };
  }

  return {
    ok: true,
    hostname: data.hostname,
    challengeTs: data.challenge_ts,
    score: data.score
  };
}
