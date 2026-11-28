
// Amanzi Africa Client Portal — Administrator workspace
// Uses the Supabase publishable key in the browser. Never add a service-role key here.

const SUPABASE_URL = "https://ycerajvpuvhesmoigmms.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "sb_publishable_oF7uTBv1aeHvupZJCb_WIg_r0LRzGEr";
const DOCUMENT_BUCKET = "client-documents";

const { createClient } = supabase;
const client = createClient(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);

const form = document.getElementById("login-form");
const emailInput = document.getElementById("email");
const passwordInput = document.getElementById("password");
const message = document.getElementById("portal-message");
const loginPanel = document.getElementById("login-panel");
const dashboardPanel = document.getElementById("dashboard-panel");

function showMessage(text, type = "info") {
  message.textContent = text;
  message.className = `portal-message ${type}`;
  message.hidden = false;
}

function showLogin() {
  loginPanel.hidden = false;
  dashboardPanel.hidden = true;
}

function escapeHTML(value) {
  return String(value ?? "").replace(/[&<>"']/g, (character) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;"
  })[character]);
}

function money(value, currency = "KES") {
  const amount = Number(value || 0);
  return `${escapeHTML(currency)} ${amount.toLocaleString("en-KE", {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2
  })}`;
}

function dateLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) :
    date.toLocaleDateString("en-KE", { year: "numeric", month: "short", day: "numeric" });
}

function dateTimeLabel(value) {
  if (!value) return "—";
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? escapeHTML(value) :
    date.toLocaleString("en-KE", {
      year: "numeric", month: "short", day: "numeric",
      hour: "2-digit", minute: "2-digit"
    });
}

function injectWorkspaceStyles() {
  if (document.getElementById("amanzi-workspace-styles")) return;
  const style = document.createElement("style");
  style.id = "amanzi-workspace-styles";
  style.textContent = `
    .aa-workspace{margin-top:22px;color:#173b29}
    .aa-topbar{display:flex;justify-content:space-between;align-items:center;gap:14px;flex-wrap:wrap;margin:18px 0}
    .aa-topbar h3{font:700 21px var(--serif);margin:0;color:#003820}
    .aa-nav{display:flex;gap:7px;flex-wrap:wrap;margin:18px 0;border-bottom:1px solid #dce7df;padding-bottom:12px}
    .aa-nav button,.aa-btn{border:1px solid #cbd8ce;background:#fff;color:#17432d;padding:9px 13px;border-radius:3px;font:600 12px var(--sans);cursor:pointer}
    .aa-nav button.active,.aa-btn.primary{background:#003820;color:#fff;border-color:#003820}
    .aa-btn.gold{background:#b8860b;color:#fff;border-color:#b8860b}
    .aa-btn:disabled{opacity:.55;cursor:wait}
    .aa-grid{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:12px;margin:16px 0}
    .aa-stat{background:#f4f8f5;border:1px solid #e0e9e2;padding:16px}
    .aa-stat span{display:block;font-size:11px;color:#66766b}
    .aa-stat strong{display:block;font:700 23px var(--serif);color:#003820;margin-top:7px}
    .aa-panel{background:#fff;border:1px solid #e0e9e2;padding:17px;margin:14px 0}
    .aa-panel h4{font:700 16px var(--serif);margin:0 0 13px;color:#003820}
    .aa-form-grid{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:11px}
    .aa-field label{display:block;font-size:11px;font-weight:700;color:#17432d;margin:0 0 5px}
    .aa-field input,.aa-field select,.aa-field textarea{width:100%;box-sizing:border-box;border:1px solid #cbd8ce;padding:10px;background:#fff;color:#173b29;font:13px var(--sans);border-radius:2px}
    .aa-field.full{grid-column:1/-1}
    .aa-actions{display:flex;gap:8px;align-items:center;flex-wrap:wrap;margin-top:13px}
    .aa-table-wrap{overflow-x:auto}
    .aa-table{width:100%;border-collapse:collapse;font-size:12px;min-width:520px}
    .aa-table th,.aa-table td{text-align:left;padding:10px 8px;border-bottom:1px solid #e7eee9;vertical-align:top}
    .aa-table th{font-size:10px;text-transform:uppercase;letter-spacing:.04em;color:#66766b;background:#f7faf7}
    .aa-empty{padding:20px;text-align:center;color:#758278;font-size:12px;background:#f7faf7}
    .aa-note{font-size:11px;color:#69776d;line-height:1.6}
    .aa-status{display:inline-block;padding:4px 7px;background:#edf4ef;color:#28583b;font-size:10px;border-radius:2px}
    .aa-section-title{font:700 18px var(--serif);color:#003820;margin:8px 0}
    @media(max-width:650px){.aa-grid{grid-template-columns:repeat(2,minmax(0,1fr))}.aa-form-grid{grid-template-columns:1fr}.aa-field.full{grid-column:auto}.aa-panel{padding:13px}}
  `;
  document.head.appendChild(style);
}

