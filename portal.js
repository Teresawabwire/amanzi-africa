// Amanzi Africa Client Portal
// The publishable key is intended for browser use. Never place a secret/service-role key here.
const SUPABASE_URL = "https://ycerajvpuvhesmoigmms.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oF7uTBv1aeHvupZJCb_WIg_r0LRzGEr";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("portal-message");
const loginPanel = document.getElementById("login-panel");
const dashboardPanel = document.getElementById("dashboard-panel");
const userLabel = document.getElementById("user-label");
const signOutButton = document.getElementById("sign-out");

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = `portal-message ${type}`;
  message.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  dashboardPanel.hidden = true;
}

function showDashboard(email) {
  loginPanel.hidden = true;
  dashboardPanel.hidden = false;
  userLabel.textContent = email || "Administrator";
}

async function verifyAdministrator(user) {
  const { data, error } = await client
    .from("profiles")
    .select("full_name, role")
    .eq("id", user.id)
    .single();

  if (error || !data || data.role !== "admin") {
    await client.auth.signOut();
    showLogin();
    showMessage("This account does not have administrator access. Please contact Amanzi Africa.", "error");
    return false;
  }

  showDashboard(user.email);
  showMessage("Administrator sign-in verified. Your secure portal connection is active.", "success");
  return true;
}

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submitButton = form.querySelector('button[type="submit"]');
  submitButton.disabled = true;
  submitButton.textContent = "Signing in…";
  message.hidden = true;

  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: emailInput.value.trim(),
      password: passwordInput.value
    });

    if (error) throw error;
    await verifyAdministrator(data.user);
  } catch (error) {
    showMessage(error.message || "Unable to sign in. Please check your details and try again.", "error");
  } finally {
    submitButton.disabled = false;
    submitButton.textContent = "Sign in securely";
    passwordInput.value = "";
  }
});

signOutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  showLogin();
  showMessage("You have been signed out.", "info");
});

(async function restoreSession() {
  const { data } = await client.auth.getSession();
  if (data.session) await verifyAdministrator(data.session.user);
})();
