function runDiagnostics() {
    const pingEl = document.getElementById("pingValue");
    const logEl = document.getElementById("logOutput");
    const btnEl = document.getElementById("testBtn");

    btnEl.disabled = true;
    btnEl.textContent = "Midiendo...";
    logEl.innerHTML = "[INFO] Iniciando sondeo de red local...<br>";

    setTimeout(() => {
        const simulatedPing = Math.floor(Math.random() * 15) + 3; // Entre 3 y 18 ms
        pingEl.textContent = `${simulatedPing} ms`;
        
        logEl.innerHTML += `[SUCCESS] Paquete ACK recibido en ${simulatedPing}ms.<br>`;
        logEl.innerHTML += `[INFO] Estado de la malla: Estable.`;
        
        btnEl.disabled = false;
        btnEl.textContent = "Ejecutar Diagnóstico";
    }, 800);
}