document.addEventListener("DOMContentLoaded", async () => {

  const {
    data: { session }
  } = await supabaseClient.auth.getSession();

  const protectedPages = [
    "dashboard.html",
    "clients.html",
    "audit.html",
    "settings.html"
  ];

  const currentPage =
    window.location.pathname.split("/").pop() || "index.html";

  if (protectedPages.includes(currentPage) && !session) {
    window.location.href = "login.html";
    return;
  }

  if (document.getElementById("logout")) {
    document.getElementById("logout").addEventListener("click", async () => {
      await supabaseClient.auth.signOut();
      window.location.href = "index.html";
    });
  }

  if (session) {
    loadUser(session.user);
  }

  if (currentPage === "dashboard.html") {
    await loadDashboard(session.user);
  }

  if (currentPage === "clients.html") {
    await setupClientsPage(session.user);
  }

  if (currentPage === "audit.html") {
    await setupAuditPage();
  }

  if (currentPage === "checkout.html") {
    setupCheckout();
  }

});

async function loadUser(user) {

  const metadata = user.user_metadata || {};

  const name =
    metadata.full_name ||
    user.email?.split("@")[0] ||
    "Agency Owner";

  const userName = document.getElementById("userName");
  const userEmail = document.getElementById("userEmail");
  const avatar = document.getElementById("avatar");
  const greeting = document.getElementById("nameGreeting");

  if (userName) userName.textContent = name;
  if (userEmail) userEmail.textContent = user.email || "";
  if (avatar) avatar.textContent = name.charAt(0).toUpperCase();
  if (greeting) greeting.textContent = ", " + name.split(" ")[0];

}

async function loadDashboard(user) {

  const { data: clients, error } = await supabaseClient
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    console.error(error);
    return;
  }

  const { data: audits } = await supabaseClient
    .from("audits")
    .select("id");

  const total = clients?.length || 0;

  const active =
    clients?.filter(c => c.status === "in_progress").length || 0;

  const completed =
    clients?.filter(c => c.status === "completed").length || 0;

  const auditCount = audits?.length || 0;

  const totalEl = document.getElementById("totalClients");
  const activeEl = document.getElementById("activeClients");
  const completedEl = document.getElementById("completedClients");
  const auditEl = document.getElementById("totalAudits");

  if (totalEl) totalEl.textContent = total;
  if (activeEl) activeEl.textContent = active;
  if (completedEl) completedEl.textContent = completed;
  if (auditEl) auditEl.textContent = auditCount;

  const list = document.getElementById("clientList");

  if (!list) return;

  if (!clients?.length) {
    list.innerHTML = `
      <div class="empty-state">
        <strong>No clients yet</strong>
        <p>Add your first client to start onboarding.</p>
        <a href="clients.html" class="btn btn-small">Add Client</a>
      </div>
    `;
    return;
  }

  list.innerHTML = clients.slice(0, 8).map(client => `
    <div class="client-row">
      <div>
        <strong>${escapeHtml(client.name)}</strong>
        <small>${escapeHtml(client.project || "No project specified")}</small>
      </div>

      <span class="pill ${statusClass(client.status)}">
        ${formatStatus(client.status)}
      </span>

      <span class="progress">
        <i style="width:${client.status === "completed" ? 100 : client.status === "in_progress" ? 60 : 10}%"></i>
      </span>
    </div>
  `).join("");
}

async function setupClientsPage(user) {

  await renderClients();

  const modal = document.getElementById("clientModal");
  const open = document.getElementById("openModal");
  const close = document.getElementById("closeModal");
  const form = document.getElementById("clientForm");

  if (open) {
    open.addEventListener("click", () => {
      modal.classList.remove("hidden");
    });
  }

  if (close) {
    close.addEventListener("click", () => {
      modal.classList.add("hidden");
    });
  }

  if (form) {

    form.addEventListener("submit", async event => {

      event.preventDefault();

      const message = document.getElementById("clientMessage");

      message.textContent = "Creating client...";

      const { error } = await supabaseClient
        .from("clients")
        .insert({
          user_id: user.id,
          name: document.getElementById("clientName").value.trim(),
          email: document.getElementById("clientEmail").value.trim(),
          project: document.getElementById("clientProject").value.trim(),
          status: document.getElementById("clientStatus").value
        });

      if (error) {
        message.textContent = error.message;
        return;
      }

      modal.classList.add("hidden");
      form.reset();

      await renderClients();

    });

  }

}