let workspaceData = {
  clients: [],
  engagements: [],
  payments: [],
  documents: [],
  services: []
};

let activeSection = "overview";

function workspaceShell(email) {
  dashboardPanel.hidden = false;
  loginPanel.hidden = true;
  injectWorkspaceStyles();
  dashboardPanel.innerHTML = `
    <div class="portal-welcome">Signed in as <strong>${escapeHTML(email || "Administrator")}</strong></div>
    <div class="aa-workspace">
      <div class="aa-topbar">
        <h3>Amanzi Africa | Administrator</h3>
        <button id="aa-sign-out" class="aa-btn" type="button">Sign out</button>
      </div>
      <nav class="aa-nav" aria-label="Administrator workspace">
        <button type="button" data-section="overview" class="active">Overview</button>
        <button type="button" data-section="clients">Clients</button>
        <button type="button" data-section="engagements">Engagements</button>
        <button type="button" data-section="documents">Documents</button>
        <button type="button" data-section="payments">Payments</button>
        <button type="button" data-section="services">Services</button>
      </nav>
      <div id="aa-content"><div class="aa-empty">Loading your workspace…</div></div>
    </div>
  `;

  dashboardPanel.querySelector("#aa-sign-out").addEventListener("click", async () => {
    await client.auth.signOut();
    showLogin();
    showMessage("You have been signed out.", "info");
  });

  dashboardPanel.querySelectorAll("[data-section]").forEach((button) => {
    button.addEventListener("click", () => renderSection(button.dataset.section));
  });
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

  workspaceShell(user.email);
  showMessage("Administrator sign-in verified. Your secure portal connection is active.", "success");
  await loadWorkspaceData();
  return true;
}

async function loadWorkspaceData() {
  const content = document.getElementById("aa-content");
  if (content) content.innerHTML = '<div class="aa-empty">Loading dashboard information…</div>';

  const results = await Promise.all([
    client.from("clients").select("id,user_id,client_name,organisation_name,email,phone,country,registration_number,client_status,created_at").order("created_at", { ascending: false }),
    client.from("engagements").select("id,client_id,agreement_reference,agreement_status,total_service_fee,currency,created_at"),
    client.from("payment_schedule").select("id,engagement_id,installment_number,amount,due_date,payment_status,paid_at"),
    client.from("client_documents").select("id,client_id,engagement_id,document_name,storage_path,document_type,uploaded_at").order("uploaded_at", { ascending: false }),
    client.from("services").select("id,service_name,description,standard_fee,currency,active").order("service_name")
  ]);

  const names = ["clients", "engagements", "payments", "documents", "services"];
  for (let index = 0; index < results.length; index += 1) {
    const { data, error } = results[index];
    if (error) {
      showMessage(`Unable to load ${names[index]}: ${error.message}`, "error");
      return;
    }
    workspaceData[names[index]] = data || [];
  }
  renderSection(activeSection);
}

