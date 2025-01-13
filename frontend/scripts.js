const loginContainer = document.getElementById('login-container');
const chatInterface = document.getElementById('chat-interface');
const loginForm = document.getElementById('login-form');
const chatContainer = document.getElementById('chat-container');
const messageInput = document.getElementById('message-input');
const sendButton = document.getElementById('send-button');
const userInfo = document.getElementById('user-info');
const usernameDisplay = document.getElementById('username-display');
const logoutButton = document.getElementById('logout-button');

const apiKey = 'TPF9FA3-1DR4SQH-Q0KPW92-MS0WYS7';
const apiBaseUrl = 'http://localhost:3001/api';

const headers = {
    'Authorization': `Bearer ${apiKey}`,
    'Content-Type': 'application/json'
};

let currentUser = null;
let currentThread = null;

// Función para iniciar sesión
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault();const loginContainer = document.getElementById('login-container');
    const chatInterface = document.getElementById('chat-interface');
    const loginForm = document.getElementById('login-form');
    const chatContainer = document.getElementById('chat-container');
    const messageInput = document.getElementById('message-input');
    const sendButton = document.getElementById('send-button');
    const userInfo = document.getElementById('user-info');
    const usernameDisplay = document.getElementById('username-display');
    const logoutButton = document.getElementById('logout-button');
    
    const apiKey = 'TPF9FA3-1DR4SQH-Q0KPW92-MS0WYS7';
    const apiBaseUrl = 'http://localhost:3001/api';
    
    const headers = {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
    };
    
    let currentUser = null;
    let currentThread = null;
    
    // Función para iniciar sesión
    loginForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const username = document.getElementById('username').value;
        const password = document.getElementById('password').value;
    
        // Simula inicio de sesión exitoso
        currentUser = username;
        currentThread = `${username}-chat`; // Asigna un hilo único basado en el usuario
        await resetThread(currentThread);
    
        loginContainer.style.display = 'none';
        chatInterface.style.display = 'flex';
        userInfo.style.display = 'flex';
        usernameDisplay.textContent = username;
    
        // Mensaje de bienvenida
        addMessage(`Benvingut/da, ${username}! El teu fil està preparat.`);
    });
    
    // Agregar mensajes al chat
    function addMessage(message, isUser = false, sources = []) {
        const messageElement = document.createElement('div');
        messageElement.classList.add('message');
        messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
        messageElement.innerHTML = message.replace(/\n/g, '<br>');
        messageElement.style.opacity = '0';
        messageElement.style.transform = 'translateY(20px)'; // Initial position for animation
        chatContainer.appendChild(messageElement);
    
        if (!isUser && sources.length > 0) {
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
            messageElement.appendChild(docsElement);
    
            // Add click event to toggle dropdown
            docsElement.querySelector('.dropdown-button').addEventListener('click', () => {
                dropdownContent.classList.toggle('show');
            });
        }
    
        chatContainer.scrollTop = chatContainer.scrollHeight;
    
        // Add a subtle animation to the new message
        setTimeout(() => {
            messageElement.style.opacity = '1';
            messageElement.style.transform = 'translateY(0)';
        }, 50);
    }
    
    // Enviar mensajes al servidor
    function sendMessage() {
        const message = messageInput.value.trim();
        if (message && currentThread) {
            addMessage(message, true);
            messageInput.value = '';
    
            // Disable send button and show loading indicator
            sendButton.disabled = true;
            sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviant...';
    
            const url = `${apiBaseUrl}/v1/workspace/stic/thread/${currentThread}/chat`;
            fetch(url, {
                method: 'POST',
                headers: headers,
                body: JSON.stringify({ role: "user", message, mode: "chat" }),
            })
            .then(response => response.json())
            .then(data => {
                const botResponse = data.textResponse || "Gracias por tu mensaje.";
                addMessage(botResponse, false, data.sources);
            })
            .catch(error => {
                console.error("Error:", error);
                addMessage("Hi ha hagut un error en la connexió. Intenta-ho de nou més tard.");
            })
            .finally(() => {
                // Re-enable send button and restore original text
                sendButton.disabled = false;
                sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Envia';
            });
        }
    }
    
    // Reiniciar el hilo de un usuario
    async function resetThread(threadName) {
        const threadSlug = threadName.toLowerCase().replace(" ", "-");
        const deleteUrl = `${apiBaseUrl}/workspace/stic/thread/${threadSlug}`;
    
        try {
            // Elimina el hilo si existe
            await fetch(deleteUrl, { method: 'DELETE', headers });
    
            // Crea un nuevo hilo
            const createUrl = `${apiBaseUrl}/v1/workspace/stic/thread/new`;
            const response = await fetch(createUrl, {
                method: 'POST',
                headers,
                body: JSON.stringify({ userId: currentUser, name: threadName, slug: threadSlug }),
            });
    
            if (response.ok) {
                const threadData = await response.json();
                currentThread = threadData.thread.slug;
                console.log(`Hilo '${threadName}' reiniciado.`);
            }
        } catch (error) {
            console.error("Error al reiniciar el hilo:", error);
        }
    }
    
    // Programar el reinicio diario de los hilos
    function scheduleDailyReset() {
        const now = new Date();
        const nextReset = new Date();
        nextReset.setHours(0, 0, 0, 0);
        nextReset.setDate(now.getDate() + 1);
    
        const timeUntilReset = nextReset - now;
        setTimeout(() => {
            resetThread();
            scheduleDailyReset();
        }, timeUntilReset);
    }

    
    // Logout function
    function logout() {
        currentUser = null;
        currentThread = null;
        chatContainer.innerHTML = '';
        loginContainer.style.display = 'block';
        chatInterface.style.display = 'none';
        userInfo.style.display = 'none';
        document.getElementById('username').value = '';
        document.getElementById('password').value = '';
    }
    
    // Configurar eventos
    sendButton.addEventListener('click', sendMessage);
    messageInput.addEventListener('keypress', (e) => {
        if (e.key === 'Enter') sendMessage();
    });
    logoutButton.addEventListener('click', logout);
    
    // Add smooth scrolling to chat container
    chatContainer.addEventListener('scroll', () => {
        if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100) {
            chatContainer.scrollTo({
                top: chatContainer.scrollHeight,
                behavior: 'smooth'
            });
        }
    });
    
    // Iniciar programación de reseteo diario
    scheduleDailyReset();
    
    // Add a subtle animation when the page loads
    document.addEventListener('DOMContentLoaded', () => {
        document.body.style.opacity = '1';
    });
    
    // Add a subtle animation to the logo
    const loginLogo = document.querySelector('.login-logo');
    if (loginLogo) {
        loginLogo.addEventListener('mouseover', () => {
            loginLogo.style.transform = 'scale(1.1)';
            loginLogo.style.transition = 'transform 0.3s ease';
        });
        loginLogo.addEventListener('mouseout', () => {
            loginLogo.style.transform = 'scale(1)';
        });
    }
    
    
    const username = document.getElementById('username').value;
    const password = document.getElementById('password').value;

    // Simula inicio de sesión exitoso
    currentUser = username;
    currentThread = `${username}-chat`; // Asigna un hilo único basado en el usuario
    await resetThread(currentThread);

    loginContainer.style.display = 'none';
    chatInterface.style.display = 'flex';
    userInfo.style.display = 'flex';
    usernameDisplay.textContent = username;

    // Mensaje de bienvenida
    addMessage(`Benvingut/da, ${username}! El teu fil està preparat.`);
});