async function renderClients() {

  const grid = document.getElementById("clientsGrid");

  if (!grid) return;

  const { data, error } = await supabaseClient
    .from("clients")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) {
    grid.innerHTML = `<p class="form-message">${escapeHtml(error.message)}</p>`;
    return;
  }

  if (!data?.length) {
    grid.innerHTML = `
      <div class="panel empty-state">
        <strong>No clients yet</strong>
        <p>Create your first client workspace.</p>
      </div>
    `;
    return;
  }

  grid.innerHTML = data.map(client => `
    <article class="client-card">

      <span class="eyebrow">CLIENT</span>

      <h3>${escapeHtml(client.name)}</h3>

      <p>${escapeHtml(client.project || "No project")}</p>

      <p>${escapeHtml(client.email || "No email")}</p>

      <span class="pill ${statusClass(client.status)}">
        ${formatStatus(client.status)}
      </span>

    </article>
  `).join("");
}

async function setupAuditPage() {

  const form = document.getElementById("auditForm");

  if (!form) return;

  form.addEventListener("submit", async event => {

    event.preventDefault();

    const message = document.getElementById("auditMessage");
    const output = document.getElementById("auditResult");

    const client = document.getElementById("auditClient").value.trim();
    const project = document.getElementById("auditProject").value.trim();
    const information = document.getElementById("auditInfo").value.trim();

    message.textContent = "Gemini is analyzing the client information...";

    output.innerHTML = `
      <div class="audit-placeholder">
        <div class="large-orb">✦</div>
        <h3>Running audit...</h3>
        <p>Please wait while VeloClient analyzes the information.</p>
      </div>
    `;

    try {

      const {
        data: { session }
      } = await supabaseClient.auth.getSession();

      const response = await fetch("/api/audit.js", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          client,
          project,
          information
        })
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Audit failed.");
      }

      output.innerHTML = `
        <div class="audit-result-content">
          <span class="eyebrow">GEMINI AUDIT</span>
          <h2>${escapeHtml(client)}</h2>
          <div class="audit-text">${formatAudit(result.text)}</div>
        </div>
      `;

      message.textContent = "Audit completed.";

    } catch (error) {

      message.textContent = error.message;

      output.innerHTML = `
        <div class="audit-placeholder">
          <div class="large-orb">!</div>
          <h3>Audit could not be completed</h3>
          <p>${escapeHtml(error.message)}</p>
        </div>
      `;

    }

  });

}

function setupCheckout() {

  const params = new URLSearchParams(window.location.search);
  const plan = params.get("plan") || "lifetime";

  const title = document.getElementById("planTitle");
  const price = document.getElementById("orderPrice");
  const type = document.getElementById("orderType");
  const paypalButton = document.getElementById("paypalButton");

  if (plan === "monthly") {

    title.textContent = "VeloClient Pro";
    price.textContent = "$199";
    type.textContent = "Monthly subscription";

  } else {

    title.textContent = "VeloClient Lifetime";
    price.textContent = "$10,000";
    type.textContent = "One-time payment";

  }

  /*
    Replace this with your real PayPal checkout URL
    once your PayPal payment integration is configured.
  */

  paypalButton.addEventListener("click", event => {

    event.preventDefault();

    alert(
      "PayPal checkout is not connected yet. Configure your PayPal payment integration before accepting real payments."
    );

  });

}

function statusClass(status) {

  if (status === "completed") return "green";
  if (status === "in_progress") return "blue";

  return "gray";
}

function formatStatus(status) {

  if (status === "completed") return "Completed";
  if (status === "in_progress") return "In Progress";

  return "Not Started";
}

function escapeHtml(value) {

  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function formatAudit(text) {

  return escapeHtml(text)
    .replace(/\*\*(.*?)\*\*/g, "<strong>$1</strong>")
    .replace(/\n/g, "<br>");
}