function renderSection(section) {
  activeSection = section;
  dashboardPanel.querySelectorAll("[data-section]").forEach((button) => {
    button.classList.toggle("active", button.dataset.section === section);
  });

  const content = document.getElementById("aa-content");
  if (!content) return;

  const renderers = {
    overview: renderOverview,
    clients: renderClients,
    engagements: renderEngagements,
    documents: renderDocuments,
    payments: renderPayments,
    services: renderServices
  };
  content.innerHTML = (renderers[section] || renderOverview)();
  attachSectionEvents();
}

function renderOverview() {
  const outstanding = workspaceData.payments
    .filter((payment) => payment.payment_status !== "paid")
    .reduce((sum, payment) => sum + Number(payment.amount || 0), 0);
  const activeEngagements = workspaceData.engagements
    .filter((item) => !["completed", "cancelled"].includes(String(item.agreement_status || "").toLowerCase())).length;

  return `
    <h4 class="aa-section-title">Workspace overview</h4>
    <div class="aa-grid">
      <div class="aa-stat"><span>Total clients</span><strong>${workspaceData.clients.length}</strong></div>
      <div class="aa-stat"><span>Active engagements*</span><strong>${activeEngagements}</strong></div>
      <div class="aa-stat"><span>Document records</span><strong>${workspaceData.documents.length}</strong></div>
      <div class="aa-stat"><span>Unpaid instalments</span><strong>${workspaceData.payments.filter(p => p.payment_status !== "paid").length}</strong></div>
    </div>
    <div class="aa-panel">
      <h4>Outstanding scheduled payments</h4>
      <div class="aa-section-title">${money(outstanding)}</div>
      <p class="aa-note">Calculated from instalments whose payment status is not marked as paid. This is a scheduled balance, not a bank reconciliation.</p>
    </div>
    <div class="aa-panel">
      <h4>Recently added clients</h4>
      ${clientTable(workspaceData.clients.slice(0, 5))}
    </div>
    <p class="aa-note">*Engagements are counted as active unless their status is completed or cancelled. Confirm your preferred agreement-status values before operational use.</p>
  `;
}

function clientTable(clients) {
  if (!clients.length) return '<div class="aa-empty">No client records have been added yet.</div>';
  return `
    <div class="aa-table-wrap"><table class="aa-table">
      <thead><tr><th>Client</th><th>Organisation</th><th>Email</th><th>Status</th><th>Created</th></tr></thead>
      <tbody>${clients.map((item) => `
        <tr>
          <td><strong>${escapeHTML(item.client_name)}</strong></td>
          <td>${escapeHTML(item.organisation_name || "—")}</td>
          <td>${escapeHTML(item.email || "—")}</td>
          <td><span class="aa-status">${escapeHTML(item.client_status || "—")}</span></td>
          <td>${dateLabel(item.created_at)}</td>
        </tr>`).join("")}</tbody>
    </table></div>
  `;
}

function renderClients() {
  return `
    <h4 class="aa-section-title">Client management</h4>
    <div class="aa-panel">
      <h4>Register a client record</h4>
      <form id="aa-client-form">
        <div class="aa-form-grid">
          <div class="aa-field"><label for="aa-client-name">Client / contact name *</label><input id="aa-client-name" name="client_name" required maxlength="180"></div>
          <div class="aa-field"><label for="aa-org-name">Organisation name</label><input id="aa-org-name" name="organisation_name" maxlength="180"></div>
          <div class="aa-field"><label for="aa-client-email">Email</label><input id="aa-client-email" name="email" type="email" maxlength="254"></div>
          <div class="aa-field"><label for="aa-client-phone">Telephone</label><input id="aa-client-phone" name="phone" maxlength="50"></div>
          <div class="aa-field"><label for="aa-client-country">Country</label><input id="aa-client-country" name="country" value="Kenya" maxlength="100"></div>
          <div class="aa-field"><label for="aa-registration-number">Registration number</label><input id="aa-registration-number" name="registration_number" maxlength="100"></div>
          <div class="aa-field"><label for="aa-client-status">Client status</label><select id="aa-client-status" name="client_status"><option value="prospective">Prospective</option><option value="onboarding">Onboarding</option><option value="active">Active</option><option value="inactive">Inactive</option></select></div>
        </div>
        <div class="aa-actions"><button class="aa-btn primary" type="submit">Save client record</button></div>
      </form>
      <p class="aa-note">This creates the client business record only. It does not create a login or send an invitation. Client account activation will be handled through a separate secure process.</p>
    </div>
    <div class="aa-panel">
      <h4>Client register (${workspaceData.clients.length})</h4>
      <div class="aa-field"><label for="aa-client-search">Search clients</label><input id="aa-client-search" type="search" placeholder="Search name, organisation or email"></div>
      <div id="aa-client-table" style="margin-top:12px">${clientTable(workspaceData.clients)}</div>
    </div>
  `;
}