// Agregar mensajes al chat
function addMessage(message, isUser = false, sources = []) {
    const messageElement = document.createElement('div');
    messageElement.classList.add('message');
    messageElement.classList.add(isUser ? 'user-message' : 'bot-message');
    messageElement.innerHTML = message.replace(/\n/g, '<br>');
    messageElement.style.opacity = '0';
    messageElement.style.transform = 'translateY(20px)'; // Initial position for animation
    chatContainer.appendChild(messageElement);

    if (!isUser && sources.length > 0) {
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
        messageElement.appendChild(docsElement);

        // Add click event to toggle dropdown
        docsElement.querySelector('.dropdown-button').addEventListener('click', () => {
            dropdownContent.classList.toggle('show');
        });
    }

    chatContainer.scrollTop = chatContainer.scrollHeight;

    // Add a subtle animation to the new message
    setTimeout(() => {
        messageElement.style.opacity = '1';
        messageElement.style.transform = 'translateY(0)';
    }, 50);
}

// Enviar mensajes al servidor
function sendMessage() {
    const message = messageInput.value.trim();
    if (message && currentThread) {
        addMessage(message, true);
        messageInput.value = '';

        // Disable send button and show loading indicator
        sendButton.disabled = true;
        sendButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Enviant...';

        const url = `${apiBaseUrl}/v1/workspace/stic/thread/${currentThread}/chat`;
        fetch(url, {
            method: 'POST',
            headers: headers,
            body: JSON.stringify({ role: "user", message, mode: "chat" }),
        })
        .then(response => response.json())
        .then(data => {
            const botResponse = data.textResponse || "Gracias por tu mensaje.";
            addMessage(botResponse, false, data.sources);
        })
        .catch(error => {
            console.error("Error:", error);
            addMessage("Hi ha hagut un error en la connexió. Intenta-ho de nou més tard.");
        })
        .finally(() => {
            // Re-enable send button and restore original text
            sendButton.disabled = false;
            sendButton.innerHTML = '<i class="fas fa-paper-plane"></i> Envia';
        });
    }
}

