// app.js

const $ = selector => document.querySelector(selector);

const loginModal = $("#loginModal");
const portalModal = $("#portalModal");


// ===============================
// OPEN / CLOSE LOGIN
// ===============================

document.querySelectorAll("[data-login]").forEach(button => {

  button.addEventListener("click", () => {
    loginModal.classList.remove("hidden");
  });

});


document.querySelectorAll("[data-close]").forEach(button => {

  button.addEventListener("click", () => {
    loginModal.classList.add("hidden");
  });

});


// ===============================
// PASSWORD STRENGTH
// ===============================

const password = $("#password");
const strengthBox = $("#strengthBox");
const strengthLabel = $("#strengthLabel");
const passwordHint = $("#passwordHint");

function updatePasswordStrength(){

  const value = password.value;

  let score = 0;

  if(value.length >= 10){
    score++;
  }

  if(/[a-z]/.test(value)){
    score++;
  }

  if(/[A-Z]/.test(value)){
    score++;
  }

  if(/[0-9]/.test(value)){
    score++;
  }

  if(/[^A-Za-z0-9]/.test(value)){
    score++;
  }


  let level = 0;

  if(value.length === 0){
    level = 0;
  }
  else if(score <= 2){
    level = 1;
  }
  else if(score === 3){
    level = 2;
  }
  else if(score === 4){
    level = 3;
  }
  else{
    level = 4;
  }


  const labels = [
    "Enter password",
    "Weak",
    "Medium",
    "Strong",
    "Very strong"
  ];

  strengthBox.dataset.level = level;
  strengthLabel.textContent = labels[level];


  if(level >= 4){

    passwordHint.textContent =
      "Excellent — your password meets all VeloClient requirements.";

  }
  else{

    passwordHint.textContent =
      "10+ characters · uppercase · lowercase · number · symbol";

  }

}


password.addEventListener(
  "input",
  updatePasswordStrength
);


// ===============================
// SHOW / HIDE PASSWORD
// ===============================

$("#togglePassword").addEventListener("click", () => {

  if(password.type === "password"){

    password.type = "text";

    $("#togglePassword").textContent = "Hide";

  }
  else{

    password.type = "password";

    $("#togglePassword").textContent = "Show";

  }

});


// ===============================
// EMAIL LOGIN
// ===============================

$("#loginForm").addEventListener("submit", event => {

  event.preventDefault();


  if(!password.checkValidity()){

    password.reportValidity();

    return;

  }


  const email = $("#email").value.trim();

  localStorage.setItem(
    "veloclient_user",
    email
  );


  loginModal.classList.add("hidden");

  portalModal.classList.remove("hidden");

});


// ===============================
// SOCIAL LOGIN
// ===============================

document.querySelectorAll("[data-provider]").forEach(button => {

  button.addEventListener("click", () => {

    const provider = button.dataset.provider;

    /*
      Connect these buttons to real OAuth before production.

      Google:
      https://developers.google.com/identity

      Apple:
      https://developer.apple.com/sign-in/

      LinkedIn:
      https://learn.microsoft.com/linkedin/

      Do NOT fake successful authentication.
    */

    alert(
      provider +
      " OAuth is ready for integration. " +
      "Connect your " +
      provider +
      " OAuth credentials before production."
    );

  });

});


// ===============================
// CREATE ACCOUNT
// ===============================

$("#createAccount").addEventListener("click", () => {

  alert(
    "Connect this button to your real authentication provider to create accounts."
  );

});


// ===============================
// CLIENT PORTAL
// ===============================

$("#closePortal").addEventListener("click", () => {

  portalModal.classList.add("hidden");

});


// ===============================
// GEMINI AI
// ===============================

$("#askAI").addEventListener("click", async () => {

  const input = $("#aiPrompt");
  const output = $("#aiResponse");

  const prompt = input.value.trim();


  if(!prompt){

    output.textContent =
      "Type a request first.";

    return;

  }


  output.textContent = "Thinking…";


  try{

    const response = await fetch(
      "/api/gemini",
      {
        method:"POST",

        headers:{
          "Content-Type":"application/json"
        },

        body:JSON.stringify({
          prompt:prompt
        })
      }
    );


    const data = await response.json();


    if(!response.ok){

      throw new Error(
        data.error ||
        "Gemini request failed."
      );

    }


    output.textContent =
      data.text ||
      "No response returned.";

  }

  catch(error){

    output.textContent =
      "Gemini is not connected yet. Add GEMINI_API_KEY to your server environment variables.";

  }

});