function renderEngagements() {
  if (!workspaceData.engagements.length) {
    return '<h4 class="aa-section-title">Engagements</h4><div class="aa-empty">No engagements have been recorded yet.</div>';
  }
  const clientNames = new Map(workspaceData.clients.map((item) => [item.id, item.client_name]));
  return `
    <h4 class="aa-section-title">Engagement register</h4>
    <div class="aa-panel"><div class="aa-table-wrap"><table class="aa-table">
      <thead><tr><th>Client</th><th>Agreement reference</th><th>Status</th><th>Service fee</th><th>Created</th></tr></thead>
      <tbody>${workspaceData.engagements.map((item) => `
        <tr><td>${escapeHTML(clientNames.get(item.client_id) || "Unmatched client")}</td>
        <td>${escapeHTML(item.agreement_reference || "—")}</td>
        <td><span class="aa-status">${escapeHTML(item.agreement_status || "—")}</span></td>
        <td>${money(item.total_service_fee, item.currency || "KES")}</td>
        <td>${dateLabel(item.created_at)}</td></tr>`).join("")}</tbody>
    </table></div></div>
    <p class="aa-note">This first release displays existing engagements. Agreement creation and service allocation will be added after the engagement workflow and fee rules are confirmed.</p>
  `;
}

function renderDocuments() {
  const options = workspaceData.clients.map((item) =>
    `<option value="${escapeHTML(item.id)}">${escapeHTML(item.client_name)}${item.organisation_name ? " — " + escapeHTML(item.organisation_name) : ""}</option>`
  ).join("");
  return `
    <h4 class="aa-section-title">Private client documents</h4>
    <div class="aa-panel">
      <h4>Upload a document to a client record</h4>
      <form id="aa-document-form">
        <div class="aa-form-grid">
          <div class="aa-field full"><label for="aa-document-client">Client *</label><select id="aa-document-client" required><option value="">Select a client</option>${options}</select></div>
          <div class="aa-field"><label for="aa-document-type">Document category</label><select id="aa-document-type"><option value="company_kyc">Company KYC</option><option value="individual_kyc">Individual KYC</option><option value="financial">Financial information</option><option value="transaction">Transaction / contract</option><option value="other">Other</option></select></div>
          <div class="aa-field"><label for="aa-document-file">Choose file *</label><input id="aa-document-file" type="file" required accept=".pdf,.jpg,.jpeg,.png,.xlsx,.xls,.doc,.docx"></div>
        </div>
        <div class="aa-actions"><button class="aa-btn primary" type="submit" ${workspaceData.clients.length ? "" : "disabled"}>Upload privately</button></div>
      </form>
      <p class="aa-note">Files are stored in the private client-documents bucket. The application accepts PDF, image, spreadsheet and Word document formats up to 10 MB. Never upload passwords or authentication tokens.</p>
    </div>
    <div class="aa-panel">
      <h4>Document register (${workspaceData.documents.length})</h4>
      ${documentTable(workspaceData.documents)}
    </div>
  `;
}