// Reiniciar el hilo de un usuario
async function resetThread(threadName) {
    const threadSlug = threadName.toLowerCase().replace(" ", "-");
    const deleteUrl = `${apiBaseUrl}/workspace/stic/thread/${threadSlug}`;

    try {
        // Elimina el hilo si existe
        await fetch(deleteUrl, { method: 'DELETE', headers });

        // Crea un nuevo hilo
        const createUrl = `${apiBaseUrl}/v1/workspace/stic/thread/new`;
        const response = await fetch(createUrl, {
            method: 'POST',
            headers,
            body: JSON.stringify({ userId: currentUser, name: threadName, slug: threadSlug }),
        });

        if (response.ok) {
            const threadData = await response.json();
            currentThread = threadData.thread.slug;
            console.log(`Hilo '${threadName}' reiniciado.`);
        }
    } catch (error) {
        console.error("Error al reiniciar el hilo:", error);
    }
}

// Reinicia todos los hilos
async function resetThread() {
    if (currentUser) {
        await resetThread(`${currentUser}-chat`);
    }
}

// Logout function
function logout() {
    currentUser = null;
    currentThread = null;
    chatContainer.innerHTML = '';
    loginContainer.style.display = 'block';
    chatInterface.style.display = 'none';
    userInfo.style.display = 'none';
    document.getElementById('username').value = '';
    document.getElementById('password').value = '';
}

// Configurar eventos
sendButton.addEventListener('click', sendMessage);
messageInput.addEventListener('keypress', (e) => {
    if (e.key === 'Enter') sendMessage();
});
logoutButton.addEventListener('click', logout);

// Add smooth scrolling to chat container
chatContainer.addEventListener('scroll', () => {
    if (chatContainer.scrollTop + chatContainer.clientHeight >= chatContainer.scrollHeight - 100) {
        chatContainer.scrollTo({
            top: chatContainer.scrollHeight,
            behavior: 'smooth'
        });
    }
});

// Add a subtle animation when the page loads
document.addEventListener('DOMContentLoaded', () => {
    document.body.style.opacity = '1';
});

