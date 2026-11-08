(function () {
  var AUTH_KEY = "doors_admin_auth_v1";

  function _d(s) {
    try {
      return decodeURIComponent(escape(atob(s)));
    } catch (e) {
      try { return atob(s); } catch (e2) { return ""; }
    }
  }

  // credentials are not stored as plain text
  var _u = _d("QWRtaW5HZXREb29yczQy");
  var _p = _d("NjY2MDA2");

  var gate = document.getElementById("authGate");
  var form = document.getElementById("authForm");
  var loginInput = document.getElementById("authLogin");
  var passInput = document.getElementById("authPass");
  var err = document.getElementById("authError");

  function isAuthed() {
    try {
      return sessionStorage.getItem(AUTH_KEY) === "ok";
    } catch (e) {
      return false;
    }
  }

  function setAuthed() {
    try {
      sessionStorage.setItem(AUTH_KEY, "ok");
    } catch (e) {}
  }

  function unlock() {
    document.body.classList.add("is-authed");
    if (gate) gate.hidden = true;
  }

  function lock() {
    document.body.classList.remove("is-authed");
    if (gate) {
      gate.hidden = false;
    }
    if (loginInput) loginInput.focus();
  }

  // strip any credentials from URL if they somehow got there
  try {
    if (location.search || location.hash) {
      var clean = location.pathname + (location.hash && location.hash.indexOf("=") === -1 ? location.hash : "");
      if (location.search) {
        history.replaceState(null, "", location.pathname);
      }
    }
  } catch (e) {}

  if (isAuthed()) {
    unlock();
  } else {
    lock();
  }

  if (form) {
    form.setAttribute("method", "post");
    form.setAttribute("action", "#");
    form.addEventListener("submit", function (e) {
      e.preventDefault();
      e.stopPropagation();
      var u = (loginInput.value || "").trim();
      var p = passInput.value || "";
      if (u === _u && p === _p) {
        if (err) err.hidden = true;
        setAuthed();
        // clear fields so nothing lingers
        loginInput.value = "";
        passInput.value = "";
        unlock();
      } else {
        if (err) err.hidden = false;
        passInput.value = "";
        passInput.focus();
      }
      return false;
    });
  }
})();
