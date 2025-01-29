const loginContainer = document.getElementById('login-container');
const chatInterface = document.getElementById('chat-interface');
const loginForm = document.getElementById('login-form');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const logoutButton = document.getElementById('logout-button');

const apiKey = '';
const apiBaseUrl = 'http://localhost:3001/api';
const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};

let currentUser = null;
let currentThread = null;

loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    
    currentUser = document.getElementById('username').value;
    const password = document.getElementById('password').value;
    

    // Comprobar si el usuario existe.


    currentThread = `${currentUser}-chat`;
    
    await resetThread(currentThread);
    
    loginContainer.style.display = 'none';
    chatInterface.style.display = 'flex';
    userInfo.style.display = 'flex';
    usernameDisplay.textContent = currentUser;
    
    addMessage(`Benvingut/da, ${currentUser}! El teu fil està preparat.`);
});

function addMessage(message, isUser = false, sources = []) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message', isUser ? 'user-message' : 'bot-message');
    chatContainer.appendChild(messageElement);
    
    if (!isUser) {
        let index = 0;
        const interval = setInterval(() => {
            if (index < message.length) {
                messageElement.textContent += message.charAt(index++);
            } else {
                clearInterval(interval);
                if (sources.length) addSources(messageElement, sources);
            }
        }, 50);
    } else {
        messageElement.textContent = message;
    }
}

function addSources(parentElement, sources) {
    const docsElement = document.createElement('div');
    docsElement.classList.add('referenced-docs');
    docsElement.innerHTML = `<button class="dropdown-button">Documents referenciats</button>`;
    
    const dropdownContent = document.createElement('div');
    dropdownContent.classList.add('dropdown-content');
    sources.forEach(source => {
        const docElement = document.createElement('div');
        docElement.classList.add('doc-reference');
        docElement.innerHTML = `<h4>${source.title}</h4><p>${source.text}</p>`;
        dropdownContent.appendChild(docElement);
    });
    
    docsElement.appendChild(dropdownContent);
    parentElement.appendChild(docsElement);
    docsElement.querySelector('.dropdown-button').addEventListener('click', () => dropdownContent.classList.toggle('show'));
}

function sendMessage() {
    const message = messageInput.value.trim();
    if (!message || !currentThread) return;
    
    addMessage(message, true);
    messageInput.value = '';
    sendButton.disabled = true;
    sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Pensant...';
    
    fetch(`${apiBaseUrl}/v1/workspace/stic/thread/${currentThread}/chat`, {
        method: 'POST', headers, body: JSON.stringify({ role: "user", message, mode: "chat" })
    })
    .then(response => response.json())
    .then(data => addMessage(data.textResponse || "Gracias por tu mensaje.", false, data.sources))
    .catch(() => addMessage("Hi ha hagut un error en la connexió. Intenta-ho de nou més tard."))
    .finally(() => {
        sendButton.disabled = false;
        sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Envia';
    });
}

async function resetThread(threadName) {
    const threadSlug = threadName.toLowerCase().replace(/\s+/g, "-");
    try {
        await fetch(`${apiBaseUrl}/workspace/stic/thread/${threadSlug}`, { method: 'DELETE', headers });
        const response = await fetch(`${apiBaseUrl}/v1/workspace/stic/thread/new`, {
            method: 'POST', headers,
            body: JSON.stringify({ userId: currentUser, name: threadName, slug: threadSlug })
        });
        if (response.ok) currentThread = (await response.json()).thread.slug;
    } catch (error) {
        console.error("Error al reiniciar el hilo:", error);
    }
}

function logout() {
    currentUser = currentThread = null;
    chatContainer.innerHTML = '';
    loginContainer.style.display = 'block';
    chatInterface.style.display = userInfo.style.display = 'none';
    loginForm.reset();
}

sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => e.key === 'Enter' && sendMessage());
logoutButton.addEventListener('click', logout);

document.addEventListener('DOMContentLoaded', () => document.body.style.opacity = '1');