function documentTable(documents) {
  if (!documents.length) return '<div class="aa-empty">No document records have been added.</div>';
  const clientNames = new Map(workspaceData.clients.map((item) => [item.id, item.client_name]));
  return `<div class="aa-table-wrap"><table class="aa-table">
    <thead><tr><th>Client</th><th>Document</th><th>Category</th><th>Uploaded</th><th>Action</th></tr></thead>
    <tbody>${documents.map((item) => `
      <tr><td>${escapeHTML(clientNames.get(item.client_id) || "Unmatched client")}</td>
      <td>${escapeHTML(item.document_name)}</td><td>${escapeHTML(item.document_type || "—")}</td>
      <td>${dateTimeLabel(item.uploaded_at)}</td>
      <td><div class="aa-actions" style="margin:0">
        <button type="button" class="aa-btn" data-view="${escapeHTML(item.id)}">View</button>
        <button type="button" class="aa-btn" data-download="${escapeHTML(item.id)}">Download</button>
      </div></td></tr>`).join("")}</tbody>
  </table></div>`;
}

function renderPayments() {
  if (!workspaceData.payments.length) {
    return '<h4 class="aa-section-title">Payments</h4><div class="aa-empty">No payment instalments have been recorded yet.</div>';
  }
  const engagementMap = new Map(workspaceData.engagements.map((item) => [item.id, item]));
  const clientMap = new Map(workspaceData.clients.map((item) => [item.id, item.client_name]));
  return `
    <h4 class="aa-section-title">Payment schedule</h4>
    <div class="aa-panel"><div class="aa-table-wrap"><table class="aa-table">
      <thead><tr><th>Client</th><th>Instalment</th><th>Amount</th><th>Due date</th><th>Status</th><th>Paid date</th></tr></thead>
      <tbody>${workspaceData.payments.map((item) => {
        const engagement = engagementMap.get(item.engagement_id);
        return `<tr><td>${escapeHTML(clientMap.get(engagement?.client_id) || "Unmatched client")}</td>
          <td>${escapeHTML(item.installment_number)}</td><td>${money(item.amount, engagement?.currency || "KES")}</td>
          <td>${dateLabel(item.due_date)}</td><td><span class="aa-status">${escapeHTML(item.payment_status || "pending")}</span></td>
          <td>${dateLabel(item.paid_at)}</td></tr>`;
      }).join("")}</tbody>
    </table></div></div>
    <p class="aa-note">Payment records are read-only in this release. We will add controlled payment updates, references and receipt storage after confirming the finance workflow.</p>
  `;
}

function renderServices() {
  if (!workspaceData.services.length) {
    return '<h4 class="aa-section-title">Service catalogue</h4><div class="aa-empty">No services have been added yet.</div>';
  }
  return `
    <h4 class="aa-section-title">Service catalogue</h4>
    <div class="aa-panel"><div class="aa-table-wrap"><table class="aa-table">
      <thead><tr><th>Service</th><th>Description</th><th>Standard fee</th><th>Status</th></tr></thead>
      <tbody>${workspaceData.services.map((item) => `
        <tr><td><strong>${escapeHTML(item.service_name)}</strong></td><td>${escapeHTML(item.description || "—")}</td>
        <td>${item.standard_fee == null ? "To be agreed" : money(item.standard_fee, item.currency || "KES")}</td>
        <td><span class="aa-status">${item.active ? "Active" : "Inactive"}</span></td></tr>`).join("")}</tbody>
    </table></div></div>
  `;
}

