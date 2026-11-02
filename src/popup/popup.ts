import { checkDaemonHealth, getConfig, saveConfig } from '../common/config.js';
import type { SupportedVoice } from '../common/types.js';

const hostInput = document.getElementById('ollama-host') as HTMLInputElement;
const modelInput = document.getElementById('model-name') as HTMLInputElement;
const voiceSelect = document.getElementById('voice-select') as HTMLSelectElement;
const form = document.getElementById('settings-form') as HTMLFormElement;
const checkBtn = document.getElementById('check-btn') as HTMLButtonElement;
const statusIndicator = document.getElementById('status-indicator') as HTMLElement;
const statusCard = document.getElementById('status-card') as HTMLElement;
const statusMessage = document.getElementById('status-message') as HTMLElement;

async function checkConnection(host: string, model: string) {
  statusMessage.textContent = 'Verifying connection to Ollama...';
  statusCard.className = 'status-card';

  const health = await checkDaemonHealth(host, model);

  if (health.isOnline && health.hasModel) {
    statusIndicator.className = 'status-dot online';
    statusIndicator.title = 'Connected: Ollama online & model ready';
    statusCard.className = 'status-card success';
    statusMessage.textContent = `Connected to Ollama on ${host}. Model '${model}' ready for synthesis.`;
  } else {
    statusIndicator.className = 'status-dot offline';
    statusIndicator.title = health.errorMessage || 'Offline';
    statusCard.className = 'status-card error';
    statusMessage.textContent = health.errorMessage || 'Cannot reach Ollama daemon.';
  }
}

async function load() {
  const config = await getConfig();
  hostInput.value = config.ollamaHost;
  modelInput.value = config.modelName;
  voiceSelect.value = config.selectedVoice;

  await checkConnection(config.ollamaHost, config.modelName);
}

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  const ollamaHost = hostInput.value.trim();
  const modelName = modelInput.value.trim();
  const selectedVoice = voiceSelect.value as SupportedVoice;

  await saveConfig({ ollamaHost, modelName, selectedVoice });

  statusMessage.textContent = 'Settings saved.';
  statusCard.className = 'status-card success';

  await checkConnection(ollamaHost, modelName);
});

checkBtn.addEventListener('click', async () => {
  const ollamaHost = hostInput.value.trim();
  const modelName = modelInput.value.trim();
  await checkConnection(ollamaHost, modelName);
});

document.addEventListener('DOMContentLoaded', load);
