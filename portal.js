// Amanzi Africa secure portal authentication
// The publishable key is intended for browser use. Never place a secret/service-role key here.
const SUPABASE_URL = "https://ycerajvpuvhesmoigmms.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oF7uTBv1aeHvupZJCb_WIg_r0LRzGEr";
const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const $ = (id) => document.getElementById(id);
const form = $("login-form");
const emailInput = $("email");
const passwordInput = $("password");
const message = $("portal-message");
const loginPanel = $("login-panel");
const recoveryPanel = $("recovery-panel");
const resetPanel = $("reset-panel");
const dashboardPanel = $("dashboard-panel");
const userLabel = $("user-label");
const signOutButton = $("sign-out");

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = `portal-message ${type}`;
  message.hidden = false;
}
function hidePanels() {
  [loginPanel, recoveryPanel, resetPanel, dashboardPanel].forEach(panel => panel.hidden = true);
}
function showPanel(panel) {
  hidePanels();
  panel.hidden = false;
}
function showLogin() { showPanel(loginPanel); }
function showDashboard(email) {
  showPanel(dashboardPanel);
  userLabel.textContent = email || "Administrator";
}
async function verifyAdministrator(user) {
  const { data, error } = await client.from("profiles").select("full_name, role").eq("id", user.id).single();
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
  const button = form.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Signing in…";
  message.hidden = true;
  try {
    const { data, error } = await client.auth.signInWithPassword({
      email: emailInput.value.trim(), password: passwordInput.value
    });
    if (error) throw error;
    await verifyAdministrator(data.user);
  } catch (error) {
    showMessage(error.message || "Unable to sign in. Please check your details and try again.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Sign in securely";
    passwordInput.value = "";
  }
});

$("forgot-password").addEventListener("click", (event) => {
  event.preventDefault();
  $("recovery-email").value = emailInput.value.trim();
  showPanel(recoveryPanel);
  message.hidden = true;
});
$("back-to-login").addEventListener("click", () => { showLogin(); message.hidden = true; });

$("recovery-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Requesting…";
  try {
    const redirectTo = window.location.href.split("?")[0].split("#")[0] + "?mode=reset";
    const { error } = await client.auth.resetPasswordForEmail($("recovery-email").value.trim(), { redirectTo });
    if (error) throw error;
    showMessage("If the address is registered, a password-reset email will be sent. Check your inbox and spam folder. If requests are rate-limited, wait before trying again.", "success");
  } catch (error) {
    const rateLimited = /rate limit|too many requests/i.test(error.message || "");
    showMessage(rateLimited
      ? "Supabase is temporarily rate-limiting recovery emails. Please wait for the limit to clear before requesting another link."
      : (error.message || "We could not request a reset link. Please contact Amanzi Africa."), "error");
  } finally {
    button.disabled = false;
    button.textContent = "Send password reset link";
  }
});

$("reset-form").addEventListener("submit", async (event) => {
  event.preventDefault();
  const first = $("new-password").value;
  const second = $("confirm-password").value;
  if (first !== second) { showMessage("The passwords do not match. Please check and try again.", "error"); return; }
  const button = event.currentTarget.querySelector('button[type="submit"]');
  button.disabled = true;
  button.textContent = "Saving…";
  try {
    const { error } = await client.auth.updateUser({ password: first });
    if (error) throw error;
    await client.auth.signOut();
    $("reset-form").reset();
    showLogin();
    showMessage("Your password has been updated. You can now sign in.", "success");
    window.history.replaceState({}, document.title, window.location.pathname);
  } catch (error) {
    showMessage(error.message || "Unable to update the password. Request a fresh reset link or contact support.", "error");
  } finally {
    button.disabled = false;
    button.textContent = "Save new password";
  }
});

signOutButton.addEventListener("click", async () => {
  await client.auth.signOut();
  showLogin();
  showMessage("You have been signed out.", "info");
});

client.auth.onAuthStateChange(async (event, session) => {
  if (event === "PASSWORD_RECOVERY") {
    showPanel(resetPanel);
    showMessage("Choose a new password for your account.", "info");
  }
});

(async function restoreSession() {
  if (new URLSearchParams(window.location.search).get("mode") === "reset") return;
  const { data } = await client.auth.getSession();
  if (data.session) await verifyAdministrator(data.session.user);
})();
