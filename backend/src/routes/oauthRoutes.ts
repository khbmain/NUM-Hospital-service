import { Router } from "express";
import jwt from "jsonwebtoken";
import { User } from "../models/userModel";
import { ExternalIdentity } from "../models/externalIdentityModel";
import { generateToken } from "../utils/auth";
import {
  NUM_SISI_CLIENT_ID,
  NUM_SISI_CLIENT_SECRET,
  NUM_SISI_AUTH_URL,
  NUM_SISI_TOKEN_URL,
  NUM_SISI_USERINFO_URL,
  NUM_SISI_CALLBACK_URL,
  NUM_SISI_SCOPES,
  OAUTH_STATE_SECRET,
  PATIENT_FRONTEND_URL,
  ADMIN_FRONTEND_URL,
} from "../utils/constants";

const router = Router();

// ─── Initiate OAuth ─────────────────────────────────────────
router.get("/auth/sisi", (req, res) => {
  if (!NUM_SISI_CLIENT_ID) {
    return res.status(503).json({ error: "SISI OAuth not configured" });
  }

  const state = jwt.sign(
    { ts: Date.now(), origin: (req.query.origin as string) || "patient" },
    OAUTH_STATE_SECRET,
    { expiresIn: "10m" }
  );

  const params = new URLSearchParams({
    response_type: "code",
    client_id: NUM_SISI_CLIENT_ID,
    redirect_uri: NUM_SISI_CALLBACK_URL,
    scope: NUM_SISI_SCOPES,
    state,
  });

  res.redirect(`${NUM_SISI_AUTH_URL}?${params.toString()}`);
});

// ─── Handle Callback ────────────────────────────────────────
router.get("/auth/sisi/callback", async (req, res) => {
  const fallbackUrl = PATIENT_FRONTEND_URL;

  try {
    const { code, state } = req.query;
    if (!code || !state) {
      return res.redirect(`${fallbackUrl}/login?error=missing_params`);
    }

    // Verify state token
    let statePayload: any;
    try {
      statePayload = jwt.verify(state as string, OAUTH_STATE_SECRET);
    } catch {
      return res.redirect(`${fallbackUrl}/login?error=invalid_state`);
    }

    const frontendUrl =
      statePayload.origin === "admin" ? ADMIN_FRONTEND_URL : PATIENT_FRONTEND_URL;

    // Exchange code for tokens
    const tokenRes = await fetch(NUM_SISI_TOKEN_URL, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        grant_type: "authorization_code",
        code: code as string,
        redirect_uri: NUM_SISI_CALLBACK_URL,
        client_id: NUM_SISI_CLIENT_ID,
        client_secret: NUM_SISI_CLIENT_SECRET,
      }),
    });

    if (!tokenRes.ok) {
      console.error("Token exchange failed:", await tokenRes.text());
      return res.redirect(`${frontendUrl}/login?error=token_exchange_failed`);
    }

    const tokenData = await tokenRes.json();

    // Get user info
    const userInfoRes = await fetch(NUM_SISI_USERINFO_URL, {
      headers: { Authorization: `Bearer ${tokenData.access_token}` },
    });

    if (!userInfoRes.ok) {
      return res.redirect(`${frontendUrl}/login?error=userinfo_failed`);
    }

    const userInfo = await userInfoRes.json();
    const providerUserId = userInfo.sub || userInfo.id || userInfo.user_id;

    // Find or create local user
    let identity = await ExternalIdentity.findOne({
      provider: "num_sisi",
      providerUserId,
    });

    let user;
    if (identity) {
      user = await User.findById(identity.userId);
      if (!user) {
        return res.redirect(`${frontendUrl}/login?error=user_not_found`);
      }
      if (user.status === "suspended") {
        return res.redirect(`${frontendUrl}/login?error=account_suspended`);
      }
    } else {
      // Create new user with patient role by default
      user = new User({
        email: userInfo.email,
        phone: userInfo.phone_number || userInfo.phone,
        firstname: userInfo.given_name || userInfo.firstname || "N/A",
        lastname: userInfo.family_name || userInfo.lastname || "N/A",
        role: "patient",
        status: "active",
        lastLoginAt: new Date(),
      });
      await user.save();

      identity = new ExternalIdentity({
        userId: user._id,
        provider: "num_sisi",
        providerUserId,
        providerEmail: userInfo.email,
        providerData: userInfo,
        linkedAt: new Date(),
      });
      await identity.save();
    }

    // Update last login
    user.lastLoginAt = new Date();
    await user.save();

    // Generate local JWT
    const token = generateToken({
      _id: user._id!.toString(),
      phone: user.phone || "",
      role: user.role as string,
    });

    // Redirect to frontend with token
    res.redirect(`${frontendUrl}/auth/callback?token=${token}`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    res.redirect(`${fallbackUrl}/login?error=oauth_failed`);
  }
});

export default router;
