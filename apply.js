// Amanzi Africa public enquiry form. Uses the Supabase publishable key only.
const SUPABASE_URL = "https://ycerajvpuvhesmoigmms.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oF7uTBv1aeHvupZJCb_WIg_r0LRzGEr";
const { createClient } = supabase;
const db = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.getElementById("enquiry-form");
const messageBox = document.getElementById("enquiry-message");
const typeSelect = document.getElementById("client_type");
const organisationField = document.getElementById("organisation-field");

function showEnquiryMessage(text, type) {
  messageBox.textContent = text;
  messageBox.className = "enquiry-message" + (type ? " " + type : "");
  messageBox.hidden = false;
}

typeSelect.addEventListener("change", () => {
  const individual = typeSelect.value === "individual";
  organisationField.hidden = individual;
  document.getElementById("organisation_name").required = !individual && typeSelect.value !== "";
});

form.addEventListener("submit", async (event) => {
  event.preventDefault();
  const submit = form.querySelector('button[type="submit"]');
  if (document.getElementById("website").value) return;
  if (!document.getElementById("consent").checked) {
    showEnquiryMessage("Please confirm that Amanzi Africa may use these details to respond to your enquiry.", "error");
    return;
  }

  const values = Object.fromEntries(new FormData(form).entries());
  const payload = {
    full_name: String(values.full_name || "").trim(),
    client_type: values.client_type,
    organisation_name: String(values.organisation_name || "").trim() || null,
    email: String(values.email || "").trim(),
    phone: String(values.phone || "").trim(),
    country: String(values.country || "Kenya").trim(),
    service_interest: values.service_interest,
    message: String(values.message || "").trim() || null,
    consent: true
  };

  submit.disabled = true;
  submit.textContent = "Submitting securely…";
  messageBox.hidden = true;
  try {
    const { error } = await db.from("public_enquiries").insert(payload);
    if (error) throw error;
    form.reset();
    organisationField.hidden = false;
    document.getElementById("country").value = "Kenya";
    showEnquiryMessage("Thank you. Your enquiry has been received by Amanzi Africa. We will review the information and contact you using the details provided.", "success");
  } catch (error) {
    console.error("Amanzi Africa enquiry submission failed:", error);
    showEnquiryMessage("We could not submit your enquiry just now. Please try again, or email amanziafrica@outlook.com for assistance.", "error");
  } finally {
    submit.disabled = false;
    submit.innerHTML = 'Submit enquiry <span>→</span>';
  }
});
