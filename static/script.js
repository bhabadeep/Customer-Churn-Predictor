document.addEventListener("DOMContentLoaded", () => {
  const tenureInput = document.getElementById("tenure");
  const tenureBadge = document.getElementById("tenureBadge");
  const monthlyChargesInput = document.getElementById("MonthlyCharges");
  const totalChargesInput = document.getElementById("TotalCharges");
  const submitBtn = document.getElementById("submitBtn");

  const checkSecurity = document.getElementById("check_security");
  const checkSupport = document.getElementById("check_support");
  const checkBackup = document.getElementById("check_backup");
  const checkProtection = document.getElementById("check_protection");
  const checkTv = document.getElementById("check_tv");
  const checkMovies = document.getElementById("check_movies");

  const loadFlightRiskBtn = document.getElementById("loadFlightRisk");
  const loadLoyalBtn = document.getElementById("loadLoyal");

  // Sync tenure slider
  tenureInput.addEventListener("input", (e) => {
    const months = parseInt(e.target.value);
    tenureBadge.textContent = `${months} M`;
    const monthly = parseFloat(monthlyChargesInput.value) || 0;
    totalChargesInput.value = (months * monthly).toFixed(2);
  });

  monthlyChargesInput.addEventListener("input", (e) => {
    const monthly = parseFloat(e.target.value) || 0;
    const months = parseInt(tenureInput.value) || 0;
    totalChargesInput.value = (months * monthly).toFixed(2);
  });

  // Profile 1: High-Risk Profile
  loadFlightRiskBtn.addEventListener("click", () => {
    document.getElementById("Contract").value = "Month-to-month";
    tenureInput.value = 2;
    tenureBadge.textContent = "2 M";
    monthlyChargesInput.value = 85.50;
    totalChargesInput.value = 171.00;
    document.getElementById("PaymentMethod").value = "Electronic check";
    document.getElementById("InternetService").value = "Fiber optic";

    checkSecurity.checked = false;
    checkSupport.checked = false;
    checkBackup.checked = false;
    checkProtection.checked = false;
    checkTv.checked = true;
    checkMovies.checked = false;

    document.getElementById("SeniorCitizen").value = "0";
    document.getElementById("Partner").value = "No";
    document.getElementById("Dependents").value = "No";
    document.getElementById("PaperlessBilling").value = "Yes";

    submitBtn.click();
  });

  // Profile 2: Low-Risk Profile
  loadLoyalBtn.addEventListener("click", () => {
    document.getElementById("Contract").value = "Two year";
    tenureInput.value = 60;
    tenureBadge.textContent = "60 M";
    monthlyChargesInput.value = 52.00;
    totalChargesInput.value = 3120.00;
    document.getElementById("PaymentMethod").value = "Credit card (automatic)";
    document.getElementById("InternetService").value = "DSL";

    checkSecurity.checked = true;
    checkSupport.checked = true;
    checkBackup.checked = true;
    checkProtection.checked = true;
    checkTv.checked = false;
    checkMovies.checked = false;

    document.getElementById("SeniorCitizen").value = "0";
    document.getElementById("Partner").value = "Yes";
    document.getElementById("Dependents").value = "Yes";
    document.getElementById("PaperlessBilling").value = "No";

    submitBtn.click();
  });

  // Predict Handler
  submitBtn.addEventListener("click", async () => {
    submitBtn.disabled = true;
    submitBtn.textContent = "PROCESSING...";

    const payload = {
      gender: document.getElementById("gender").value,
      SeniorCitizen: parseInt(document.getElementById("SeniorCitizen").value),
      Partner: document.getElementById("Partner").value,
      Dependents: document.getElementById("Dependents").value,
      tenure: parseInt(document.getElementById("tenure").value),
      PhoneService: document.getElementById("PhoneService").value,
      MultipleLines: "No",
      InternetService: document.getElementById("InternetService").value,
      OnlineSecurity: checkSecurity.checked ? "Yes" : "No",
      OnlineBackup: checkBackup.checked ? "Yes" : "No",
      DeviceProtection: checkProtection.checked ? "Yes" : "No",
      TechSupport: checkSupport.checked ? "Yes" : "No",
      StreamingTV: checkTv.checked ? "Yes" : "No",
      StreamingMovies: checkMovies.checked ? "Yes" : "No",
      Contract: document.getElementById("Contract").value,
      PaperlessBilling: document.getElementById("PaperlessBilling").value,
      PaymentMethod: document.getElementById("PaymentMethod").value,
      MonthlyCharges: parseFloat(monthlyChargesInput.value),
      TotalCharges: parseFloat(totalChargesInput.value)
    };

    try {
      const response = await fetch("/predict", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!response.ok) throw new Error(`Server Error: ${response.status}`);

      const data = await response.json();
      renderResults(data, payload);
    } catch (err) {
      alert(`ERROR: ${err.message}`);
    } finally {
      submitBtn.disabled = false;
      submitBtn.textContent = "EXECUTE PREDICTION";
    }
  });

  function renderResults(data, payload) {
    const probVal = data.churn_probability;
    const probPct = (probVal * 100).toFixed(1);

    document.getElementById("probDisplay").textContent = `${probPct}%`;

    // Radial Gauge Fill (Circumference 2 * PI * 38 = 238.76)
    const circumference = 238.76;
    const offset = circumference - (probVal * circumference);
    const circle = document.getElementById("radialProgress");
    circle.style.strokeDashoffset = offset;

    const badge = document.getElementById("riskBadge");
    const decision = document.getElementById("decisionLabel");
    const recContainer = document.getElementById("recContainer");

    // Brutalist Color Treatments (Black, White, Stark Red/Blue)
    if (data.risk_tier === "High Risk") {
      badge.textContent = "HIGH RISK";
      badge.className = "font-bold uppercase tracking-widest text-sm px-3 py-1 border-2 border-black bg-black text-white";
      circle.style.stroke = "#E60000"; // Swiss Red
      decision.style.color = "#E60000";
    } else if (data.risk_tier === "Medium Risk") {
      badge.textContent = "MEDIUM RISK";
      badge.className = "font-bold uppercase tracking-widest text-sm px-3 py-1 border-2 border-black bg-white text-black";
      circle.style.stroke = "#FF9900"; // Sharp Orange
      decision.style.color = "#000000";
    } else {
      badge.textContent = "LOW RISK";
      badge.className = "font-bold uppercase tracking-widest text-sm px-3 py-1 border-2 border-black bg-black text-white";
      circle.style.stroke = "#0000FF"; // Pure Blue
      decision.style.color = "#000000";
    }

    if (data.will_churn) {
      decision.textContent = "WILL CHURN";
    } else {
      decision.textContent = "RETAINED";
    }

    recContainer.textContent = data.recommendation;

    // Feature Signals
    const signalsContainer = document.getElementById("riskSignals");
    signalsContainer.innerHTML = "";

    const signals = [];
    if (payload.Contract === "Month-to-month") {
      signals.push("CONTRACT: MONTH-TO-MONTH");
    } else {
      signals.push(`CONTRACT: ${payload.Contract.toUpperCase()}`);
    }

    if (payload.InternetService === "Fiber optic") {
      signals.push("ISP: FIBER OPTIC");
    }

    if (payload.PaymentMethod === "Electronic check") {
      signals.push("PAYMENT: E-CHECK");
    }

    if (payload.tenure <= 6) {
      signals.push("LIFECYCLE: < 6 MONTHS");
    } else if (payload.tenure >= 36) {
      signals.push("LIFECYCLE: > 3 YEARS");
    }

    signals.forEach(s => {
      const span = document.createElement("span");
      span.className = "text-xs font-bold px-2 py-1 bg-white text-black uppercase tracking-widest";
      span.textContent = s;
      signalsContainer.appendChild(span);
    });
  }
});