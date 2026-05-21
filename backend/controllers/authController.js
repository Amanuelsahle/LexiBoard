// backend/controllers/authController.js
const { createClient } = require("@supabase/supabase-js");

// Initialize the Supabase Auth client handler
const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_ANON_KEY,
);

// 1. REGISTER NEW USER
exports.register = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signUp({ email, password });
    if (error) {
      console.error("❌ SUPABASE SIGNUP ERROR:", error.message, error.status);
      return res.status(400).json({ error: error.message });
    }
    // Return the secure JWT access token
    return res.status(201).json({
      message: "User created",
      token: data.session?.access_token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Auth Server Error" });
  }
};

// 2. LOG IN EXISTING USER
exports.login = async (req, res) => {
  const { email, password } = req.body;
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) return res.status(400).json({ error: error.message });

    return res.status(200).json({
      message: "Login successful",
      token: data.session?.access_token,
    });
  } catch (err) {
    return res.status(500).json({ error: "Internal Auth Server Error" });
  }
};

// 3. ⚡ ONE-CLICK HYBRID GUEST PORTAL ENGINE ⚡
exports.guestLogin = async (req, res) => {
  try {
    // We log the guest into a pre-made global demo account
    const { data, error } = await supabase.auth.signInWithPassword({
      email: "guest@lexiboard.com", // 👈 Make sure to read the next step to create this account!
      password: "GuestDemoPassword123!",
    });

    if (error) {
      console.error(
        "❌ SUPABASE GUEST LOGIN ERROR:",
        error.message,
        error.status,
      );
      return res.status(400).json({ error: error.message });
    }

    return res.status(200).json({
      message: "Logged in as guest account placeholder",
      token: data.session?.access_token,
    });
  } catch (err) {
    console.error("System Crash:", err);
    return res.status(500).json({ error: "Internal Guest Auth Error" });
  }
};
