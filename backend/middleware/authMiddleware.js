// backend/middleware/authMiddleware.js
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

const requireAuth = async (req, res, next) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. Token missing." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser(token);

    if (error || !user) {
      return res
        .status(401)
        .json({ error: "Invalid or expired user session token." });
    }

    // Attach validated Supabase user ID to the request object
    req.user = { id: user.id };
    next();
  } catch (err) {
    console.error("Authentication gateway failure:", err);
    return res
      .status(500)
      .json({ error: "Internal security authentication error." });
  }
};

module.exports = requireAuth;