function attachSectionEvents() {
  const clientForm = document.getElementById("aa-client-form");
  if (clientForm) {
    clientForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = clientForm.querySelector('button[type="submit"]');
      button.disabled = true;
      const values = Object.fromEntries(new FormData(clientForm).entries());
      const payload = {
        client_name: values.client_name.trim(),
        organisation_name: values.organisation_name.trim() || null,
        email: values.email.trim() || null,
        phone: values.phone.trim() || null,
        country: values.country.trim() || "Kenya",
        registration_number: values.registration_number.trim() || null,
        client_status: values.client_status || "prospective"
      };

      const { error } = await client.from("clients").insert(payload);
      button.disabled = false;
      if (error) {
        showMessage(`Client could not be saved: ${error.message}`, "error");
        return;
      }
      showMessage("Client record saved successfully.", "success");
      await loadWorkspaceData();
      activeSection = "clients";
      renderSection("clients");
    });
  }

  const search = document.getElementById("aa-client-search");
  if (search) {
    search.addEventListener("input", () => {
      const term = search.value.trim().toLowerCase();
      const filtered = workspaceData.clients.filter((item) =>
        [item.client_name, item.organisation_name, item.email, item.phone]
          .some((value) => String(value || "").toLowerCase().includes(term))
      );
      document.getElementById("aa-client-table").innerHTML = clientTable(filtered);
    });
  }

  const documentForm = document.getElementById("aa-document-form");
  if (documentForm) {
    documentForm.addEventListener("submit", async (event) => {
      event.preventDefault();
      const button = documentForm.querySelector('button[type="submit"]');
      const clientId = document.getElementById("aa-document-client").value;
      const file = document.getElementById("aa-document-file").files[0];
      const documentType = document.getElementById("aa-document-type").value;

      if (!clientId || !file) {
        showMessage("Select a client and a file before uploading.", "error");
        return;
      }
      if (file.size > 10 * 1024 * 1024) {
        showMessage("The file exceeds the 10 MB storage limit.", "error");
        return;
      }
      const allowedTypes = [
        "application/pdf", "image/jpeg", "image/png",
        "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        "application/vnd.ms-excel",
        "application/msword",
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
      ];
      if (file.type && !allowedTypes.includes(file.type)) {
        showMessage("This file type is not in the approved upload list.", "error");
        return;
      }

      button.disabled = true;
      button.textContent = "Uploading…";
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${clientId}/${Date.now()}-${safeName}`;
      const { error: uploadError } = await client.storage
        .from(DOCUMENT_BUCKET)
        .upload(storagePath, file, { upsert: false, contentType: file.type || undefined });

      if (uploadError) {
        button.disabled = false;
        button.textContent = "Upload privately";
        showMessage(`Upload failed: ${uploadError.message}`, "error");
        return;
      }

      const { error: recordError } = await client.from("client_documents").insert({
        client_id: clientId,
        document_name: file.name,
        storage_path: storagePath,
        document_type: documentType
      });

      if (recordError) {
        // Do not leave an untracked file behind if its metadata record failed.
        await client.storage.from(DOCUMENT_BUCKET).remove([storagePath]);
        button.disabled = false;
        button.textContent = "Upload privately";
        showMessage(`The file uploaded but its record could not be saved: ${recordError.message}. The untracked file was removed where permitted.`, "error");
        return;
      }

      showMessage("Document uploaded and recorded in private storage.", "success");
      await loadWorkspaceData();
      renderSection("documents");
    });
  }

  document.querySelectorAll("[data-view]").forEach((button) => {
    button.addEventListener("click", async () => {
      const record = workspaceData.documents.find((item) => item.id === button.dataset.view);
      if (!record) return;
      button.disabled = true;
      button.textContent = "Preparing…";
      const { data, error } = await client.storage
        .from(DOCUMENT_BUCKET)
        .createSignedUrl(record.storage_path, 60);
      button.disabled = false;
      button.textContent = "View";
      if (error || !data?.signedUrl) {
        showMessage(`Unable to open this document securely: ${error?.message || "No secure link was returned."}`, "error");
        return;
      }
      window.open(data.signedUrl, "_blank", "noopener,noreferrer");
    });
  });

  document.querySelectorAll("[data-download]").forEach((button) => {
    button.addEventListener("click", async () => {
      const record = workspaceData.documents.find((item) => item.id === button.dataset.download);
      if (!record) return;
      button.disabled = true;
      button.textContent = "Preparing…";
      const { data, error } = await client.storage.from(DOCUMENT_BUCKET).download(record.storage_path);
      button.disabled = false;
      button.textContent = "Download";
      if (error) {
        showMessage(`Unable to retrieve this document: ${error.message}`, "error");
        return;
      }
      const url = URL.createObjectURL(data);
      const link = document.createElement("a");
      link.href = url;
      link.download = record.document_name || "client-document";
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
    });
  });
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

(async function restoreSession() {
  const { data, error } = await client.auth.getSession();
  if (error) {
    showMessage("Unable to restore your session. Please sign in again.", "error");
    return;
  }
  if (data.session) await verifyAdministrator(data.session.user);
})();
