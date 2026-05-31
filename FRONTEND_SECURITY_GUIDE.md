# 🔐 Guia de Segurança para Frontend HTML/JavaScript

## 📋 Índice
1. [Evitar Exposição de .git](#evitar-exposição-de-git)
2. [Proteger Chaves de API](#proteger-chaves-de-api)
3. [Prevenir XSS](#prevenir-xss)
4. [Content Security Policy](#content-security-policy)
5. [Validação de Entrada](#validação-de-entrada)
6. [Armazenamento Seguro](#armazenamento-seguro)
7. [Boas Práticas](#boas-práticas)

---

## Evitar Exposição de .git

### ❌ O QUE NÃO FAZER

```bash
# Nunca deixar .git acessível publicamente
# Isso exporia todo o histórico de commits

# Nunca fazer commit de:
git add .git
git add .gitignore

# Nunca expor credenciais em histórico
git commit -m "API_KEY=sk_live_123456"
```

### ✅ O QUE FAZER

```bash
# Verificar se .git está em .gitignore
grep -q '.git' .gitignore && echo "✅ Protegido"

# Se usando servidor web, configure para negar acesso
# .htaccess (Apache):
<Directory ~ "\.git">
    Deny from all
</Directory>

# nginx.conf:
location ~ /\.git {
    deny all;
}

# Verificar que .gitignore está versionado
git ls-files | grep gitignore

# Verificar que .env não foi commitado
git log --all --full-history -- .env
```

---

## Proteger Chaves de API

### ❌ EXPOSIÇÃO DE API KEYS

```javascript
// ❌ PÉSSIMO - API Key no código
const API_KEY = 'sk_live_abc123xyz789';
fetch('https://api.exemplo.com/data', {
    headers: { 'Authorization': `Bearer ${API_KEY}` }
});

// ❌ PÉSSIMO - API Key em comentário
// API_KEY: sk_test_123456
const data = fetchData();

// ❌ PÉSSIMO - API Key em variável global
window.API_KEY = 'sk_live_abc123';

// ❌ PÉSSIMO - API Key no console.log
console.log('Token:', token);
```

### ✅ PROTEGER API KEYS

```javascript
// ✅ BOM - Usar backend como proxy
// Frontend faz requisição para seu servidor
fetch('/api/data', {
    method: 'GET',
    credentials: 'same-origin' // Envia cookies HTTPOnly
});

// Backend (Node.js/Express):
app.get('/api/data', (req, res) => {
    // API_KEY está protegida no servidor
    // Variável de ambiente (.env)
    const API_KEY = process.env.API_KEY;
    
    // Fazer requisição com chave protegida
    fetch('https://api.exemplo.com/data', {
        headers: { 'Authorization': `Bearer ${API_KEY}` }
    })
    .then(r => r.json())
    .then(data => res.json(data));
});

// ✅ BOM - Se absolutamente necessário no frontend:
// Use API Key pública (com restrições)
const PUBLIC_API_KEY = 'pk_live_xyz789'; // Restrita a domínio
// E configure CORS/restrictions no provedor de API
```

### Configuração de API Keys Seguras

```javascript
// Em produção, use:
// 1. HTTPOnly Cookies (servidor envia)
// 2. Backend como proxy
// 3. API Keys com restrições de domínio
// 4. Rate limiting
// 5. IP whitelist (se possível)

// Nunca use:
// ❌ localStorage para tokens
// ❌ sessionStorage para tokens
// ❌ Cookies sem HttpOnly
// ❌ Cookies sem Secure
// ❌ Cookies sem SameSite
```

---

## Prevenir XSS

### ❌ VULNERÁVEL A XSS

```javascript
// ❌ PÉSSIMO - innerHTML com entrada do usuário
const userInput = '<img src=x onerror="alert(\'XSS\')">';
document.getElementById('output').innerHTML = userInput;
// Resultado: Script malicioso executa!

// ❌ PÉSSIMO - Concatenar HTML manualmente
const name = getUserInput();
const html = `<div>${name}</div>`;
element.innerHTML = html;

// ❌ PÉSSIMO - eval com entrada
const userCode = getUserInput();
eval(userCode); // Executa código arbitrário!

// ❌ PÉSSIMO - new Function com entrada
const userFunc = getUserInput();
new Function(userFunc)(); // Perigoso!

// ❌ PÉSSIMO - document.write com entrada
document.write(userInput); // XSS!
```

### ✅ SEGURO - Prevenir XSS

```javascript
// ✅ BOM - textContent (texto puro)
const userInput = getUserInput();
document.getElementById('output').textContent = userInput;
// Resultado: Texto é escapado, sem XSS

// ✅ BOM - createTextNode
const textNode = document.createTextNode(userInput);
element.appendChild(textNode);

// ✅ BOM - Criar elementos com propriedades
const div = document.createElement('div');
div.textContent = userInput; // Seguro
element.appendChild(div);

// ✅ BOM - Sanitizar HTML (se necessário)
// Use biblioteca: DOMPurify
const clean = DOMPurify.sanitize(userInput);
element.innerHTML = clean;

// ✅ BOM - Template literals com textContent
const template = document.getElementById('user-template');
const clone = template.content.cloneNode(true);
clone.querySelector('.name').textContent = userName;
document.body.appendChild(clone);
```

---

## Content Security Policy

### ✅ CSP RESTRITIVA

```html
<!-- Protege contra XSS, clickjacking, etc -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'nonce-{RANDOM_NONCE}';
    style-src 'self' 'unsafe-inline';
    img-src 'self' data: https:;
    connect-src 'self' https://api.exemplo.com;
    frame-ancestors 'none';
    base-uri 'self';
    form-action 'self';
">
```

### Explicação das Diretivas

```
default-src 'self'
  → Padrão: apenas do mesmo domínio

script-src 'self' 'nonce-{NONCE}'
  → Scripts apenas locais ou com nonce válido
  → Bloqueia scripts inline e eval()

style-src 'self' 'unsafe-inline'
  → Estilos locais e inline (necessário para alguns casos)

img-src 'self' data: https:
  → Imagens do mesmo domínio, data URLs, HTTPS

connect-src 'self' https://api.exemplo.com
  → Requisições fetch/XHR apenas para domínios permitidos

frame-ancestors 'none'
  → Não pode ser colocado em iframe

base-uri 'self'
  → Apenas URLs do mesmo domínio para <base>

form-action 'self'
  → Formulários POST apenas para mesmo domínio
```

---

## Validação de Entrada

### ❌ SEM VALIDAÇÃO

```javascript
// ❌ PÉSSIMO - Sem validação
function submitForm(data) {
    saveToDatabase(data); // Dados não validados!
}

// ❌ PÉSSIMO - Validação fraca
if (email.length > 0) {
    // Não é validação real!
    send(email);
}
```

### ✅ COM VALIDAÇÃO

```javascript
// ✅ BOM - Validação completa
function validateEmail(email) {
    const regex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return regex.test(email) && email.length <= 254;
}

function validateUsername(username) {
    // Apenas alfanuméricos e underscore, 3-20 caracteres
    const regex = /^[a-zA-Z0-9_]{3,20}$/;
    return regex.test(username);
}

function validateMessage(message) {
    // Max 500 caracteres, sem scripts
    if (message.length === 0 || message.length > 500) {
        return false;
    }
    
    // Verificar caracteres perigosos
    const dangerous = /[<>\"'`]/;
    if (dangerous.test(message)) {
        return false;
    }
    
    return true;
}

// Usar validação
if (validateEmail(email) && validateUsername(username)) {
    submitForm({ email, username });
} else {
    alert('Entrada inválida');
}
```

---

## Armazenamento Seguro

### ❌ INSEGURO

```javascript
// ❌ PÉSSIMO - Tokens em localStorage
localStorage.setItem('token', userToken);
// Vulnerável a XSS!

// ❌ PÉSSIMO - Credenciais em sessionStorage
sessionStorage.setItem('password', pass);
// Visível em DevTools!

// ❌ PÉSSIMO - Dados sensíveis em variáveis globais
window.apiKey = 'sk_live_123';
// Acessível por qualquer script!
```

### ✅ SEGURO

```javascript
// ✅ BOM - HTTPOnly Cookies (gerenciado pelo servidor)
// No backend (Express):
res.cookie('token', token, {
    httpOnly: true,  // JavaScript não consegue acessar
    secure: true,    // Apenas HTTPS
    sameSite: 'strict', // Protege contra CSRF
    maxAge: 3600000  // 1 hora
});

// Frontend envia automaticamente em requisições
fetch('/api/data', {
    credentials: 'same-origin' // Inclui cookies
});

// ✅ BOM - Session Storage para dados não-sensíveis
// Limpa quando aba é fechada
sessionStorage.setItem('temp_data', data);

// ✅ BOM - Variáveis locais (escopo)
{
    const token = getTokenFromCookie();
    makeAPICall(token); // Usa localmente
    // token não persiste
}
```

---

## Boas Práticas

### 1. Content Security Policy

```html
<!-- Sempre use CSP -->
<meta http-equiv="Content-Security-Policy" content="
    default-src 'self';
    script-src 'self' 'nonce-RANDOM_VALUE';
    style-src 'self';
">
```

### 2. Headers HTTP de Segurança

```
X-Content-Type-Options: nosniff
X-Frame-Options: DENY
X-XSS-Protection: 1; mode=block
Strict-Transport-Security: max-age=31536000; includeSubDomains
Referrer-Policy: strict-origin-when-cross-origin
```

### 3. HTTPS Obrigatório

```javascript
// Verificar se está em HTTPS
if (window.location.protocol !== 'https:') {
    console.warn('⚠️ Usando HTTP - migre para HTTPS!');
}
```

### 4. Nunca Use

```javascript
❌ eval()
❌ Function() constructor
❌ innerHTML com entrada do usuário
❌ document.write()
❌ setTimeout/setInterval com strings
```

### 5. Sempre Use

```javascript
✅ textContent
✅ createTextNode()
✅ addEventListener()
✅ Validação de entrada
✅ Sanitização (DOMPurify)
✅ CSP headers
```

### 6. Git Security

```bash
# Verificar .env não foi commitado
git log --all --full-history -- .env
# Não deve aparecer nada

# Verificar .git está ignorado
grep .git .gitignore

# Verificar histórico para secrets
gitleaks detect --source . --verbose
```

### 7. Dependencies

```bash
# Verificar vulnerabilidades
npm audit

# Instalar updates
npm audit fix

# Verificar se há pacotes não confiáveis
npm ls
```

---

## Checklist de Segurança

- [ ] `.env` está em `.gitignore`?
- [ ] `.git` está em `.gitignore`?
- [ ] CSP headers estão configurados?
- [ ] Nenhuma API Key no código?
- [ ] Usando `textContent` em vez de `innerHTML`?
- [ ] Validando todas as entradas do usuário?
- [ ] HTTPS habilitado?
- [ ] HTTPOnly cookies para tokens?
- [ ] Sem `eval()` ou `Function()`?
- [ ] `gitleaks` passou?
- [ ] `npm audit` zerado?
- [ ] Sem comentários com chaves/senhas?

---

## Recursos Úteis

- [OWASP Top 10](https://owasp.org/www-project-top-ten/)
- [MDN: Content Security Policy](https://developer.mozilla.org/en-US/docs/Web/HTTP/CSP)
- [Gitleaks](https://github.com/gitleaks/gitleaks)
- [DOMPurify](https://github.com/cure53/DOMPurify)
- [NIST Security Guidelines](https://csrc.nist.gov/publications/detail/sp/800-53/rev-5/final)

---

**Última Atualização:** 2026-05-31
**Status:** ✅ Completo
