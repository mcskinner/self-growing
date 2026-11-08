const element = id => document.getElementById(id);
let prompt;
async function post(path, body = {}) {
  const response = await fetch(`/api/auth/${path}`, {
    method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body),
  });
  if (!response.ok) throw new Error((await response.json()).detail);
}
element('login').onclick = () => action(() => post('login', { provider: element('provider').value }));
element('cancel').onclick = () => action(() => post('cancel'));
element('prompt').onsubmit = event => {
  event.preventDefault();
  if (prompt) void action(() => post('answer', {
    id: prompt.id, value: element(prompt.type === 'select' ? 'choice' : 'answer').value,
  }));
};
async function action(callback) {
  try { await callback(); await poll(); }
  catch (error) { element('status').textContent = String(error); }
}
async function poll() {
  const response = await fetch('/api/auth');
  if (!response.ok) throw new Error('Login host unavailable');
  const state = await response.json();
  const providers = element('provider');
  if (!providers.options.length) {
    for (const provider of state.providers) providers.add(new Option(provider.name, provider.id));
  }
  element('status').textContent = state.error || state.status;
  element('login').disabled = state.status === 'running';
  const link = element('link');
  link.hidden = !state.url;
  if (state.url) link.href = state.url;
  else link.removeAttribute('href');
  element('code').textContent = state.code || '';
  element('prompt').hidden = !state.prompt;
  if (prompt?.id !== state.prompt?.id) {
    element('answer').value = '';
    element('choice').replaceChildren();
    if (state.prompt) {
      element('label').textContent = state.prompt.message;
      element('answer').hidden = state.prompt.type === 'select';
      element('choice').hidden = state.prompt.type !== 'select';
      for (const option of state.prompt.options || []) element('choice').add(new Option(option.label, option.id));
    }
  }
  prompt = state.prompt;
}
await action(poll);
setInterval(() => void action(poll), 500);
