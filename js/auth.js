document.addEventListener("DOMContentLoaded", () => {

  const loginForm = document.getElementById("loginForm");
  const signupForm = document.getElementById("signupForm");

  if (loginForm) {
    loginForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const message = document.getElementById("message");

      message.textContent = "Signing you in...";

      const { error } = await supabaseClient.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        message.textContent = error.message;
        return;
      }

      window.location.href = "dashboard.html";
    });
  }

  if (signupForm) {
    signupForm.addEventListener("submit", async (event) => {
      event.preventDefault();

      const name = document.getElementById("name").value.trim();
      const agency = document.getElementById("agency").value.trim();
      const email = document.getElementById("email").value.trim();
      const password = document.getElementById("password").value;
      const message = document.getElementById("message");

      message.textContent = "Creating your account...";

      const { data, error } = await supabaseClient.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: name,
            agency_name: agency
          }
        }
      });

      if (error) {
        message.textContent = error.message;
        return;
      }

      if (data.session) {
        window.location.href = "dashboard.html";
        return;
      }

      message.textContent =
        "Account created. Check your email to confirm your account.";
    });
  }

});
